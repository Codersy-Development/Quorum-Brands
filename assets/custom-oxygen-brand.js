// custom-oxygen-brand.js

document.addEventListener('DOMContentLoaded', function() {
  // Function to apply special styling to elements for Oxygen vendor
  function applyOxygenBrandStyling() {
    // Style the announcement bar
    const announcementBar = document.querySelector('.announcement-bar');
    if (announcementBar) {
      announcementBar.style.backgroundColor = '#ec008c';
    }
    
    // Style all buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(function(button) {
      button.style.background = '#ec008c';
    });
    
    // Style all icons
    const icons = document.querySelectorAll('.icon');
    icons.forEach(function(icon) {
      icon.style.fill = '#ec008c';
    });
    
    // Style all SVG icon paths
    const svgIconPaths = document.querySelectorAll('svg.icon path');
    svgIconPaths.forEach(function(path) {
      path.style.color = '#ec008c';
    });

    // Style specific icons with white fill
    const whiteIcons = document.querySelectorAll('.icon-chevron-right, .icon-chevron-left, .icon-close');
    whiteIcons.forEach(function(icon) {
      icon.style.fill = 'white';
    });
    // Style specific SVG icon paths with white color
    const whiteIconPaths = document.querySelectorAll('svg.icon-chevron-right path, svg.icon-chevron-left path, svg.icon-close path');
    whiteIconPaths.forEach(function(path) {
      path.style.color = 'white';
      path.style.fill = 'white';
    });    


    
    // Style the footer background and text
    const footer = document.querySelector('footer');
    if (footer) {
      footer.style.backgroundColor = '#ec008c';
      
      // Apply light text color to all text elements in the footer
      const footerTextElements = footer.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, a, li');
      footerTextElements.forEach(function(element) {
        element.style.color = '#E6E6E6';
      });
      
      // Change the footer logo
      const footerLogos = footer.querySelectorAll('img.footer-logo, .footer__logo img, .footer-logo img');
      if (footerLogos.length > 0) {
        footerLogos.forEach(function(logo) {
          logo.src = 'https://cdn.shopify.com/s/files/1/0740/2668/0533/files/Oxygen_Brand.png?v=1745961945';
          logo.srcset = ''; // Clear any srcset to ensure our image is used
        });
      } else {
        // If no logo found with common selectors, try to find any image in the footer that might be a logo
        const potentialLogos = footer.querySelectorAll('img');
        for (let i = 0; i < potentialLogos.length; i++) {
          const img = potentialLogos[i];
          // Check if it's in a container that might be a logo container
          const parent = img.parentElement;
          if (parent && (
              parent.classList.contains('logo') || 
              parent.classList.contains('footer-logo') || 
              parent.id.includes('logo') || 
              parent.className.includes('logo')
          )) {
            img.src = 'https://cdn.shopify.com/s/files/1/0740/2668/0533/files/Oxygen_Brand.png?v=1745961945';
            img.srcset = '';
            break;
          }
        }
      }
    }
    
    return true;
  }

  // Check if we're on a product page
  const isProductPage = window.location.pathname.includes('/products/');
  
  if (isProductPage) {
    // Method 1: Try Shopify global object
    if (window.Shopify && window.Shopify.product) {
      const vendor = window.Shopify.product.vendor;
      
      if (vendor && vendor.toLowerCase() === 'oxygen') {
        return applyOxygenBrandStyling();
      }
    }
    
    // Method 2: Try meta tags
    const metaTags = [
      'meta[property="product:brand"]', 
      'meta[property="og:product:brand"]',
      'meta[itemprop="brand"]'
    ];
    
    for (let selector of metaTags) {
      const metaVendor = document.querySelector(selector);
      if (metaVendor) {
        const vendor = metaVendor.getAttribute('content');
        
        if (vendor && vendor.toLowerCase() === 'oxygen') {
          return applyOxygenBrandStyling();
        }
      }
    }
    
    // Method 3: Try DOM elements
    const vendorSelectors = [
      '.vendor', 
      '.product-vendor', 
      '[data-product-vendor]',
      '.product__vendor',
      '.product-single__vendor'
    ];
    
    for (let selector of vendorSelectors) {
      const elements = document.querySelectorAll(selector);
      
      for (let i = 0; i < elements.length; i++) {
        const text = elements[i].textContent.trim();
        
        if (text && text.toLowerCase() === 'oxygen') {
          return applyOxygenBrandStyling();
        }
      }
    }
    
    // Method 4: Try to get product data via AJAX
    const productHandle = window.location.pathname.split('/products/')[1].split('?')[0];
    
    fetch('/products/' + productHandle + '.js')
      .then(response => response.json())
      .then(product => {
        if (product.vendor && product.vendor.toLowerCase() === 'oxygen') {
          applyOxygenBrandStyling();
        }
      })
      .catch(error => {
        // Silent error handling
      });
  }
});