/* ========================================
   GSAP Animations - Advanced 3D Effects
   ScrollTrigger, 3D Transforms, Floating Books
   ======================================== */

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger, TextPlugin);

// ========================================
// 3D Floating Books Animation
// ========================================

class Book3DAnimator {
    constructor() {
        this.container = document.getElementById('book3dContainer');
        this.books = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.init();
    }
    
    init() {
        if (!this.container) return;
        this.createFloatingBooks();
        this.animateBooks();
        this.addScrollAnimations();
        this.addHoverEffects();
        this.addParallaxEffect();
        this.addMouseMoveEffect();
    }
    
    createFloatingBooks() {
        const bookColors = [
            '#ff6b6b', '#ff8e53', '#ff4757', '#ffa502', '#ff6348', 
            '#ff7f50', '#ff6b81', '#ff9ff3', '#feca57', '#48dbfb'
        ];
        
        const bookCount = window.innerWidth < 768 ? 15 : 30;
        
        for (let i = 0; i < bookCount; i++) {
            const book = document.createElement('div');
            book.className = 'book-3d-item';
            
            const color = bookColors[Math.floor(Math.random() * bookColors.length)];
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            const rotY = Math.random() * 360;
            const rotX = (Math.random() - 0.5) * 40;
            const scale = 0.5 + Math.random() * 0.8;
            
            book.style.left = `${x}px`;
            book.style.top = `${y}px`;
            book.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) scale(${scale})`;
            
            // Create 3D book structure with realistic details
            book.innerHTML = `
                <div class="book-cover" style="
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    background: linear-gradient(135deg, ${color}, ${this.darkenColor(color)});
                    border-radius: 8px;
                    transform: translateZ(25px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <span style="color: white; font-size: 10px; font-weight: bold; opacity: 0.8;">BOOK</span>
                </div>
                <div class="book-spine" style="
                    position: absolute;
                    left: -12px;
                    top: 0;
                    width: 12px;
                    height: 100%;
                    background: ${this.darkenColor(color)};
                    border-radius: 3px 0 0 3px;
                    transform: translateZ(20px);
                "></div>
                <div class="book-pages" style="
                    position: absolute;
                    right: -6px;
                    top: 3px;
                    width: 6px;
                    height: calc(100% - 6px);
                    background: linear-gradient(135deg, #f5f5f5, #e0e0e0);
                    border-radius: 2px;
                    transform: translateZ(15px);
                "></div>
                <div class="book-shadow" style="
                    position: absolute;
                    bottom: -20px;
                    left: 10px;
                    width: 90%;
                    height: 20px;
                    background: rgba(0,0,0,0.2);
                    filter: blur(10px);
                    border-radius: 50%;
                    transform: translateZ(-10px);
                "></div>
            `;
            
            this.container.appendChild(book);
            
            this.books.push({
                element: book,
                x: x,
                y: y,
                rotY: rotY,
                rotX: rotX,
                scale: scale,
                speedX: (Math.random() - 0.5) * 1.5,
                speedY: (Math.random() - 0.5) * 1.5,
                speedRot: (Math.random() - 0.5) * 2,
                floatOffset: Math.random() * Math.PI * 2,
                floatSpeed: 0.5 + Math.random() * 0.8,
                floatAmplitude: 20 + Math.random() * 30,
                originalX: x,
                originalY: y
            });
        }
    }
    
    darkenColor(color) {
        // Darken color for spine effect
        const darkColors = {
            '#ff6b6b': '#c0392b',
            '#ff8e53': '#e67e22',
            '#ff4757': '#c0392b',
            '#ffa502': '#d35400',
            '#ff6348': '#c0392b',
            '#ff7f50': '#d35400'
        };
        return darkColors[color] || '#2c3e50';
    }
    
    animateBooks() {
        let time = 0;
        
        const animate = () => {
            time += 0.016; // Approximate delta time
            
            this.books.forEach(book => {
                // Update position
                book.x += book.speedX;
                book.y += book.speedY;
                book.rotY += book.speedRot;
                
                // Floating effect with sine wave
                const floatY = Math.sin(time * book.floatSpeed + book.floatOffset) * book.floatAmplitude;
                const floatX = Math.cos(time * book.floatSpeed * 0.5 + book.floatOffset) * (book.floatAmplitude * 0.5);
                
                // Wrap around screen with smooth transition
                if (book.x > window.innerWidth + 100) book.x = -100;
                if (book.x < -100) book.x = window.innerWidth + 100;
                if (book.y > window.innerHeight + 100) book.y = -100;
                if (book.y < -100) book.y = window.innerHeight + 100;
                
                // Apply smooth transform with GSAP
                gsap.set(book.element, {
                    x: book.x + floatX,
                    y: book.y + floatY,
                    rotationY: book.rotY,
                    rotationX: Math.sin(time * 0.8 + book.floatOffset) * 15,
                    duration: 0.1,
                    ease: 'none'
                });
            });
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    addMouseMoveEffect() {
        document.addEventListener('mousemove', (e) => {
            this.mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            this.mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
            
            // Apply subtle parallax to all books
            this.books.forEach((book, index) => {
                const parallaxX = this.mouseX * 30 * (index % 3 === 0 ? 1 : 0.5);
                const parallaxY = this.mouseY * 20 * (index % 2 === 0 ? 1 : 0.5);
                
                gsap.to(book.element, {
                    x: book.x + parallaxX,
                    y: book.y + parallaxY,
                    duration: 1,
                    ease: 'power2.out'
                });
            });
        });
    }
    
    addParallaxEffect() {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.3;
            
            this.books.forEach((book, index) => {
                const delay = index * 0.02;
                gsap.to(book.element, {
                    y: book.y + rate * (0.5 + (index % 3) * 0.2),
                    rotationX: book.rotX + scrolled * 0.05,
                    duration: 0.5,
                    delay: delay,
                    ease: 'power2.out'
                });
            });
        });
    }
    
    addScrollAnimations() {
        // Fade in book cards on scroll
        gsap.utils.toArray('.book-card').forEach((card, i) => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 85%',
                    end: 'bottom 20%',
                    toggleActions: 'play none none reverse',
                    scrub: false
                },
                opacity: 0,
                y: 80,
                rotationX: 20,
                duration: 0.8,
                delay: i * 0.05,
                ease: 'power3.out'
            });
        });
        
        // Parallax effect for hero section
        gsap.to('.hero', {
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true
            },
            y: 150,
            opacity: 0.7,
            duration: 1
        });
        
        // Scale effect for stats cards
        gsap.utils.toArray('.stat-card, .stat-card-dashboard').forEach(card => {
            gsap.from(card, {
                scrollTrigger: {
                    trigger: card,
                    start: 'top 90%',
                    toggleActions: 'play none none reverse'
                },
                scale: 0.8,
                opacity: 0,
                duration: 0.6,
                ease: 'back.out(1.2)'
            });
        });
        
        // Text reveal animation
        gsap.utils.toArray('.reveal-text').forEach(text => {
            gsap.from(text, {
                scrollTrigger: {
                    trigger: text,
                    start: 'top 85%',
                    toggleActions: 'play none none reverse'
                },
                y: 30,
                opacity: 0,
                duration: 0.6,
                stagger: 0.1
            });
        });
    }
    
    addHoverEffects() {
        // 3D tilt effect for book cards
        document.querySelectorAll('.book-card, .book-card-premium').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 15;
                const rotateY = (centerX - x) / 15;
                
                gsap.to(card, {
                    rotationX: rotateX,
                    rotationY: rotateY,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    rotationX: 0,
                    rotationY: 0,
                    duration: 0.5,
                    ease: 'power2.out'
                });
            });
        });
        
        // Button hover animations with bounce
        document.querySelectorAll('.btn, .btn-premium, .btn-glow').forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                gsap.to(btn, {
                    scale: 1.05,
                    duration: 0.3,
                    ease: 'back.out(1.7)',
                    boxShadow: '0 10px 30px rgba(255,107,107,0.4)'
                });
            });
            
            btn.addEventListener('mouseleave', () => {
                gsap.to(btn, {
                    scale: 1,
                    duration: 0.3,
                    ease: 'back.in(1.7)',
                    boxShadow: 'none'
                });
            });
        });
        
        // Category card hover effects
        document.querySelectorAll('.category-card, .category-card-premium').forEach(card => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    scale: 1.05,
                    duration: 0.4,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
            
            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    scale: 1,
                    duration: 0.4,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        });
    }
    
    addTextReveal() {
        // Animate hero title with split text
        const heroTitle = document.querySelector('.hero-title');
        if (heroTitle) {
            const text = heroTitle.textContent;
            heroTitle.innerHTML = text.split('').map(char => 
                `<span style="display: inline-block; opacity: 0; transform: translateY(30px);">${char === ' ' ? '&nbsp;' : char}</span>`
            ).join('');
            
            gsap.to(heroTitle.querySelectorAll('span'), {
                opacity: 1,
                y: 0,
                duration: 0.05,
                stagger: 0.05,
                delay: 0.5,
                ease: 'power3.out'
            });
        }
    }
}

// ========================================
// Page Transition Animations
// ========================================

class PageTransition {
    constructor() {
        this.init();
    }
    
    init() {
        this.createOverlay();
        this.setupPageTransitions();
    }
    
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'page-transition-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #0f0f1e, #1a1a2e);
            z-index: 99999;
            pointer-events: none;
            transform: scaleY(0);
            transform-origin: top;
        `;
        document.body.appendChild(overlay);
        this.overlay = overlay;
    }
    
    setupPageTransitions() {
        document.querySelectorAll('a').forEach(link => {
            if (link.href && link.hostname === window.location.hostname && !link.hasAttribute('data-no-transition')) {
                link.addEventListener('click', (e) => {
                    e.preventDefault();
                    const href = link.href;
                    this.animateOut(() => {
                        window.location.href = href;
                    });
                });
            }
        });
    }
    
    animateOut(callback) {
        gsap.to(this.overlay, {
            scaleY: 1,
            duration: 0.5,
            ease: 'power2.inOut',
            onComplete: callback
        });
    }
    
    animateIn() {
        gsap.to(this.overlay, {
            scaleY: 0,
            duration: 0.5,
            ease: 'power2.inOut'
        });
    }
}

// ========================================
// Counter Animation
// ========================================

class CounterAnimator {
    static animateCounter(element, start, end, duration = 2000) {
        if (!element) return;
        
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const updateCounter = () => {
            current += increment;
            if (current >= end) {
                element.textContent = end.toLocaleString();
                return;
            }
            element.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
        };
        
        updateCounter();
    }
    
    static observeCounters() {
        const counters = document.querySelectorAll('.stat-number, .counter');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const target = parseInt(element.getAttribute('data-target') || element.textContent);
                    this.animateCounter(element, 0, target);
                    observer.unobserve(element);
                }
            });
        }, { threshold: 0.5 });
        
        counters.forEach(counter => observer.observe(counter));
    }
}

// ========================================
// Initialize All Animations
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D books if container exists
    if (document.getElementById('book3dContainer')) {
        new Book3DAnimator();
    }
    
    // Initialize page transitions
    new PageTransition();
    
    // Initialize counter animations
    CounterAnimator.observeCounters();
    
    // Add loading animation
    gsap.from('body', {
        opacity: 0,
        duration: 0.5,
        ease: 'power2.out'
    });
});

// ========================================
// Export for use in other files
// ========================================

window.Book3DAnimator = Book3DAnimator;
window.PageTransition = PageTransition;
window.CounterAnimator = CounterAnimator;