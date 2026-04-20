<?php
// AI Suggestion API - Category and tag suggestions
// File path: /book-recycler/php/api/ai-suggest.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

class AIBookAnalyzer {
    private $db;
    private $keywords_map;
    
    public function __construct($db) {
        $this->db = $db;
        $this->initializeKeywordMap();
    }
    
    private function initializeKeywordMap() {
        $this->keywords_map = [
            'Computer Science' => [
                'programming', 'algorithm', 'code', 'software', 'database', 'java', 'python', 
                'javascript', 'web development', 'data structure', 'c++', 'html', 'css', 'sql',
                'machine learning', 'ai', 'artificial intelligence', 'computer', 'coding'
            ],
            'Mathematics' => [
                'calculus', 'algebra', 'geometry', 'trigonometry', 'statistics', 'math', 
                'equation', 'theorem', 'probability', 'linear algebra', 'differential'
            ],
            'Physics' => [
                'quantum', 'mechanics', 'thermodynamics', 'relativity', 'electromagnetism', 
                'particle', 'astrophysics', 'physics', 'motion', 'force', 'energy'
            ],
            'Chemistry' => [
                'organic', 'inorganic', 'biochemistry', 'molecule', 'reaction', 'periodic table', 
                'chemical', 'compound', 'acid', 'base', 'laboratory'
            ],
            'Biology' => [
                'cell', 'genetics', 'evolution', 'ecology', 'molecular', 'anatomy', 'physiology', 
                'microbiology', 'biology', 'organism', 'species'
            ],
            'Engineering' => [
                'circuit', 'mechanical', 'civil', 'electrical', 'robotics', 'automation', 
                'design', 'engineering', 'structural', 'materials'
            ],
            'Fiction' => [
                'novel', 'story', 'fantasy', 'adventure', 'mystery', 'thriller', 'romance', 
                'sci-fi', 'science fiction', 'fiction', 'drama'
            ],
            'Non-Fiction' => [
                'history', 'biography', 'self-help', 'business', 'finance', 'psychology', 
                'philosophy', 'true story', 'guide', 'manual'
            ],
            'History' => [
                'ancient', 'medieval', 'modern', 'war', 'civilization', 'revolution', 
                'historical', 'empire', 'kingdom'
            ],
            'Economics' => [
                'market', 'trade', 'finance', 'economy', 'business', 'investment', 'banking', 
                'stock', 'capital', 'microeconomics'
            ]
        ];
    }
    
    public function suggestCategory($title, $description) {
        $text = strtolower($title . ' ' . $description);
        $scores = [];
        
        foreach ($this->keywords_map as $category => $keywords) {
            $score = 0;
            foreach ($keywords as $keyword) {
                if (strpos($text, $keyword) !== false) {
                    $score += 1;
                }
            }
            if ($score > 0) {
                $scores[$category] = $score;
            }
        }
        
        if (empty($scores)) {
            return ['category' => 'General', 'category_id' => 7, 'confidence' => 0, 'suggested_tags' => []];
        }
        
        arsort($scores);
        $top_category = key($scores);
        $max_score = reset($scores);
        
        // Get category ID from database
        $query = "SELECT category_id FROM categories WHERE category_name = :category LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->bindParam(':category', $top_category);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        $category_id = $result ? $result['category_id'] : 7;
        
        return [
            'category' => $top_category,
            'category_id' => $category_id,
            'confidence' => min($max_score / 5, 1),
            'suggested_tags' => $this->extractTags($text)
        ];
    }
    
    private function extractTags($text) {
        $tags = [];
        $all_keywords = [];
        foreach ($this->keywords_map as $keywords) {
            $all_keywords = array_merge($all_keywords, $keywords);
        }
        $all_keywords = array_unique($all_keywords);
        
        foreach ($all_keywords as $keyword) {
            if (strpos($text, $keyword) !== false && !in_array($keyword, $tags)) {
                $tags[] = $keyword;
                if (count($tags) >= 5) break;
            }
        }
        return $tags;
    }
    
    public function calculateTrendingScore($book) {
        $views_weight = 0.3;
        $search_weight = 0.3;
        $review_weight = 0.4;
        
        $views_score = min($book['views_count'] / 100, 1);
        $search_score = min($book['search_count'] / 50, 1);
        
        $reviewQuery = "SELECT COUNT(*) as recent_reviews FROM reviews 
                       WHERE book_id = :book_id AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)";
        $reviewStmt = $this->db->prepare($reviewQuery);
        $reviewStmt->bindParam(':book_id', $book['book_id']);
        $reviewStmt->execute();
        $recent_reviews = $reviewStmt->fetch(PDO::FETCH_ASSOC)['recent_reviews'];
        $review_score = min($recent_reviews / 10, 1);
        
        $trending_score = ($views_score * $views_weight) + 
                         ($search_score * $search_weight) + 
                         ($review_score * $review_weight);
        
        return [
            'score' => round($trending_score, 2),
            'is_trending' => $trending_score > 0.6,
            'factors' => [
                'views' => $views_score,
                'searches' => $search_score,
                'recent_reviews' => $review_score
            ]
        ];
    }
    
    public function getRecommendations($user_id = null) {
        $query = "SELECT b.*, u.full_name as seller_name, c.category_name,
                         COALESCE(AVG(r.rating), 0) as avg_rating,
                         (b.views_count * 0.6 + COALESCE(AVG(r.rating), 0) * 40) as recommendation_score
                  FROM books b
                  JOIN users u ON b.seller_id = u.user_id
                  JOIN categories c ON b.category_id = c.category_id
                  LEFT JOIN reviews r ON b.book_id = r.book_id
                  WHERE b.status = 'available'
                  GROUP BY b.book_id
                  ORDER BY recommendation_score DESC
                  LIMIT 6";
        
        $stmt = $this->db->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}

$aiAnalyzer = new AIBookAnalyzer($db);

// ==================== SUGGEST CATEGORY ENDPOINT ====================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'suggest-category') {
    $data = json_decode(file_get_contents('php://input'), true);
    $title = isset($data['title']) ? $data['title'] : '';
    $description = isset($data['description']) ? $data['description'] : '';
    
    if (empty($title)) {
        echo json_encode(['success' => false, 'message' => 'Title is required']);
        exit();
    }
    
    $suggestion = $aiAnalyzer->suggestCategory($title, $description);
    echo json_encode(['success' => true, 'suggestion' => $suggestion]);
    exit();
}

// ==================== ANALYZE TRENDING ENDPOINT ====================
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_GET['action']) && $_GET['action'] === 'analyze-trending') {
    $data = json_decode(file_get_contents('php://input'), true);
    $book_id = isset($data['book_id']) ? (int)$data['book_id'] : 0;
    
    $query = "SELECT book_id, views_count, search_count FROM books WHERE book_id = :book_id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':book_id', $book_id);
    $stmt->execute();
    
    if ($stmt->rowCount() > 0) {
        $book = $stmt->fetch(PDO::FETCH_ASSOC);
        $analysis = $aiAnalyzer->calculateTrendingScore($book);
        echo json_encode(['success' => true, 'analysis' => $analysis]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Book not found']);
    }
    exit();
}

// ==================== GET RECOMMENDATIONS ENDPOINT ====================
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'recommendations') {
    $user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;
    $recommendations = $aiAnalyzer->getRecommendations($user_id);
    echo json_encode(['success' => true, 'recommendations' => $recommendations]);
    exit();
}
?>