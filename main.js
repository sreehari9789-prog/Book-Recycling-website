/* ========================================
   Book Recycler - Main JavaScript
   API Integration & UI Functionality
   ======================================== */

// API Configuration - Updated to match actual file structure
const API_BASE_URL = '';
let currentUser = null;

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
    loadTrendingBooks();
    setupSearch();
});

function initializeApp() {
    // Add loading animation
    addLoadingAnimation();
    
    // Setup mobile menu
    setupMobileMenu();
    
    // Add smooth scroll
    setupSmoothScroll();
}

// ========================================
// Authentication
// ========================================

async function checkAuthStatus() {
    const token = localStorage.getItem('auth_token');
    if (token) {
        try {
            const response = await fetch(`${API_BASE_URL}/auth.php?action=user-info`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                currentUser = data.user;
                updateUIForLoggedInUser();
            } else {
                localStorage.removeItem('auth_token');
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        }
    }
}

async function handleLogin(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth.php?action=login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('auth_token', data.user.user_id);
            currentUser = data.user;
            showNotification('Login successful!', 'success');
            setTimeout(() => {
                window.location.href = '/dashboard.html';
            }, 1500);
            return true;
        } else {
            showNotification(data.message, 'error');
            return false;
        }
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
        return false;
    }
}

async function handleSignup(userData) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth.php?action=signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Account created successfully! Please login.', 'success');
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            return true;
        } else {
            showNotification(data.message, 'error');
            return false;
        }
    } catch (error) {
        showNotification('Signup failed. Please try again.', 'error');
        return false;
    }
}

async function logout() {
    try {
        await fetch(`${API_BASE_URL}/auth.php?action=logout`, {
            method: 'POST',
            credentials: 'include'
        });
        localStorage.removeItem('auth_token');
        currentUser = null;
        showNotification('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    } catch (error) {
        console.error('Logout failed:', error);
    }
}

// ========================================
// Books Management
// ========================================

async function loadBooks(filters = {}, page = 1) {
    let url = `${API_BASE_URL}/books.php?page=${page}&limit=12`;
    
    if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
    if (filters.category) url += `&category=${filters.category}`;
    if (filters.min_price) url += `&min_price=${filters.min_price}`;
    if (filters.max_price) url += `&max_price=${filters.max_price}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error('Failed to load books');
        }
    } catch (error) {
        console.error('Error loading books:', error);
        showNotification('Failed to load books', 'error');
        return null;
    }
}

async function loadBookDetail(bookId) {
    try {
        const response = await fetch(`${API_BASE_URL}/books.php?action=detail&book_id=${bookId}`);
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            throw new Error('Book not found');
        }
    } catch (error) {
        console.error('Error loading book detail:', error);
        showNotification('Failed to load book details', 'error');
        return null;
    }
}

async function uploadBook(formData) {
    try {
        const response = await fetch(`${API_BASE_URL}/books.php?action=upload`, {
            method: 'POST',
            body: formData,
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Book listed successfully!', 'success');
            return true;
        } else {
            showNotification(data.message, 'error');
            return false;
        }
    } catch (error) {
        showNotification('Upload failed. Please try again.', 'error');
        return false;
    }
}

async function loadTrendingBooks() {
    const container = document.getElementById('trending-books');
    if (!container) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/books.php?action=trending&limit=6`);
        const data = await response.json();
        
        if (data.success && data.books.length > 0) {
            displayBooks(data.books, container);
        } else {
            container.innerHTML = '<p class="text-center">No trending books found</p>';
        }
    } catch (error) {
        console.error('Failed to load trending books:', error);
    }
}

