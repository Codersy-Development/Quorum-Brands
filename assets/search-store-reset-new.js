/**
 * Search Store Reset & Product Filtering
 * Resets search and filters products when store switcher changes
 */
(function() {
  'use strict';
  
  // Configuration
  const CONFIG = {
    redirectFromSearchPage: false,
    clearPredictiveSearch: true,
    updatePlaceholders: true,
    filterProducts: true,
    logActions: false  // Changed back to false to reduce console spam
  };
  
  // Utility function to check if store is "All Brands"
  function isAllBrands(storeValue) {
    if (!storeValue) return false;
    const normalized = storeValue.toLowerCase().trim();
    return normalized === 'all brands' || normalized === 'shop all';
  }
  
  function log(message) {
    if (CONFIG.logActions) {
      console.log('[Search & Filter]', message);
    }
  }
  
function filterProductsOnPage() {
  if (!CONFIG.filterProducts) return;
  
  const selectedStore = localStorage.getItem("store-selected") || "";
  
  // IMPORTANT: Don't run product filtering on product pages!
  if (window.location.pathname.includes('/products/')) {
    log('Skipping product filtering on product page');
    return;
  }
  
  log(`Filtering products for store: ${selectedStore}`);
    
    // Find all product elements (adjust selectors for your theme)
    const productSelectors = [
      '.grid-product',
      '.product-item', 
      '.search-product',
      '[data-product-id]',
      '.product-grid-item',
      '.predictive-product-wrapper',
      '[data-vendor]'
    ];
    
    let allProducts = [];
    productSelectors.forEach(selector => {
      const products = document.querySelectorAll(selector);
      allProducts = allProducts.concat(Array.from(products));
    });
    
    // Remove duplicates
    allProducts = allProducts.filter((item, index, self) => 
      self.indexOf(item) === index
    );
    
    let visibleCount = 0;
    let hiddenCount = 0;
    
    // IMPROVED: If "All Brands" is selected, show everything immediately
    if (isAllBrands(selectedStore)) {
      allProducts.forEach((item) => {
        item.style.display = '';
        visibleCount++;
      });
      log(`All Brands selected - showing all ${visibleCount} products`);
      return; // Exit early, no need for complex filtering
    }
    
    // Only do complex filtering for specific brands
    allProducts.forEach((item) => {
      let productVendor = '';
      
      // Try multiple ways to get vendor info
      if (item.dataset.vendor) {
        productVendor = item.dataset.vendor.toLowerCase();
      } else {
        // Look for vendor in text content
        const vendorElement = item.querySelector('.grid-product__vendor, [class*="vendor"]');
        if (vendorElement) {
          productVendor = vendorElement.textContent.trim().toLowerCase();
        } else {
          // Scan text content for vendor names - be more specific
          const itemText = item.textContent.toLowerCase();
          if (itemText.includes('oxygen') && !itemText.includes('quorum')) {
            productVendor = 'oxygen';
          } else if (itemText.includes('quorum') && !itemText.includes('oxygen')) {
            productVendor = 'quorum';
          }
          // IMPROVED: Add more vendor detection here as needed
          // else if (itemText.includes('brand3')) {
          //   productVendor = 'brand3';
          // }
        }
      }
      
      // Determine if product should be shown for specific brand
      const shouldShow = productVendor === selectedStore.toLowerCase() || selectedStore === '';
      
      if (shouldShow) {
        item.style.display = '';
        visibleCount++;
        if (CONFIG.logActions) log(`Showing product with vendor: ${productVendor}`);
      } else {
        item.style.display = 'none';
        hiddenCount++;
        if (CONFIG.logActions) log(`Hiding product with vendor: ${productVendor} (selected: ${selectedStore})`);
      }
    });
    
    log(`Product filtering complete: ${visibleCount} visible, ${hiddenCount} hidden`);
    
    // Handle product sections that might need hiding
    hideEmptyProductSections(visibleCount);
  }
  
  function hideEmptyProductSections(visibleCount) {
    // Don't hide sections if "All Brands" is selected
    const selectedStore = localStorage.getItem("store-selected") || "";
    if (isAllBrands(selectedStore)) {
      // Show all product sections when "All Brands" is selected
      const productSections = document.querySelectorAll(
        '.results--products, [data-type-products], .product-grid, .search-results'
      );
      productSections.forEach(section => {
        section.style.display = '';
      });
      return;
    }
    
    // Hide product sections if no products are visible (for specific brands only)
    const productSections = document.querySelectorAll(
      '.results--products, [data-type-products], .product-grid, .search-results'
    );
    
    productSections.forEach(section => {
      const hiddenProductsInSection = section.querySelectorAll(
        '[style*="display: none"]'
      ).length;
      
      const totalProductsInSection = section.querySelectorAll(
        '.grid-product, .product-item, .predictive-product-wrapper'
      ).length;
      
      if (totalProductsInSection > 0 && hiddenProductsInSection === totalProductsInSection) {
        section.style.display = 'none';
        log('Hid empty product section');
      } else if (totalProductsInSection > 0) {
        section.style.display = '';
      }
    });
  }
  
  function resetSearchInputs() {
    log('Resetting search inputs due to store change');
    
    // Clear all search input fields
    const searchInputs = document.querySelectorAll('input[type="search"], input[name="q"]');
    searchInputs.forEach(input => {
      input.value = '';
    });
    
    // Clear predictive search results
    if (CONFIG.clearPredictiveSearch) {
      const predictiveContainer = document.getElementById('predictive-search');
      if (predictiveContainer) {
        predictiveContainer.innerHTML = '';
        predictiveContainer.style.display = 'none';
      }
    }
    
    // Close search overlays
    const searchOverlay = document.querySelector('.search-overlay, .predictive__screen');
    if (searchOverlay) {
      searchOverlay.style.display = 'none';
    }
    
    // Update search placeholders
    if (CONFIG.updatePlaceholders) {
      updateSearchPlaceholders();
    }
    
    // Filter products on the current page
    filterProductsOnPage();
    
    // Handle search results page
    if (window.location.pathname.includes('/search')) {
      if (CONFIG.redirectFromSearchPage) {
        log('Redirecting from search page to home');
        window.location.href = '/';
      }
    }
  }
  
  function updateSearchPlaceholders() {
    const selectedStore = localStorage.getItem("store-selected") || "";
    const searchInputs = document.querySelectorAll('input[type="search"], input[name="q"]');
    
    searchInputs.forEach(input => {
      let placeholder = 'Search all products'; // IMPROVED: Better default for "All Brands"
      
      if (selectedStore && !isAllBrands(selectedStore)) {
        const capitalizedStore = selectedStore.charAt(0).toUpperCase() + selectedStore.slice(1);
        placeholder = `Search ${capitalizedStore} products...`;
      }
      
      input.placeholder = placeholder;
    });
  }
  
  function updateFormVendorFilters() {
    const selectedStore = localStorage.getItem("store-selected") || "";
    const searchForms = document.querySelectorAll('form[action*="search"]');
    
    searchForms.forEach(form => {
      const vendorInput = form.querySelector('input[name="filter.p.vendor"], .vendor-filter-input');
      if (vendorInput) {
        if (selectedStore && !isAllBrands(selectedStore)) {
          const capitalizedStore = selectedStore.charAt(0).toUpperCase() + selectedStore.slice(1);
          vendorInput.value = capitalizedStore;
        } else {
          vendorInput.value = ''; // Clear for "All Brands"
        }
      }
    });
  }
  
  function isStoreRadio(element) {
    return (
      element.matches('store-switcher input[type="radio"]') || 
      (element.type === 'radio' && element.closest('store-switcher')) ||
      (element.type === 'radio' && element.name && element.name.startsWith('store-switcher-'))
    );
  }
  
  function handleStoreChange() {
    log('Store changed - executing full reset and filter');
    
    // Update form vendor filters first
    updateFormVendorFilters();
    
    // Then reset search and filter products
    setTimeout(resetSearchInputs, 100);
  }
  
  function initializeSearchReset() {
    log('Initializing search reset and product filtering');
    
    // Listen for store switcher changes
    document.addEventListener('change', function(e) {
      if (isStoreRadio(e.target)) {
        handleStoreChange();
      }
    });
    
// Also listen for clicks as backup
document.addEventListener('click', function(e) {
  const storeLabel = e.target.closest('store-switcher label');
  if (storeLabel) {
    // Don't trigger store change handling on product pages from clicks
    if (!window.location.pathname.includes('/products/')) {
      setTimeout(handleStoreChange, 150);
    }
  }
});
    
    // IMPROVED: Listen for the custom storeChanged event from store-switcher.js
    document.addEventListener('storeChanged', function(e) {
      const newStore = e.detail.selectedStore;
      const isAllBrandsSelected = e.detail.isAllBrands;
      log(`Store changed via custom event: ${newStore} (All Brands: ${isAllBrandsSelected})`);
      handleStoreChange();
    });
    
    // Initial setup
    setTimeout(function() {
      updateSearchPlaceholders();
      updateFormVendorFilters();
      filterProductsOnPage();
    }, 100);
    
    log('All event listeners attached');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearchReset);
  } else {
    initializeSearchReset();
  }
  
  // Expose methods for debugging/manual control
  window.SearchStoreReset = {
    config: CONFIG,
    reset: resetSearchInputs,
    filterProducts: filterProductsOnPage,
    updatePlaceholders: updateSearchPlaceholders,
    updateForms: updateFormVendorFilters,
    isAllBrands: isAllBrands,
    // IMPROVED: Add debugging helpers
    debug: {
      showAllProducts: () => {
        document.querySelectorAll('.grid-product, .product-item, [data-vendor]')
          .forEach(p => p.style.display = '');
        console.log('Debug: Forced all products visible');
      },
      getCurrentStore: () => localStorage.getItem("store-selected"),
      testAllBrands: (value) => isAllBrands(value)
    }
  };
  
})();