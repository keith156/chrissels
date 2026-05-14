document.addEventListener('DOMContentLoaded', () => {
    const footerLogo = document.getElementById('footer-logo');
    if (footerLogo) {
        footerLogo.addEventListener('dblclick', () => {
            window.location.href = 'admin.html';
        });
        footerLogo.style.cursor = 'pointer';
    }
});
