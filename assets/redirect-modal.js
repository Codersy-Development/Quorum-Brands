/**
 * Redirect Modal for Quorum Home Links
 * Place this file in assets/redirect-modal.js
 */

// Global variable to store the target URL
let redirectUrl = '';

/**
 * Show the redirect modal
 * @param {string} url - The URL to redirect to
 */
function showRedirectModal(url) {
    redirectUrl = url;
    const modal = document.getElementById('redirectModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }
}

/**
 * Close the redirect modal
 */
function closeRedirectModal() {
    const modal = document.getElementById('redirectModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        redirectUrl = '';
    }
}

/**
 * Proceed with the redirect
 */
function proceedToRedirect() {
    if (redirectUrl) {
        window.open(redirectUrl, '_blank');
        closeRedirectModal();
    }
}

/**
 * Initialize the redirect modal functionality
 */
function initRedirectModal() {
    // Event listener for all clicks on the document
    document.addEventListener('click', function(event) {
        // Check if clicked element is a link
        const link = event.target.closest('a');
        
        if (link && link.href) {
            // Check if the link starts with https://www.quorumhome.com
            if (link.href.startsWith('https://www.quorumhome.com')) {
                // Prevent default link behavior
                event.preventDefault();
                
                // Show the modal
                showRedirectModal(link.href);
                return false;
            }
        }
    });

    // Close modal when clicking on overlay
    const modal = document.getElementById('redirectModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                closeRedirectModal();
            }
        });
    }

    // Close modal with Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeRedirectModal();
        }
    });
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRedirectModal);
} else {
    // DOM is already ready
    initRedirectModal();
}

// Also initialize on Shopify's theme events (for AJAX navigation)
if (typeof Shopify !== 'undefined' && Shopify.theme) {
    document.addEventListener('shopify:section:load', initRedirectModal);
    document.addEventListener('shopify:section:reorder', initRedirectModal);
}