const setCollectionsFilters = () => {
  const VENDOR_KEY = 'filter.p.vendor';
  const store      = getStoreSentenceCase();
  document.querySelectorAll('a[href*="/collections/"]').forEach((aTag) => {
    try {
      const url = new URL(aTag.href);          // always absolute in browsers
      if (store === 'Shop all brands') {
        // remove every vendor filter so *all* brands show
        url.searchParams.delete(VENDOR_KEY);
      } else {
        // .set() already overwrites if the key exists, so one line is enough
        url.searchParams.set(VENDOR_KEY, store);
      }
      // write the revised URL back to the link
      aTag.href = url.toString();
    } catch (err) {
      // only triggers for malformed hrefs (rare, but nice to log)
      console.warn('Skipping invalid URL:', aTag.href, err);
    }
  });
};

// NEW: Function to extract vendor from product page
const getProductVendor = () => {
  // Try multiple methods to find the vendor on the product page
  
  // Method 1: Look for vendor in meta tags
  const vendorMeta = document.querySelector('meta[property="product:brand"]');
  if (vendorMeta && vendorMeta.content) {
    return vendorMeta.content;
  }
  
  // Method 2: Look for vendor in JSON-LD structured data
  const jsonLdScript = document.querySelector('script[type="application/ld+json"]');
  if (jsonLdScript) {
    try {
      const data = JSON.parse(jsonLdScript.textContent);
      if (data.brand && data.brand.name) {
        return data.brand.name;
      }
    } catch (e) {
      // Continue to next method
    }
  }
  
  // Method 3: Look for vendor in common Shopify selectors
  const vendorSelectors = [
    '.product-vendor',
    '.product__vendor', 
    '[data-vendor]',
    '.vendor',
    '.brand'
  ];
  
  for (const selector of vendorSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      return element.textContent?.trim() || element.dataset.vendor;
    }
  }
  
  // Method 4: Try to extract from product form data
  const productForm = document.querySelector('form[action*="/cart/add"]');
  if (productForm) {
    const vendorInput = productForm.querySelector('input[name*="vendor"], input[data-vendor]');
    if (vendorInput && vendorInput.value) {
      return vendorInput.value;
    }
  }
  
  return null;
};

// NEW: Function to auto-switch store based on product vendor
const autoSwitchToProductVendor = () => {
  const current = new URL(window.location.href);
  
  // Only run on product pages
  if (!current.pathname.includes('/products/')) {
    return false;
  }
  
  const productVendor = getProductVendor();
  if (!productVendor) {
    console.log('Could not determine product vendor');
    return false;
  }
  
  console.log('Product vendor detected:', productVendor);
  
  // Find the store switcher input that matches this vendor
  const storeSwitcher = document.querySelector('store-switcher');
  if (!storeSwitcher) {
    console.log('Store switcher not found');
    return false;
  }
  
  const inputs = storeSwitcher.querySelectorAll('input');
  let matchingInput = null;
  
  // Look for exact match or case-insensitive match
  for (const input of inputs) {
    if (input.value.toLowerCase() === productVendor.toLowerCase() ||
        input.value.toLowerCase().includes(productVendor.toLowerCase()) ||
        productVendor.toLowerCase().includes(input.value.toLowerCase())) {
      matchingInput = input;
      break;
    }
  }
  
  if (matchingInput && matchingInput.value !== localStorage.getItem("store-selected")) {
    console.log('Auto-switching to store:', matchingInput.value);
    
    // Update the store selection
    localStorage.setItem("store-selected", matchingInput.value);
    document.querySelector("html").dataset.storeSelected = matchingInput.value;
    
    // Update the UI
    inputs.forEach(input => input.checked = false);
    matchingInput.checked = true;
    
    // Update filters and navigation
    setCollectionsFilters();
    if (typeof theme !== 'undefined' && theme.headerNav) {
      theme.headerNav.init();
    }
    
    return true;
  }
  
  return false;
};

class StoreSwitcher extends HTMLElement {
  constructor() {
    super();
    this.htmlEL = document.querySelector("html");
    this.inputs = this.querySelectorAll("input");

    this._init();
  }
  connectedCallback() {
    this.htmlEL = document.querySelector("html");
    this.inputs = this.querySelectorAll("input");
  }

