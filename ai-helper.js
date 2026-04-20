/* ========================================
   AI Helper Module - Smart Book Recommendations
   Category Detection, Trending Analysis, Personalization
   ======================================== */

class AIBookHelper {
    constructor() {
        this.apiUrl = '/book-recycler/php/api/ai-suggest.php';
        this.cache = new Map();
        this.categoryKeywords = {
            'Computer Science': ['programming', 'algorithm', 'code', 'software', 'database', 'java', 'python', 'javascript', 'web', 'development', 'data structure', 'c++', 'html', 'css', 'sql', 'machine learning', 'ai', 'artificial intelligence', 'computer'],
            'Mathematics': ['calculus', 'algebra', 'geometry', 'trigonometry', 'statistics', 'math', 'equation', 'theorem', 'probability', 'linear algebra', 'differential', 'mathematical'],
            'Physics': ['quantum', 'mechanics', 'thermodynamics', 'relativity', 'electromagnetism', 'particle', 'astrophysics', 'physics', 'motion', 'force', 'energy', 'nuclear'],
            'Chemistry': ['organic', 'inorganic', 'biochemistry', 'molecule', 'reaction', 'periodic table', 'chemical', 'compound', 'acid', 'base', 'laboratory', 'molecular'],
            'Biology': ['cell', 'genetics', 'evolution', 'ecology', 'molecular', 'anatomy', 'physiology', 'microbiology', 'biology', 'organism', 'species', 'biodiversity'],
            'Engineering': ['circuit', 'mechanical', 'civil', 'electrical', 'robotics', 'automation', 'design', 'engineering', 'structural', 'materials', 'manufacturing'],
            'Fiction': ['novel', 'story', 'fantasy', 'adventure', 'mystery', 'thriller', 'romance', 'sci-fi', 'science fiction', 'fiction', 'drama', 'literary'],
            'Non-Fiction': ['history', 'biography', 'self-help', 'business', 'finance', 'psychology', 'philosophy', 'true story', 'guide', 'manual', 'reference'],
            'History': ['ancient', 'medieval', 'modern', 'war', 'civilization', 'revolution', 'historical', 'empire', 'kingdom', 'timeline'],
            'Economics': ['market', 'trade', 'finance', 'economy', 'business', 'investment', 'banking', 'stock', 'capital', 'microeconomics', 'macroeconomics']
        };
    }
    
    // ========================================
    // Category Suggestion with Caching
    // ========================================
    
