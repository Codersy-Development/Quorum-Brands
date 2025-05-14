document.addEventListener("DOMContentLoaded", function () {
    function updatesku() {
        const wishlistCards = document.querySelectorAll(".wishlist-card");
        wishlistCards.forEach((card) => {
            const productId = card.getAttribute("data-proid");
            const variantId = card.getAttribute("data-varid");
            const productLink = card.querySelector(".wishlist-product__image");
            
            if (productLink) {
                const productUrl = productLink.getAttribute("href");
                if (!productUrl) return;
                
                const productHandle = productUrl.split("/products/")[1].split("?")[0];
                const productApiUrl = `/products/${productHandle}.js`;
                
                fetch(productApiUrl)
                    .then((response) => response.json())
                    .then((productData) => {
                        if (productData && productData.variants) {
                            const matchingVariant = productData.variants.find(
                                (variant) => variant.id.toString() === variantId
                            );
                            if (matchingVariant) {
                                const sku = matchingVariant.sku;
                                const vendorElement = card.querySelector(".vendor");
                                if (vendorElement) {
                                    vendorElement.textContent = sku;
                                }
                            }
                        }
                    })
                    .catch((error) => {});
            }
        });

        const productTitles = document.querySelectorAll(".hulk-product__title");
        productTitles.forEach((titleElement) => {
            const currentText = titleElement.textContent.trim();
            const hyphenIndex = currentText.indexOf('-');
            if (hyphenIndex !== -1) {
                titleElement.textContent = currentText.substring(0, hyphenIndex).trim();
            }
        });
    }

    function init() {
        updatesku();
        
        const wishlistDiv = document.querySelector('div.hulk-wishlist[data-hulkwishlistview]');
        if (wishlistDiv) {
            wishlistDiv.addEventListener("click", function() {
                setTimeout(updatesku, 500 );
            });
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                    mutation.addedNodes.forEach((node) => {
                        if (node.classList && node.classList.contains('wishlist-card') ||
                            (node.querySelector && node.querySelector('.wishlist-card'))) {
                            setTimeout(updatesku, 200);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    init();
    setTimeout(init, 500);
    setTimeout(init, 1000);
});