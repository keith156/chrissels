document.addEventListener('DOMContentLoaded', () => {
    // Create cursor elements dynamically
    const cursor = document.createElement('div');
    cursor.classList.add('custom-cursor');
    document.body.appendChild(cursor);

    const cursorDot = document.createElement('div');
    cursorDot.classList.add('cursor-dot');
    document.body.appendChild(cursorDot);

    // Cursor positions
    let mouseX = 0;
    let mouseY = 0;
    let cursorX = 0;
    let cursorY = 0;
    let dotX = 0;
    let dotY = 0;

    // Movement logic
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        // Immediate update for the dot
        dotX = mouseX;
        dotY = mouseY;
        cursorDot.style.left = `${dotX}px`;
        cursorDot.style.top = `${dotY}px`;
    });

    // Smooth animation loop for the outer circle
    function animate() {
        // Lerp factor (0.1 means it moves 10% of the distance to the target per frame)
        // Adjust this value to change the "lag" amount. Lower = more lag.
        const lerpFactor = 0.15;

        cursorX += (mouseX - cursorX) * lerpFactor;
        cursorY += (mouseY - cursorY) * lerpFactor;

        cursor.style.left = `${cursorX}px`;
        cursor.style.top = `${cursorY}px`;

        requestAnimationFrame(animate);
    }

    animate();

    // Hover effects
    const interactiveElements = document.querySelectorAll('a, button, input, textarea, select, [role="button"]');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('cursor-hover');
        });
        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('cursor-hover');
        });
    });

    // Re-bind hover listeners for dynamically added content (optional, but good practice)
    // Using a MutationObserver could be more robust for single-page apps, 
    // but for this static site, initial load binding is sufficient.
});
