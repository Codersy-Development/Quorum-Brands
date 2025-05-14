document.addEventListener('DOMContentLoaded', function() {
  function findProductByVariantSku(sku) {
    // Find product element that contains this variant
    const productElements = document.querySelectorAll('[data-wpd-product-id]');
    for (const element of productElements) {
      if (element.querySelector(`[data-variant-sku="${sku}"]`)) {
        return {
          id: element.getAttribute('data-wpd-product-id'),
          handle: element.getAttribute('data-wpd-product-handle'),
          collectionIds: element.getAttribute('data-wpd-product-collection-ids')
        };
      }
    }
    return null;
  }

  function convertPriceDisplay() {
    const wishlistItems = document.querySelectorAll('.wishlist__product-content');
    
    wishlistItems.forEach((wishlistItem) => {
      try {
        // Get the original price element
        const originalPrice = wishlistItem.querySelector('.money.conversion-bear-money:not(.wpd-processed)');
        if (!originalPrice) return;

        // Get SKU from vendor text
        const sku = wishlistItem.querySelector('.vendor')?.textContent?.trim() || '';
        if (!sku) return;

        // Get the variant size
        const variantSize = wishlistItem.querySelector('.varient')?.textContent?.trim() || '';

        // Get original price value
        const priceText = originalPrice.textContent.trim();
        const numericPrice = parseFloat(priceText.replace(/[^0-9.]/g, '')) * 100;

        // Create or get price container
        let priceContainer = wishlistItem.querySelector('.hulk-price');
        if (!priceContainer) {
          priceContainer = document.createElement('p');
          priceContainer.className = 'hulk-price';

          
          const vendorElement = wishlistItem.querySelector('.vendor');
          if (vendorElement) {
            wishlistItem.insertBefore(priceContainer, vendorElement);
          } else {
            wishlistItem.appendChild(priceContainer);
          }
        }

        // Create WPD price element with extended attributes
        const wpdPrice = document.createElement('span');
        wpdPrice.setAttribute('data-product-price', '');
        wpdPrice.className = 'product__price wpd-processed';
        
        // Find product data
        const productData = findProductByVariantSku(sku);
        
        // Set all required WPD attributes
        wpdPrice.setAttribute('data-wpd-product-handle', sku.toLowerCase());
        wpdPrice.setAttribute('data-wpd-variant-price', numericPrice.toString());
        wpdPrice.setAttribute('data-wpd-variant-compare-at-price', numericPrice.toString());
        if (productData) {
          wpdPrice.setAttribute('data-wpd-product-id', productData.id);
          wpdPrice.setAttribute('data-wpd-product-collection-ids', productData.collectionIds);
        }
        
        // Add additional attributes that might be needed by WPD
        wpdPrice.setAttribute('data-wpd-wholesale-customer', window.is_wcp_wholesale_customer || 'false');
        wpdPrice.setAttribute('data-wpd-customer-tag', window.wcp_customer?.tag || '');
        wpdPrice.style.visibility = 'visible';

        // Set price structure
        wpdPrice.innerHTML = `
          <s class="wpd-ext-compare-at-price"><span hidewlm="">${priceText}</span></s>
          <br>
          <a href="/cart" font-size="small">Discount Shown In Cart<a/>       
          <span class="product__price" data-wpd-price="${numericPrice}"></span>
      `;
        // Update price container
        priceContainer.innerHTML = '';
        priceContainer.appendChild(wpdPrice);

        // Remove original price if outside container
        if (originalPrice.parentElement !== priceContainer) {
          originalPrice.remove();
        }

        // Trigger WPD price update using available methods
        if (window.replaceWPDPrice) {
          window.replaceWPDPrice(wpdPrice);
        } else if (window.WPDAppProxy?.updatePrice) {
          window.WPDAppProxy.updatePrice(wpdPrice);
        }

      } catch (error) {
        console.error('Error processing wishlist item:', error);
      }
    });
  }

  // Initialize with delay to ensure WPD is loaded
  function init() {
    if (window.replaceWPDPrice || window.WPDAppProxy) {
      convertPriceDisplay();
    } else {
      setTimeout(init, 500);
    }
  }

  // Run initial conversion
  setTimeout(init, 500);

  // Observer for dynamic content
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        setTimeout(init, 500);
        break;
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Handle quantity changes
  document.addEventListener('click', function(event) {
    if (event.target.matches('.hlk_wl_productQty_plus, .hlk_wl_productQty_minus')) {
      setTimeout(init, 500);
    }
  });

  document.addEventListener('change', function(event) {
    if (event.target.matches('[data-hulkproductqty]')) {
      setTimeout(init, 500);
    }
  });
});