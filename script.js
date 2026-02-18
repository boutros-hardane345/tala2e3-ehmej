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

// Lightbox Modal Functionality
function createLightboxModal() {
    // Create modal elements if they don't exist
    if (!document.getElementById('imageModal')) {
        const modal = document.createElement('div');
        modal.id = 'imageModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <span class="close-modal">&times;</span>
            <img class="modal-content" id="modalImage" alt="صورة مكبرة">
            <div id="modalCaption" class="modal-caption"></div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal when clicking on X
        const closeBtn = document.querySelector('.close-modal');
        closeBtn.onclick = function() {
            modal.style.display = "none";
        }
        
        // Close modal when clicking outside the image
        modal.onclick = function(event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        }
        
        // Close modal with Escape key
        document.addEventListener('keydown', function(event) {
            if (event.key === "Escape" && modal.style.display === "block") {
                modal.style.display = "none";
            }
        });
    }
}

// Make all images clickable to open in modal
function setupImageClickHandlers() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const captionText = document.getElementById('modalCaption');
    
    if (!modal || !modalImg || !captionText) return;
    
    // Select all images that should be clickable
    const clickableImages = document.querySelectorAll(
        '.card img, .member-image img, .library-card img, .featured-card img, .gallery img, .about-image img'
    );
    
    clickableImages.forEach(img => {
        img.addEventListener('click', function() {
            modal.style.display = "block";
            modalImg.src = this.src;
            
            // Try to find a caption
            let caption = this.alt || '';
            
            // Check if image is inside a card with title
            const card = this.closest('.card');
            if (card) {
                const cardTitle = card.querySelector('h3, h4');
                if (cardTitle) {
                    caption = cardTitle.textContent;
                }
            }
            
            // Check if image is in member card
            const memberCard = this.closest('.member-card');
            if (memberCard) {
                const memberName = memberCard.querySelector('h4');
                if (memberName) {
                    caption = memberName.textContent;
                }
                
                // Check for role
                const memberRole = memberCard.querySelector('.member-role, .member-role-badge');
                if (memberRole && caption) {
                    caption = caption + ' - ' + memberRole.textContent;
                }
            }
            
            // Check if image is in featured card with overlay
            const featuredCard = this.closest('.featured-card');
            if (featuredCard) {
                const overlayTitle = featuredCard.querySelector('.card-overlay h3');
                if (overlayTitle) {
                    caption = overlayTitle.textContent;
                }
            }
            
            captionText.textContent = caption;
        });
    });
}

// Handle library card buttons to open images in modal instead of new tab
function setupLibraryCardButtons() {
    const viewButtons = document.querySelectorAll('.btn-view');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const card = this.closest('.library-card');
            if (card) {
                const img = card.querySelector('img');
                if (img) {
                    const modal = document.getElementById('imageModal');
                    const modalImg = document.getElementById('modalImage');
                    const captionText = document.getElementById('modalCaption');
                    
                    if (modal && modalImg && captionText) {
                        modal.style.display = "block";
                        modalImg.src = img.src;
                        
                        const title = card.querySelector('h3')?.textContent || '';
                        captionText.textContent = title;
                    }
                }
            }
        });
    });
}

// Add touch support for mobile devices
function setupMobileTouchSupport() {
    // Prevent body scrolling when modal is open
    const modal = document.getElementById('imageModal');
    
    if (modal) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (modal.style.display === 'block') {
                        document.body.style.overflow = 'hidden';
                    } else {
                        document.body.style.overflow = '';
                    }
                }
            });
        });
        
        observer.observe(modal, { attributes: true });
    }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    applySeasonalEffects();
    createLightboxModal();
    setupImageClickHandlers();
    setupLibraryCardButtons();
    setupMobileTouchSupport();
    
    // Add active state to current page in navigation
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

// Re-initialize for dynamically loaded content (if any)
window.addEventListener('load', () => {
    setupImageClickHandlers();
    setupLibraryCardButtons();
});