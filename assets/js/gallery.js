document.addEventListener('DOMContentLoaded', () => {
    // gallery data
    const galleryContainer = document.querySelector('.gallery-scroller');
    const galleryItems = document.querySelectorAll('.gallery-item');
    
    // Lightbox Setup
    const lightbox = document.createElement('div');
    lightbox.id = 'lightbox';
    lightbox.className = 'lightbox';
    lightbox.innerHTML = `
        <div class="lightbox-content">
            <span class="lightbox-close">&times;</span>
            <button class="lightbox-nav-btn lightbox-prev">‹</button>
            <img src="" alt="Full view" class="lightbox-img">
            <button class="lightbox-nav-btn lightbox-next">›</button>
        </div>
    `;
    document.body.appendChild(lightbox);

    const lightboxImg = lightbox.querySelector('.lightbox-img');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');

    let currentIndex = 0;
    const totalItems = galleryItems.length;

    // --- AUTO SLIDESHOW LOGIC ---
    let autoSlideInterval;

    const startAutoSlide = () => {
        autoSlideInterval = setInterval(() => {
            const width = galleryContainer.clientWidth;
            // check scroll position
            const maxScroll = galleryContainer.scrollWidth - galleryContainer.clientWidth;
            
            if (galleryContainer.scrollLeft >= maxScroll - 10) {
                // reset to start
                galleryContainer.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                // scroll next
                galleryContainer.scrollBy({ left: width, behavior: 'smooth' });
            }
        }, 3000); // 3 seconds
    };

    if (galleryContainer) {
        startAutoSlide();
        
        // Optional: Pause on hover? User didn't ask, but good UX.
        // galleryContainer.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
        // galleryContainer.addEventListener('mouseleave', startAutoSlide);
    }

    // --- LIGHTBOX LOGIC ---
    
    const updateLightboxImage = (index) => {
        const src = galleryItems[index].getAttribute('src');
        lightboxImg.src = src;
        currentIndex = index;
    };

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
             updateLightboxImage(index);
             lightbox.classList.add('active');
             document.body.style.overflow = 'hidden';
             clearInterval(autoSlideInterval); // Stop slideshow when viewing
        });
    });

    const closeLightbox = () => {
        lightbox.classList.remove('active');
        document.body.style.overflow = '';
        if (galleryContainer) startAutoSlide(); // Resume slideshow
    };

    closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
    });

    // Lightbox Navigation
    prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let newIndex = currentIndex - 1;
        if (newIndex < 0) newIndex = totalItems - 1;
        updateLightboxImage(newIndex);
    });

    nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        let newIndex = currentIndex + 1;
        if (newIndex >= totalItems) newIndex = 0;
        updateLightboxImage(newIndex);
    });
});
