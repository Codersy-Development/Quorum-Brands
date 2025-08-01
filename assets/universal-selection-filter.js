/**
 * Universal Section Store Filter
 * Handles show/hide for all sections with data-store attributes
 * File: assets/universal-section-filter.js
 */
(function() {
    'use strict';
    
    function handleSectionStoreFiltering() {
        const selectedStore = localStorage.getItem("store-selected") || "";
        const sectionsWithStore = document.querySelectorAll('[data-store]');
        
        // Check if "All Brands" is selected
        function isAllBrands(storeValue) {
            if (!storeValue) return false;
            const normalized = storeValue.toLowerCase().trim();
            return normalized === 'all brands';
        }
        
        sectionsWithStore.forEach(section => {
            const sectionStore = section.getAttribute('data-store');
            
            // If section is set to show on all stores, always show
            if (!sectionStore || sectionStore === 'all') {
                section.style.display = '';
                return;
            }
            
            // Show section if selected store matches section store, or if "All Brands" is selected
            const shouldShow = isAllBrands(selectedStore) || 
                             selectedStore.toLowerCase() === sectionStore.toLowerCase() || 
                             selectedStore === '';
            
            section.style.display = shouldShow ? '' : 'none';
            
            console.log(`[Section Filter] ${section.className || section.tagName}: ${shouldShow ? 'shown' : 'hidden'} for store: ${selectedStore}`);
        });
    }
    
    function initializeSectionStoreFiltering() {
        // Listen for store changes
        document.addEventListener('storeChanged', function(e) {
            console.log('[Section Filter] Store changed, updating section visibility');
            setTimeout(handleSectionStoreFiltering, 100);
        });

        // Also listen for the regular change events as backup
        document.addEventListener('change', function(e) {
            if (e.target.type === 'radio' && e.target.closest('store-switcher')) {
                setTimeout(handleSectionStoreFiltering, 150);
            }
        });

        // Initial check
        setTimeout(handleSectionStoreFiltering, 100);
        
        console.log('[Section Filter] Initialized - monitoring', document.querySelectorAll('[data-store]').length, 'sections');
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeSectionStoreFiltering);
    } else {
        initializeSectionStoreFiltering();
    }
    
})();