    async suggestCategory(title, description) {
        const cacheKey = `${title}:${description}`;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            const response = await fetch(`${this.apiUrl}?action=suggest-category`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description })
            });
            
            const data = await response.json();
            
            if (data.success && data.suggestion) {
                this.cache.set(cacheKey, data.suggestion);
                return data.suggestion;
            } else {
                // Fallback to client-side detection
                const fallbackSuggestion = this.detectCategoryClientSide(title, description);
                this.cache.set(cacheKey, fallbackSuggestion);
                return fallbackSuggestion;
            }
        } catch (error) {
            console.error('AI category suggestion failed:', error);
            return this.detectCategoryClientSide(title, description);
        }
    }
    
    // Client-side rule-based category detection (fallback)
    detectCategoryClientSide(title, description) {
        const text = (title + ' ' + description).toLowerCase();
        let bestMatch = { category: 'General', score: 0, category_id: 7 };
        
        const categoryIds = {
            'Computer Science': 1,
            'Mathematics': 2,
            'Physics': 3,
            'Chemistry': 4,
            'Biology': 5,
            'Engineering': 6,
            'Fiction': 7,
            'Non-Fiction': 8,
            'History': 11,
            'Economics': 12
        };
        
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            let score = 0;
            for (const keyword of keywords) {
                if (text.includes(keyword)) {
                    score++;
                }
            }
            if (score > bestMatch.score) {
                bestMatch = {
                    category: category,
                    score: score,
                    category_id: categoryIds[category] || 7
                };
            }
        }
        
        return {
            category: bestMatch.category,
            category_id: bestMatch.category_id,
            confidence: Math.min(bestMatch.score / 5, 1),
            suggested_tags: this.extractTags(text)
        };
    }
    
    extractTags(text) {
        const tags = [];
        const allKeywords = Object.values(this.categoryKeywords).flat();
        const uniqueKeywords = [...new Set(allKeywords)];
        
        for (const keyword of uniqueKeywords) {
            if (text.includes(keyword) && tags.length < 5) {
                tags.push(keyword);
            }
        }
        
        return tags;
    }
    
    // ========================================
    // Trending Analysis
    // ========================================
    
    async getTrendingAnalysis(bookId) {
        try {
            const response = await fetch(`${this.apiUrl}?action=analyze-trending`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ book_id: bookId })
            });
            
            const data = await response.json();
            return data.analysis;
        } catch (error) {
            console.error('Trending analysis failed:', error);
            return null;
        }
    }
    
    calculateTrendingScore(views, searches, reviews, daysOld) {
        const viewsWeight = 0.3;
        const searchesWeight = 0.3;
        const reviewsWeight = 0.4;
        
        const viewsScore = Math.min(views / 100, 1);
        const searchesScore = Math.min(searches / 50, 1);
        const reviewsScore = Math.min(reviews / 10, 1);
        const recencyBonus = Math.max(0, 1 - (daysOld / 30));
        
        let score = (viewsScore * viewsWeight) + 
                   (searchesScore * searchesWeight) + 
                   (reviewsScore * reviewsWeight);
        
        score = score * (0.7 + recencyBonus * 0.3);
        
        return {
            score: Math.min(score, 1),
            is_trending: score > 0.6,
            percentage: Math.round(score * 100)
        };
    }
    
    // ========================================
    // Personalized Recommendations
    // ========================================
    
    async getRecommendations(userId = null, limit = 6) {
        try {
            const url = userId ? 
                `${this.apiUrl}?action=recommendations&user_id=${userId}&limit=${limit}` : 
                `${this.apiUrl}?action=recommendations&limit=${limit}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            return data.recommendations || [];
        } catch (error) {
            console.error('Recommendations failed:', error);
            return [];
        }
    }
    
    async getPersonalizedRecommendations(userHistory, allBooks) {
        // Collaborative filtering based on user's reading history
        if (!userHistory || userHistory.length === 0) {
            return allBooks.slice(0, 6);
        }
        
        // Extract user's preferred categories
        const categoryPreferences = {};
        userHistory.forEach(book => {
            if (book.category_id) {
                categoryPreferences[book.category_id] = (categoryPreferences[book.category_id] || 0) + 1;
            }
        });
        
        // Score books based on category preference
        const scoredBooks = allBooks.map(book => {
            let score = 0;
            if (categoryPreferences[book.category_id]) {
                score = categoryPreferences[book.category_id] / userHistory.length;
            }
            
            // Add popularity boost
            score += (book.views_count || 0) / 1000;
            score += (book.avg_rating || 0) / 10;
            
            return { ...book, recommendation_score: score };
        });
        
        // Sort by score and return top recommendations
        return scoredBooks
            .sort((a, b) => b.recommendation_score - a.recommendation_score)
            .slice(0, 6);
    }
    
    // ========================================
    // Smart Search with AI Ranking
    // ========================================
    
    async smartSearch(query, books) {
        if (!query || query.length < 2) return books;
        
        const searchTerms = query.toLowerCase().split(' ');
        
        const scoredResults = books.map(book => {
            let score = 0;
            const title = book.title.toLowerCase();
            const author = book.author.toLowerCase();
            const description = (book.description || '').toLowerCase();
            
            // Title match (highest weight)
            searchTerms.forEach(term => {
                if (title.includes(term)) score += 10;
                if (author.includes(term)) score += 5;
                if (description.includes(term)) score += 2;
            });
            
            // Exact phrase match bonus
            const exactPhrase = query.toLowerCase();
            if (title.includes(exactPhrase)) score += 20;
            if (author.includes(exactPhrase)) score += 10;
            
            // Popularity boost
            score += (book.views_count || 0) / 100;
            score += (book.avg_rating || 0) * 2;
            
            return { ...book, search_score: score };
        });
        
        return scoredResults
            .filter(book => book.search_score > 0)
            .sort((a, b) => b.search_score - a.search_score);
    }
    
    // ========================================
    // Price Prediction (Simple ML)
    // ========================================
    
    predictPrice(book) {
        // Simple price prediction based on condition, category, and popularity
        let basePrice = 20;
        
        // Condition multiplier
        const conditionMultiplier = {
            'new': 1.2,
            'like-new': 1.0,
            'good': 0.8,
            'fair': 0.6,
            'poor': 0.4
        };
        
        // Category adjustment
        const categoryAdjustment = {
            1: 1.3,  // Computer Science (premium)
            2: 1.1,  // Mathematics
            3: 1.1,  // Physics
            7: 0.9,  // Fiction (lower)
            8: 1.0   // Non-Fiction
        };
        
        const condition = conditionMultiplier[book.condition] || 0.8;
        const category = categoryAdjustment[book.category_id] || 1.0;
        
        let predictedPrice = basePrice * condition * category;
        
        // Adjust for popularity
        if (book.views_count > 500) predictedPrice *= 1.2;
        if (book.avg_rating > 4.5) predictedPrice *= 1.15;
        
        return Math.round(predictedPrice * 100) / 100;
    }
    
    // ========================================
    // Book Similarity
    // ========================================
    
    findSimilarBooks(book, allBooks, limit = 4) {
        const similarityScores = [];
        
        allBooks.forEach(otherBook => {
            if (otherBook.book_id === book.book_id) return;
            
            let score = 0;
            
            // Same category
            if (otherBook.category_id === book.category_id) score += 30;
            
            // Similar price range
            const priceDiff = Math.abs(otherBook.price - book.price);
            if (priceDiff < 5) score += 15;
            else if (priceDiff < 10) score += 10;
            else if (priceDiff < 20) score += 5;
            
            // Similar rating
            if (otherBook.avg_rating && book.avg_rating) {
                const ratingDiff = Math.abs(otherBook.avg_rating - book.avg_rating);
                if (ratingDiff < 0.5) score += 10;
                else if (ratingDiff < 1) score += 5;
            }
            
            similarityScores.push({ ...otherBook, similarity_score: score });
        });
        
        return similarityScores
            .sort((a, b) => b.similarity_score - a.similarity_score)
            .slice(0, limit);
    }
    
    // ========================================
    // Smart Tag Extraction
    // ========================================
    
    async extractSmartTags(title, description) {
        const text = (title + ' ' + description).toLowerCase();
        const tags = [];
        
        // Extract potential tags based on keywords
        for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
            for (const keyword of keywords) {
                if (text.includes(keyword) && !tags.includes(keyword) && tags.length < 8) {
                    tags.push(keyword);
                }
            }
        }
        
        // Add category as tag
        const categorySuggestion = await this.suggestCategory(title, description);
        if (categorySuggestion && categorySuggestion.category !== 'General') {
            tags.unshift(categorySuggestion.category);
        }
        
        return tags;
    }
}

// ========================================
// Initialize AI Helper
// ========================================

const aiHelper = new AIBookHelper();

// Export for use in other files
window.aiHelper = aiHelper;
window.AIBookHelper = AIBookHelper;