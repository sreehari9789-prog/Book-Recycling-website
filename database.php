<?php
// Database configuration file
// File path: /book-recycler/php/config/database.php

class Database {
    private $host = "localhost";
    private $db_name = "book_recycler";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, 
                                  $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8mb4");
            $this->conn->exec("SET time_zone = '+00:00'");
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            die(json_encode(["success" => false, "message" => "Database connection failed"]));
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
        return htmlspecialchars(strip_tags(trim($data)));
    }
}
?>