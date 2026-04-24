<?php
// Database configuration file - Environment-based configuration for Vercel

class Database {
    private $host;
    private $db_name;
    private $username;
    private $password;
    public $conn;

    public function __construct() {
        // Use environment variables if available (Vercel), fallback to local defaults
        $this->host = getenv('DB_HOST') ?: 'localhost';
        $this->db_name = getenv('DB_NAME') ?: 'book_recycler';
        $this->username = getenv('DB_USER') ?: 'root';
        $this->password = getenv('DB_PASS') ?: '';
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("SET time_zone = '+00:00'");
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            http_response_code(500);
            echo json_encode(["success" => false, "message" => "Database connection failed: " . $exception->getMessage()]);
            exit();
        }
        return $this->conn;
    }

    // Generate unique user ID
    public function generateUserId() {
        $prefix = "USR";
        $timestamp = time();
        $random = rand(100, 999);
        return $prefix . $timestamp . $random;
    }
    
    // Sanitize input data
    public function sanitize($data) {
        if (is_array($data)) {
            return array_map([$this, 'sanitize'], $data);
        }
        return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
    }

    // Check if database exists
    public function checkDatabaseExists() {
        try {
            $conn = new PDO(
                "mysql:host=" . $this->host,
                $this->username,
                $this->password
            );
            $stmt = $conn->query("SHOW DATABASES LIKE '" . $this->db_name . "'");
            return $stmt->rowCount() > 0;
        } catch (Exception $e) {
            return false;
        }
    }
}
?>
