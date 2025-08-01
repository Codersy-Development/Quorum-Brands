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
    filterProducts: true,        // NEW: Filter products on page
    logActions: false
  };
  
  function log(message) {
    if (CONFIG.logActions) {
      console.log('[Search & Filter]', message);
    }
  }
  
  function filterProductsOnPage() {
    if (!CONFIG.filterProducts) return;
    
    const selectedStore = localStorage.getItem("store-selected") || "";
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
          // Scan text content for vendor names
          const itemText = item.textContent.toLowerCase();
          if (itemText.includes('oxygen')) {
            productVendor = 'oxygen';
          } else if (itemText.includes('quorum')) {
            productVendor = 'quorum';
          }
        }
      }
      
      // Determine if product should be shown
      const shouldShow = selectedStore.toLowerCase().includes("all brands") || 
                        productVendor === selectedStore.toLowerCase() ||
                        selectedStore === '';
      
      if (shouldShow) {
        item.style.display = '';
        visibleCount++;
      } else {
        item.style.display = 'none';
        hiddenCount++;
      }
    });
    
    log(`Product filtering complete: ${visibleCount} visible, ${hiddenCount} hidden`);
    
    // Handle product sections that might need hiding
    hideEmptyProductSections(visibleCount);
  }
  
  function hideEmptyProductSections(visibleCount) {
    // Hide product sections if no products are visible
    const productSections = document.querySelectorAll(
      '.results--products, [data-type-products], .product-grid, .search-results'
    );
    
    productSections.forEach(section => {
      const visibleProductsInSection = section.querySelectorAll(
        '[style*="display: none"]'
      ).length;
      
      const totalProductsInSection = section.querySelectorAll(
        '.grid-product, .product-item, .predictive-product-wrapper'
      ).length;
      
      if (totalProductsInSection > 0 && visibleProductsInSection === totalProductsInSection) {
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
      let placeholder = 'Search';
      
      if (selectedStore && !selectedStore.toLowerCase().includes("shop all")) {
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
        if (selectedStore && !selectedStore.toLowerCase().includes("shop all")) {
          const capitalizedStore = selectedStore.charAt(0).toUpperCase() + selectedStore.slice(1);
          vendorInput.value = capitalizedStore;
        } else {
          vendorInput.value = '';
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
        setTimeout(handleStoreChange, 150);
      }
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
    updateForms: updateFormVendorFilters
  };
  
})();