  _init() {
    if (localStorage.getItem("store-selected")) {
      this.inputs.forEach((input) => {
        if (input.value === localStorage.getItem("store-selected")) {
          input.checked = true;
        }
      });
    }

    this.inputs.forEach((input) => {
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        this.inputs.forEach((otherInput) => {
          if (input.name === otherInput.name && input.id !== otherInput.id) {
            console.log("FOUND: ", otherInput);
            otherInput.removeAttribute("checked");
          }
        });
        this.htmlEL.dataset.storeSelected = input.value;
        localStorage.setItem("store-selected", input.value);
        setCollectionsFilters();
        if (typeof theme !== 'undefined' && theme.headerNav) {
          theme.headerNav.init();
        }
        const current = new URL(window.location.href);
        if (/\/(?:collections|products)\//.test(current.pathname)) {
          if (current.pathname.includes("/collections/") && !current.pathname.includes("/products/")) {
            console.log(input.value)
            if(input.value.includes("shop all brands")) {
              current.searchParams.delete("filter.p.vendor");
              window.location.replace(current.toString());
            } else {
              current.searchParams.set("filter.p.vendor", getStoreSentenceCase());
              window.location.replace(current.toString());
            }
          } else {
            window.location.reload();
          }
        }
      });
    });

    if (!localStorage.getItem("store-selected")) {
      localStorage.setItem("store-selected", this.inputs[0].value);
      this.htmlEL.dataset.storeSelected = this.inputs[0].value;
      if (typeof theme !== 'undefined' && theme.headerNav) {
        theme.headerNav.init();
      }
      const current = new URL(window.location.href);
      if (/\/(?:collections|products)\//.test(current.pathname)) {
        window.location.reload();
      }
    }
  }
}

customElements.define("store-switcher", StoreSwitcher);

const getStoreSentenceCase = () => {
  const rawStore = localStorage.getItem("store-selected");
  if (!rawStore) return;
  return rawStore[0].toUpperCase() + rawStore.slice(1);
};

document.addEventListener("DOMContentLoaded", () => {
  // NEW: Try to auto-switch to product vendor first
  const switched = autoSwitchToProductVendor();
  
  setCollectionsFilters();

  const current = new URL(window.location.href);
  const currentStore = getStoreSentenceCase();
  
  // Only apply collection filtering logic to actual collections pages (not product pages)
  // and respect "Shop All" selection
  if (
    current.pathname.includes("/collections/") &&
    !current.pathname.includes("/products/") &&
    !current.searchParams.has("filter.p.vendor") &&
    currentStore &&
    !currentStore.toLowerCase().includes("shop all brands")
  ) {
    current.searchParams.set("filter.p.vendor", currentStore);
    window.location.replace(current.toString());
    return;
  }
});

class StoreSwitchMenus extends HTMLElement {
  constructor() {
    super();

    // this.initMegaMenuPos();
    this.initMegaMenuHeight();
    this.initShowingLogic();
    this.initResizeListener();
  }

  initShowingLogic() {
    const header = document.getElementById("SiteHeader");
    const itemsWithMega = this.querySelectorAll(
      ".ssm__menu li:has(.ssm__mega-menu)"
    );
    const hideAllMegas = () => {
      itemsWithMega.forEach((li) => {
        li.querySelector(".ssm__mega-menu").classList.remove("visible");
      });
    };

    header.querySelectorAll("li:not(:has(.ssm__mega-menu))").forEach((el) => {
      el.addEventListener("mouseover", () => {
        hideAllMegas();
      });
    });

    header.addEventListener("mouseleave", () => {
      hideAllMegas();
    });

    this.querySelectorAll(".ssm__menu li:has(.ssm__mega-menu)").forEach(
      (link) => {
        link.addEventListener("mouseover", () => {
          hideAllMegas();
          this.initMegaMenuHeight();
          link.querySelector(".ssm__mega-menu").classList.add("visible");
        });
      }
    );
  }

  initResizeListener() {
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.initMegaMenuHeight();
      }, 100);
    });
  }
  initMegaMenuPos() {
    this.querySelectorAll(".ssm__menu-link").forEach((item) => {
      const trigger = item;
      const menu = item.parentElement.querySelector(".ssm__mega-menu");

      if (!menu) {
        return;
      }
      function positionMenu() {
        const menuRect = menu.getBoundingClientRect();
        const triggerRect = trigger.getBoundingClientRect();

        if (menuRect.left < 0) {
          menu.style.left = -triggerRect.left + "px";
          menu.style.transform = "none";
        }

        console.log(menuRect);
      }

      trigger.addEventListener("mouseenter", positionMenu);

      window.addEventListener("resize", positionMenu);
    });
  }
  initMegaMenuHeight() {
    const megaMenus = this.querySelectorAll(".ssm__mega-menu");
    megaMenus.forEach((megaMenu) => {
      const container = megaMenu.querySelector(".ssm__mega-menu-container");
      const menusMaxHeight =
        Math.max(
          ...Array.from(
            megaMenu.querySelectorAll(".ssm__mega-menu-container > div")
          ).map((menu) => menu.offsetHeight)
        ) + 30;
      console.log("MAx height: ", menusMaxHeight);
      container.style.maxHeight = Math.max(250, menusMaxHeight) + "px";
    });
  }
}
customElements.define("store-switch-menus", StoreSwitchMenus);