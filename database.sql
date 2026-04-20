-- Complete Database Schema for Book Recycler
-- File path: /book-recycler/sql/database.sql

-- Create database
CREATE DATABASE IF NOT EXISTS book_recycler;
USE book_recycler;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    user_type ENUM('buyer', 'seller', 'both') DEFAULT 'both',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    INDEX idx_email (email),
    INDEX idx_user_type (user_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== CATEGORIES TABLE ====================
CREATE TABLE IF NOT EXISTS categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(50) UNIQUE NOT NULL,
    category_type ENUM('academic', 'general', 'fiction', 'non-fiction', 'textbook') DEFAULT 'general',
    icon_class VARCHAR(50) DEFAULT 'fas fa-book',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_type (category_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== BOOKS TABLE ====================
CREATE TABLE IF NOT EXISTS books (
    book_id INT AUTO_INCREMENT PRIMARY KEY,
    seller_id VARCHAR(20) NOT NULL,
    title VARCHAR(200) NOT NULL,
    author VARCHAR(100) NOT NULL,
    isbn VARCHAR(20),
    category_id INT,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    `condition` ENUM('new', 'like-new', 'good', 'fair', 'poor') DEFAULT 'good',
    image_path VARCHAR(255) DEFAULT 'default-book.jpg',
    status ENUM('available', 'sold', 'reserved') DEFAULT 'available',
    views_count INT DEFAULT 0,
    search_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (seller_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE SET NULL,
    FULLTEXT INDEX idx_search (title, author, description),
    INDEX idx_category (category_id),
    INDEX idx_status (status),
    INDEX idx_price (price),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== REVIEWS TABLE ====================
CREATE TABLE IF NOT EXISTS reviews (
    review_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (book_id, user_id),
    INDEX idx_book (book_id),
    INDEX idx_rating (rating),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TRANSACTIONS TABLE ====================
CREATE TABLE IF NOT EXISTS transactions (
    transaction_id INT AUTO_INCREMENT PRIMARY KEY,
    book_id INT NOT NULL,
    buyer_id VARCHAR(20) NOT NULL,
    seller_id VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    transaction_type ENUM('buy', 'exchange') DEFAULT 'buy',
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (book_id) REFERENCES books(book_id),
    FOREIGN KEY (buyer_id) REFERENCES users(user_id),
    FOREIGN KEY (seller_id) REFERENCES users(user_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== INSERT DEFAULT CATEGORIES ====================
INSERT IGNORE INTO categories (category_name, category_type, icon_class) VALUES
('Computer Science', 'academic', 'fas fa-laptop-code'),
('Mathematics', 'academic', 'fas fa-calculator'),
('Physics', 'academic', 'fas fa-atom'),
('Chemistry', 'academic', 'fas fa-flask'),
('Biology', 'academic', 'fas fa-dna'),
('Engineering', 'academic', 'fas fa-microchip'),
('Fiction', 'fiction', 'fas fa-feather-alt'),
('Non-Fiction', 'non-fiction', 'fas fa-book'),
('Science Fiction', 'fiction', 'fas fa-rocket'),
('Biography', 'non-fiction', 'fas fa-user'),
('History', 'academic', 'fas fa-landmark'),
('Economics', 'academic', 'fas fa-chart-line'),
('Business', 'general', 'fas fa-briefcase'),
('Psychology', 'general', 'fas fa-brain'),
('Philosophy', 'general', 'fas fa-brain');

-- ==================== INSERT SAMPLE USER (Password: password123) ====================
-- Note: Use PHP to hash password: password_hash('password123', PASSWORD_DEFAULT)
INSERT IGNORE INTO users (user_id, full_name, email, password, phone, user_type) VALUES
('USR001', 'John Doe', 'john@example.com', '$2y$10$YourHashedPasswordHere', '+1234567890', 'both'),
('USR002', 'Jane Smith', 'jane@example.com', '$2y$10$YourHashedPasswordHere', '+1987654321', 'seller');

-- ==================== INSERT SAMPLE BOOKS ====================
INSERT IGNORE INTO books (seller_id, title, author, category_id, description, price, `condition`, image_path, views_count, search_count) VALUES
('USR001', 'The Pragmatic Programmer', 'David Thomas', 1, 'A classic guide to software development best practices', 35.99, 'like-new', 'default-book.jpg', 150, 45),
('USR001', 'Clean Code', 'Robert C. Martin', 1, 'A handbook of agile software craftsmanship', 42.50, 'good', 'default-book.jpg', 200, 67),
('USR002', 'Introduction to Algorithms', 'Thomas H. Cormen', 1, 'Comprehensive guide to algorithms and data structures', 55.00, 'new', 'default-book.jpg', 89, 23),
('USR002', 'The Great Gatsby', 'F. Scott Fitzgerald', 7, 'A classic novel set in the Jazz Age', 12.99, 'good', 'default-book.jpg', 320, 89),
('USR001', 'Sapiens', 'Yuval Noah Harari', 8, 'A brief history of humankind', 18.99, 'like-new', 'default-book.jpg', 450, 120),
('USR002', 'Deep Work', 'Cal Newport', 8, 'Rules for focused success in a distracted world', 24.99, 'new', 'default-book.jpg', 180, 56);

-- ==================== INSERT SAMPLE REVIEWS ====================
INSERT IGNORE INTO reviews (book_id, user_id, rating, comment) VALUES
(1, 'USR002', 5, 'Excellent book! A must-read for every developer.'),
(2, 'USR002', 4, 'Very helpful content, though some examples are dated.'),
(3, 'USR001', 5, 'The definitive guide to algorithms.'),
(4, 'USR001', 5, 'Timeless classic. Beautifully written.'),
(5, 'USR002', 5, 'Fascinating read that changes your perspective.');

-- ==================== CREATE VIEWS FOR STATISTICS ====================
CREATE OR REPLACE VIEW book_statistics AS
SELECT 
    b.book_id,
    b.title,
    b.author,
    b.price,
    b.views_count,
    b.search_count,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(DISTINCT r.review_id) as total_reviews,
    (b.views_count * 0.3 + b.search_count * 0.3 + COALESCE(AVG(r.rating), 0) * 40) as popularity_score
FROM books b
LEFT JOIN reviews r ON b.book_id = r.book_id
WHERE b.status = 'available'
GROUP BY b.book_id;

-- ==================== STORED PROCEDURE FOR TRENDING BOOKS ====================
DELIMITER //
CREATE PROCEDURE GetTrendingBooks(IN limit_count INT)
BEGIN
    SELECT 
        b.*,
        u.full_name as seller_name,
        c.category_name,
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
    LIMIT limit_count;
END //
DELIMITER ;

-- ==================== TRIGGER FOR UPDATING BOOK STATUS ====================
DELIMITER //
CREATE TRIGGER update_book_status
AFTER UPDATE ON transactions
FOR EACH ROW
BEGIN
    IF NEW.status = 'completed' THEN
        UPDATE books SET status = 'sold' WHERE book_id = NEW.book_id;
    END IF;
END //
DELIMITER ;

-- ==================== INDEXES FOR PERFORMANCE ====================
CREATE INDEX idx_books_search ON books(title, author, description);
CREATE INDEX idx_reviews_book_rating ON reviews(book_id, rating);
CREATE INDEX idx_transactions_user ON transactions(buyer_id, seller_id);
CREATE INDEX idx_users_email ON users(email);

-- ==================== QUERY TO CHECK DATABASE STATUS ====================
SELECT 
    'Database setup complete!' as status,
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM books) as total_books,
    (SELECT COUNT(*) FROM reviews) as total_reviews;