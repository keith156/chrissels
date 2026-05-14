// Ensure GSAP is loaded before executing
document.addEventListener("DOMContentLoaded", (event) => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        console.warn("GSAP or ScrollTrigger not loaded");
        return;
    }
    
    // Register ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // 1. Fade up headings and paragraphs dynamically
    const textElements = document.querySelectorAll("h1, h2, h3, main p:not(.no-anim)");
    
    textElements.forEach((el) => {
        if (el.closest('#mobile-menu') || el.closest('nav')) return;

        gsap.fromTo(el, 
            { y: 30, opacity: 0 }, 
            { 
                y: 0, 
                opacity: 1, 
                duration: 1, 
                ease: "power2.out", // Simpler easing
                scrollTrigger: {
                    trigger: el,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    // 2. Image Reveal / Scale-up (Optimized: Removed grayscale filter which causes heavy lag on large images)
    const images = document.querySelectorAll("img.object-cover:not(.no-anim)");
    images.forEach((img) => {
        gsap.fromTo(img, 
            { scale: 1.05, opacity: 0 }, 
            { 
                scale: 1, 
                opacity: 1, 
                duration: 1.2, 
                ease: "power2.out",
                scrollTrigger: {
                    trigger: img,
                    start: "top 90%",
                    toggleActions: "play none none reverse"
                }
            }
        );
    });

    // 3. Stagger Animations for Grids
    const grids = document.querySelectorAll(".grid, .masonry-grid, .flex-wrap");
    grids.forEach((grid) => {
        const items = Array.from(grid.children).filter(child => 
            child.classList.contains("project-card") || 
            child.classList.contains("flex-1") ||
            child.tagName === "DIV"
        );
        
        if (items.length > 1 && !grid.closest('nav') && !grid.closest('footer')) {
            gsap.fromTo(items, 
                { y: 30, opacity: 0 }, 
                { 
                    y: 0, 
                    opacity: 1, 
                    duration: 0.8, 
                    stagger: 0.1, // Faster stagger
                    ease: "power2.out",
                    scrollTrigger: {
                        trigger: grid,
                        start: "top 85%",
                        toggleActions: "play none none reverse"
                    }
                }
            );
        }
    });

    // 4. Parallax effect for background elements (Optimized: reduced movement, uses purely transform)
    const parallaxContainers = document.querySelectorAll(".relative.h-screen, .aspect-square");
    parallaxContainers.forEach((container) => {
        const bgImg = container.querySelector("img, video");
        if (bgImg) {
            gsap.to(bgImg, {
                yPercent: 10, // Reduced from 15 to 10 for less paint/layout work
                ease: "none",
                scrollTrigger: {
                    trigger: container,
                    start: "top bottom", 
                    end: "bottom top",
                    scrub: 0.5 // Add a tiny bit of smoothing to the scrub rather than strict true
                }
            });
        }
    });

    // 5. Initial Page Load Animation (Nav)
    const nav = document.querySelector("nav");
    if (nav) {
        gsap.fromTo(nav, 
            { y: -50, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 1, ease: "power2.out", delay: 0.1 }
        );
    }
});
