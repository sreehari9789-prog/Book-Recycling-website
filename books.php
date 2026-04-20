<?php
// Books API - CRUD operations for books
// File path: /book-recycler/php/api/books.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

session_start();

$database = new Database();
$db = $database->getConnection();

// Helper function to check authentication
function isAuthenticated() {
    return isset($_SESSION['user_id']);
}

// ==================== GET ALL BOOKS WITH FILTERS ====================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && !isset($_GET['action'])) {
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 12;
    $offset = ($page - 1) * $limit;
    
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $category = isset($_GET['category']) ? (int)$_GET['category'] : 0;
    $min_price = isset($_GET['min_price']) ? (float)$_GET['min_price'] : 0;
    $max_price = isset($_GET['max_price']) ? (float)$_GET['max_price'] : 999999;
    
    $query = "SELECT b.*, u.full_name as seller_name, u.email as seller_email, u.phone as seller_phone,
                     c.category_name, 
                     COALESCE(AVG(r.rating), 0) as avg_rating, 
                     COUNT(DISTINCT r.review_id) as review_count
              FROM books b
              JOIN users u ON b.seller_id = u.user_id
              JOIN categories c ON b.category_id = c.category_id
              LEFT JOIN reviews r ON b.book_id = r.book_id
              WHERE b.status = 'available'";
    
    $params = [];
    
    if (!empty($search)) {
        $query .= " AND (b.title LIKE :search OR b.author LIKE :search OR b.description LIKE :search)";
        $params[':search'] = "%{$search}%";
    }
    if ($category > 0) {
        $query .= " AND b.category_id = :category";
        $params[':category'] = $category;
    }
    if ($min_price > 0) {
        $query .= " AND b.price >= :min_price";
        $params[':min_price'] = $min_price;
    }
    if ($max_price < 999999) {
        $query .= " AND b.price <= :max_price";
        $params[':max_price'] = $max_price;
    }
    
    $query .= " GROUP BY b.book_id ORDER BY b.created_at DESC LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($query);
    
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    $stmt->execute();
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get total count
    $countQuery = "SELECT COUNT(*) as total FROM books WHERE status = 'available'";
    $countStmt = $db->prepare($countQuery);
    $countStmt->execute();
    $total = $countStmt->fetch(PDO::FETCH_ASSOC)['total'];
    
    echo json_encode([
        'success' => true,
        'books' => $books,
        'total' => (int)$total,
        'page' => $page,
        'total_pages' => ceil($total / $limit)
    ]);
    exit();
}

// ==================== GET SINGLE BOOK DETAILS ====================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'detail') {
    $book_id = isset($_GET['book_id']) ? (int)$_GET['book_id'] : 0;
    
    if (!$book_id) {
        echo json_encode(['success' => false, 'message' => 'Book ID required']);
        exit();
    }
    
    // Increment view count
    $viewQuery = "UPDATE books SET views_count = views_count + 1 WHERE book_id = :book_id";
    $viewStmt = $db->prepare($viewQuery);
    $viewStmt->bindParam(':book_id', $book_id);
    $viewStmt->execute();
    
    $query = "SELECT b.*, u.full_name as seller_name, u.email as seller_email, u.phone as seller_phone,
                     c.category_name, 
                     COALESCE(AVG(r.rating), 0) as avg_rating, 
                     COUNT(DISTINCT r.review_id) as review_count
              FROM books b
              JOIN users u ON b.seller_id = u.user_id
              JOIN categories c ON b.category_id = c.category_id
              LEFT JOIN reviews r ON b.book_id = r.book_id
              WHERE b.book_id = :book_id
              GROUP BY b.book_id";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':book_id', $book_id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $book = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Get reviews
        $reviewQuery = "SELECT r.*, u.full_name as user_name 
                       FROM reviews r
                       JOIN users u ON r.user_id = u.user_id
                       WHERE r.book_id = :book_id
                       ORDER BY r.created_at DESC
                       LIMIT 20";
        $reviewStmt = $db->prepare($reviewQuery);
        $reviewStmt->bindParam(':book_id', $book_id);
        $reviewStmt->execute();
        $reviews = $reviewStmt->fetchAll(PDO::FETCH_ASSOC);
        
        echo json_encode([
            'success' => true,
            'book' => $book,
            'reviews' => $reviews
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Book not found']);
    }
    exit();
}