async function searchBooks(query) {
    if (query.length < 2) return [];
    
    try {
        const response = await fetch(`${API_BASE_URL}/books.php?action=search&q=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.success) {
            return data.results;
        } else {
            return [];
        }
    } catch (error) {
        console.error('Search failed:', error);
        return [];
    }
}

// ========================================
// Reviews Management
// ========================================

async function submitReview(bookId, rating, comment) {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ book_id: bookId, rating, comment }),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showNotification('Review submitted successfully!', 'success');
            return true;
        } else {
            showNotification(data.message, 'error');
            return false;
        }
    } catch (error) {
        showNotification('Failed to submit review', 'error');
        return false;
    }
}

async function loadReviews(bookId) {
    try {
        const response = await fetch(`${API_BASE_URL}/reviews.php?book_id=${bookId}`);
        const data = await response.json();
        
        if (data.success) {
            return data;
        } else {
            return { reviews: [], average_rating: 0, total_reviews: 0 };
        }
    } catch (error) {
        console.error('Failed to load reviews:', error);
        return { reviews: [], average_rating: 0, total_reviews: 0 };
    }
}

// ========================================
// UI Helpers
// ========================================

function displayBooks(books, container) {
    if (!books || books.length === 0) {
        container.innerHTML = '<p class="text-center">No books found</p>';
        return;
    }
    
    container.innerHTML = books.map(book => `
        <div class="book-card" onclick="viewBookDetail(${book.book_id})">
            <img src="/uploads/${book.image_path || 'default-book.jpg'}" 
                 alt="${escapeHtml(book.title)}" 
                 class="book-image"
                 onerror="this.src='/uploads/default-book.jpg'">
            <div class="book-info">
                <h3 class="book-title">${escapeHtml(book.title)}</h3>
                <p class="book-author">by ${escapeHtml(book.author)}</p>
                <div class="book-rating">
                    ${generateStarRating(book.avg_rating)}
                    <span>(${book.review_count || 0})</span>
                </div>
                <p class="book-price">$${parseFloat(book.price).toFixed(2)}</p>
                <p class="book-seller"><i class="fas fa-user"></i> ${escapeHtml(book.seller_name)}</p>
            </div>
        </div>
    `).join('');
}

function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = stars.length / 2; i < 5; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        padding: 1rem 1.5rem;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        border-radius: 12px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 10px 20px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 0.5rem;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function viewBookDetail(bookId) {
    window.location.href = `/book-detail.html?id=${bookId}`;
}

// ========================================
// Search Functionality
// ========================================

function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;
    
    let debounceTimer;
    
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            performSearch(e.target.value);
        }, 500);
    });
    
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch(e.target.value);
        }
    });
}

async function performSearch(query) {
    if (query.length < 2) return;
    
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="loader-container"><div class="loader"></div></div>';
        
        const results = await searchBooks(query);
        
        if (results.length > 0) {
            displayBooks(results, resultsContainer);
        } else {
            resultsContainer.innerHTML = '<p class="text-center">No books found</p>';
        }
    } else {
        // Redirect to search results page
        window.location.href = `/book-listing.html?search=${encodeURIComponent(query)}`;
    }
}

// ========================================
// Event Listeners
// ========================================

function setupEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            handleLogin(email, password);
        });
    }
    
    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userData = {
                full_name: document.getElementById('full_name').value,
                email: document.getElementById('email').value,
                password: document.getElementById('password').value,
                phone: document.getElementById('phone').value
            };
            handleSignup(userData);
        });
    }
    
    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', logout);
    }
}

// ========================================
// UI Updates
// ========================================

function updateUIForLoggedInUser() {
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons && currentUser) {
        authButtons.innerHTML = `
            <div class="user-menu">
                <span class="user-name">${escapeHtml(currentUser.full_name)}</span>
                <button onclick="logout()" class="btn btn-outline">Logout</button>
            </div>
        `;
    }
}

// ========================================
// Helper Functions
// ========================================

function addLoadingAnimation() {
    // Add loading animation to all images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', () => {
            img.classList.add('loaded');
        });
    });
}

function setupMobileMenu() {
    const menuBtn = document.createElement('button');
    menuBtn.className = 'mobile-menu-btn';
    menuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    menuBtn.style.cssText = `
        display: none;
        background: transparent;
        border: none;
        color: white;
        font-size: 1.5rem;
        cursor: pointer;
    `;
    
    const navContainer = document.querySelector('.nav-container');
    if (navContainer && window.innerWidth <= 768) {
        menuBtn.style.display = 'block';
        navContainer.insertBefore(menuBtn, navContainer.firstChild);
        
        menuBtn.addEventListener('click', () => {
            const navLinks = document.querySelector('.nav-links');
            if (navLinks) {
                navLinks.classList.toggle('active');
            }
        });
    }
}

function setupSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// ========================================
// Export for use in other files
// ========================================

window.bookRecycler = {
    API_BASE_URL,
    handleLogin,
    handleSignup,
    logout,
    loadBooks,
    loadBookDetail,
    uploadBook,
    submitReview,
    showNotification,
    viewBookDetail,
    escapeHtml,
    generateStarRating
};
