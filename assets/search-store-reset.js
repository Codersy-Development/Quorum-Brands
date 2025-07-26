/**
 * Search Store Reset
 * Resets search when store switcher changes
 */
(function() {
  'use strict';
  
  // Configuration - choose your reset behavior
  const CONFIG = {
    redirectFromSearchPage: false, // Set to true for aggressive reset
    clearPredictiveSearch: true,
    updatePlaceholders: true,
    logActions: false // Set to true for debugging
  };
  
  function log(message) {
    if (CONFIG.logActions) {
      console.log('[Search Reset]', message);
    }
  }
  
  function resetSearchInputs() {
    log('Resetting search inputs due to store change');
    
    // Clear all search input fields
    const searchInputs = document.querySelectorAll('input[type="search"], input[name="q"]');
    searchInputs.forEach(input => {
      input.value = '';
    });
    log(`Cleared ${searchInputs.length} search inputs`);
    
    // Clear predictive search results
    if (CONFIG.clearPredictiveSearch) {
      const predictiveContainer = document.getElementById('predictive-search');
      if (predictiveContainer) {
        predictiveContainer.innerHTML = '';
        predictiveContainer.style.display = 'none';
        log('Cleared predictive search results');
      }
    }
    
    // Close search overlays (mobile/popup searches)
    const searchOverlay = document.querySelector('.search-overlay, .predictive__screen');
    if (searchOverlay) {
      searchOverlay.style.display = 'none';
      log('Closed search overlay');
    }
    
    // Close any open search bars
    const searchBars = document.querySelectorAll('.search-bar, .search__input-wrap');
    searchBars.forEach(bar => {
      bar.classList.remove('active', 'open', 'focused');
    });
    
    // Update search placeholders to show new store
    if (CONFIG.updatePlaceholders) {
      updateSearchPlaceholders();
    }
    
    // Handle search results page
    if (window.location.pathname.includes('/search')) {
      if (CONFIG.redirectFromSearchPage) {
        log('Redirecting from search page to home');
        window.location.href = '/';
      } else {
        log('Re-filtering search results for new store');
        // Trigger re-filtering after a delay
        setTimeout(function() {
          const event = new Event('storeChanged', { bubbles: true });
          document.dispatchEvent(event);
        }, 200);
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
    
    log(`Updated ${searchInputs.length} search placeholders`);
  }
  
  function isStoreRadio(element) {
    return (
      element.matches('store-switcher input[type="radio"]') || 
      (element.type === 'radio' && element.closest('store-switcher')) ||
      (element.type === 'radio' && element.name && element.name.startsWith('store-switcher-'))
    );
  }
  
  function initializeSearchReset() {
    log('Initializing search reset functionality');
    
    // Listen for store switcher changes
    document.addEventListener('change', function(e) {
      if (isStoreRadio(e.target)) {
        log('Store radio button changed');
        setTimeout(resetSearchInputs, 100);
      }
    });
    
    // Also listen for clicks as backup
    document.addEventListener('click', function(e) {
      const storeLabel = e.target.closest('store-switcher label');
      if (storeLabel) {
        log('Store switcher label clicked');
        setTimeout(resetSearchInputs, 150);
      }
    });
    
    // Initialize placeholders on page load
    if (CONFIG.updatePlaceholders) {
      setTimeout(updateSearchPlaceholders, 100);
    }
    
    log('Search reset event listeners attached');
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeSearchReset);
  } else {
    initializeSearchReset();
  }
  
  // Expose configuration for runtime changes if needed
  window.SearchStoreReset = {
    config: CONFIG,
    reset: resetSearchInputs,
    updatePlaceholders: updateSearchPlaceholders
  };
  
})();