// ==================== UPLOAD BOOK ====================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'upload') {
    if (!isAuthenticated()) {
        echo json_encode(['success' => false, 'message' => 'Please login to sell books']);
        exit();
    }
    
    $seller_id = $_SESSION['user_id'];
    $title = isset($_POST['title']) ? $database->sanitize($_POST['title']) : '';
    $author = isset($_POST['author']) ? $database->sanitize($_POST['author']) : '';
    $category_id = isset($_POST['category_id']) ? (int)$_POST['category_id'] : 0;
    $description = isset($_POST['description']) ? $database->sanitize($_POST['description']) : '';
    $price = isset($_POST['price']) ? (float)$_POST['price'] : 0;
    $condition = isset($_POST['condition']) ? $database->sanitize($_POST['condition']) : 'good';
    $isbn = isset($_POST['isbn']) ? $database->sanitize($_POST['isbn']) : '';
    
    // Validate required fields
    if (empty($title) || empty($author) || $category_id == 0 || $price <= 0) {
        echo json_encode(['success' => false, 'message' => 'Please fill all required fields']);
        exit();
    }
    
    // Handle image upload
    $image_path = 'default-book.jpg';
    if (isset($_FILES['book_image']) && $_FILES['book_image']['error'] === UPLOAD_ERR_OK) {
        $upload_dir = dirname(__DIR__) . '/uploads/';
        
        // Create directory if it doesn't exist
        if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }
        
        $file_extension = strtolower(pathinfo($_FILES['book_image']['name'], PATHINFO_EXTENSION));
        $allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        
        if (in_array($file_extension, $allowed_extensions)) {
            $filename = uniqid() . '.' . $file_extension;
            $destination = $upload_dir . $filename;
            
            if (move_uploaded_file($_FILES['book_image']['tmp_name'], $destination)) {
                $image_path = $filename;
            }
        }
    }
    
    $query = "INSERT INTO books (seller_id, title, author, isbn, category_id, description, price, `condition`, image_path, status, created_at)
              VALUES (:seller_id, :title, :author, :isbn, :category_id, :description, :price, :condition, :image_path, 'available', NOW())";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':seller_id', $seller_id);
    $stmt->bindParam(':title', $title);
    $stmt->bindParam(':author', $author);
    $stmt->bindParam(':isbn', $isbn);
    $stmt->bindParam(':category_id', $category_id);
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':price', $price);
    $stmt->bindParam(':condition', $condition);
    $stmt->bindParam(':image_path', $image_path);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Book listed successfully', 'book_id' => $db->lastInsertId()]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to list book']);
    }
    exit();
}

// ==================== GET TRENDING BOOKS ====================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'trending') {
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 6;
    
    $query = "SELECT b.*, u.full_name as seller_name, c.category_name, 
                     COALESCE(AVG(r.rating), 0) as avg_rating, 
                     COUNT(DISTINCT r.review_id) as review_count,
                     (b.views_count + b.search_count) as popularity
              FROM books b
              JOIN users u ON b.seller_id = u.user_id
              JOIN categories c ON b.category_id = c.category_id
              LEFT JOIN reviews r ON b.book_id = r.book_id
              WHERE b.status = 'available'
              GROUP BY b.book_id
              ORDER BY popularity DESC, b.created_at DESC
              LIMIT :limit";
    
    $stmt = $db->prepare($query);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'books' => $books]);
    exit();
}

// ==================== SEARCH BOOKS ====================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'search') {
    $query = isset($_GET['q']) ? $_GET['q'] : '';
    
    if (strlen($query) < 2) {
        echo json_encode(['success' => false, 'message' => 'Search query too short', 'results' => []]);
        exit();
    }
    
    $searchQuery = "SELECT b.*, u.full_name as seller_name, c.category_name,
                           MATCH(b.title, b.author, b.description) AGAINST(:query) as relevance
                    FROM books b
                    JOIN users u ON b.seller_id = u.user_id
                    JOIN categories c ON b.category_id = c.category_id
                    WHERE MATCH(b.title, b.author, b.description) AGAINST(:query IN NATURAL LANGUAGE MODE)
                    AND b.status = 'available'
                    ORDER BY relevance DESC
                    LIMIT 20";
    
    $stmt = $db->prepare($searchQuery);
    $searchTerm = $query;
    $stmt->bindParam(':query', $searchTerm);
    $stmt->execute();
    
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'results' => $results, 'count' => count($results)]);
    exit();
}

// ==================== DELETE BOOK ====================
if ($_SERVER['REQUEST_METHOD'] === 'DELETE' && isset($_GET['action']) && $_GET['action'] === 'delete') {
    if (!isAuthenticated()) {
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        exit();
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    $book_id = isset($data['book_id']) ? (int)$data['book_id'] : 0;
    $user_id = $_SESSION['user_id'];
    
    $query = "DELETE FROM books WHERE book_id = :book_id AND seller_id = :user_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':book_id', $book_id);
    $stmt->bindParam(':user_id', $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Book deleted successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to delete book']);
    }
    exit();
}

// ==================== GET USER'S BOOKS ====================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'my-books') {
    if (!isAuthenticated()) {
        echo json_encode(['success' => false, 'message' => 'Not authenticated']);
        exit();
    }
    
    $user_id = $_SESSION['user_id'];
    
    $query = "SELECT b.*, c.category_name, 
                     COALESCE(AVG(r.rating), 0) as avg_rating
              FROM books b
              JOIN categories c ON b.category_id = c.category_id
              LEFT JOIN reviews r ON b.book_id = r.book_id
              WHERE b.seller_id = :user_id
              GROUP BY b.book_id
              ORDER BY b.created_at DESC";
    
    $stmt = $db->prepare($query);
    $stmt->bindParam(':user_id', $user_id);
    $stmt->execute();
    
    $books = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['success' => true, 'books' => $books]);
    exit();
}
?>