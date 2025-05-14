// wishlist-button.js
document.addEventListener('DOMContentLoaded', function() {
    function changeButtonText() {
        // Find all buttons with data-movetowishlist attribute
        const wishlistButtons = document.querySelectorAll('button[data-movetowishlist]');
        
        wishlistButtons.forEach(button => {
            button.textContent = 'Move to Another Wishlist';  // Change to your desired text
        });
    }

    // Initial change
    changeButtonText();

    // Observer for dynamic content
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.addedNodes.length > 0) {
                setTimeout(changeButtonText, 500);
            }
        });
    });

    // Start observing
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Additional check on window load
    window.addEventListener('load', changeButtonText);
});