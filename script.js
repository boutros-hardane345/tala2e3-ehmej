// Enhanced seasonal effects with better animations - NO PAUSE
function createParticles(type, count) {
    const container = document.getElementById("season-container");
    if (!container) return;
    
    // Clear existing particles
    container.innerHTML = '';
    
    for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");
        particle.classList.add("particle", type);
        
        // Random size variation based on type
        let size;
        switch(type) {
            case 'snow':
                size = Math.random() * 8 + 4;
                break;
            case 'petal':
                size = Math.random() * 10 + 6;
                break;
            case 'leaf':
                size = Math.random() * 12 + 6;
                break;
            default:
                size = Math.random() * 6 + 4;
        }
        
        particle.style.width = size + "px";
        particle.style.height = size + "px";
        particle.style.left = Math.random() * 100 + "%";
        
        // Animation starts immediately (no delay)
        const duration = Math.random() * 8 + 6; // 6-14 seconds
        
        particle.style.animation = `fall ${duration}s linear 0s infinite`;
        
        // Random starting position (some already halfway down)
        const startY = Math.random() * 100;
        particle.style.top = -startY + "vh";
        
        // Random rotation for petals
        if (type === 'petal') {
            particle.style.transform = `rotate(${Math.random() * 360}deg)`;
        }
        
        container.appendChild(particle);
    }
}

// Get current season based on month
function getSeason() {
    const month = new Date().getMonth() + 1; // 1-12
    
    if (month === 12 || month === 1 || month === 2) {
        return 'winter';
    } else if (month >= 3 && month <= 5) {
        return 'spring';
    } else if (month >= 6 && month <= 8) {
        return 'summer';
    } else {
        return 'autumn';
    }
}

// Apply seasonal effects
function applySeasonalEffects() {
    const season = getSeason();
    
    switch(season) {
        case 'winter':
            createParticles('snow', 80);
            break;
        case 'spring':
            createParticles('petal', 50);
            break;
        case 'summer':
            createParticles('sun', 30);
            break;
        case 'autumn':
            createParticles('leaf', 60);
            break;
    }
    
    // Add season class to body for additional styling
    document.body.classList.add(`season-${season}`);
}

// Initialize immediately when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    applySeasonalEffects();
});

// Smooth scroll for navigation links
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

// Add active state to current page in navigation
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});