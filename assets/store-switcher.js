const setCollectionsFilters = () => {
  const VENDOR_KEY = 'filter.p.vendor';
  const store      = getStoreSentenceCase();
  
  document.querySelectorAll('a[href*="/collections/"]').forEach((aTag) => {
    try {
      const url = new URL(aTag.href);          // always absolute in browsers
      
      // IMPORTANT: Only modify actual collections pages, not product pages
      if (url.pathname.includes('/products/')) {
        // This is a product page - don't modify the main URL structure, just handle filters
        if (store === 'all brands' || store === 'All Brands') {
          url.searchParams.delete(VENDOR_KEY);
        } else {
          url.searchParams.set(VENDOR_KEY, store);
        }
      } else {
        // This is a collections page - apply normal filtering
        if (store === 'all brands' || store === 'All Brands') {
          url.searchParams.delete(VENDOR_KEY);
        } else {
          url.searchParams.set(VENDOR_KEY, store);
        }
      }
      
      // write the revised URL back to the link
      aTag.href = url.toString();
    } catch (err) {
      // only triggers for malformed hrefs (rare, but nice to log)
      console.warn('Skipping invalid URL:', aTag.href, err);
    }
  });
};

// NEW: Function to dispatch custom events for other scripts
const dispatchStoreChangeEvent = (selectedStore) => {
  // Dispatch custom event for recently viewed and other scripts
  const storeChangedEvent = new CustomEvent('storeChanged', {
    detail: { 
      selectedStore: selectedStore,
      timestamp: Date.now()
    },
    bubbles: true
  });
  
  document.dispatchEvent(storeChangedEvent);
  console.log('Dispatched storeChanged event for:', selectedStore);
  
  // Also dispatch backup event name
  const storeUpdateEvent = new CustomEvent('storeUpdate', {
    detail: { store: selectedStore }
  });
  
  document.dispatchEvent(storeUpdateEvent);
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
            otherInput.removeAttribute("checked");
          }
        });
        this.htmlEL.dataset.storeSelected = input.value;
        localStorage.setItem("store-selected", input.value);
        
        // NEW: Dispatch custom event for other scripts to listen to
        dispatchStoreChangeEvent(input.value);
        
        setCollectionsFilters();
        if (typeof theme !== 'undefined' && theme.headerNav) {
          theme.headerNav.init();
        }
        const current = new URL(window.location.href);
        if (/\/(?:collections|products)\//.test(current.pathname)) {
          if (current.pathname.includes("/collections/") && !current.pathname.includes("/products/")) {
            // This is a collections page
            if(input.value.toLowerCase().includes("all brands")) {
              current.searchParams.delete("filter.p.vendor");
              window.location.replace(current.toString());
            } else {
              current.searchParams.set("filter.p.vendor", getStoreSentenceCase());
              window.location.replace(current.toString());
            }
          } else {
            // This is a product page - also handle vendor filter removal for "ALL BRANDS"
            if(input.value.toLowerCase().includes("all brands")) {
              current.searchParams.delete("filter.p.vendor");
              window.location.replace(current.toString());
            } else {
              window.location.reload();
            }
          }
        }
      });
    });

    if (!localStorage.getItem("store-selected")) {
      localStorage.setItem("store-selected", this.inputs[0].value);
      this.htmlEL.dataset.storeSelected = this.inputs[0].value;
      
      // NEW: Dispatch event for initial store selection
      if (this.inputs[0].value) {
        dispatchStoreChangeEvent(this.inputs[0].value);
      }
      
      if (typeof theme !== 'undefined' && theme.headerNav) {
        theme.headerNav.init();
      }
      const current = new URL(window.location.href);
      if (/\/(?:collections|products)\//.test(current.pathname)) {
        window.location.reload();
      }
    } else {
      // NEW: Dispatch event for restored store selection on page load
      const currentStore = localStorage.getItem("store-selected");
      if (currentStore) {
        dispatchStoreChangeEvent(currentStore);
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
  setCollectionsFilters();

  const current = new URL(window.location.href);
  const currentStore = getStoreSentenceCase();
  
  // Handle product pages with vendor filters when "All BRANDS" is selected
  if (current.pathname.includes("/products/") && 
      current.searchParams.has("filter.p.vendor") &&
      currentStore &&
      currentStore.toLowerCase().includes("all brands")) {
    current.searchParams.delete("filter.p.vendor");
    window.location.replace(current.toString());
    return;
  }
  
  // Only apply collection filtering logic to actual collections pages (not product pages)
  // and respect "all brands" selection
  if (
    current.pathname.includes("/collections/") &&
    !current.pathname.includes("/products/") &&
    !current.searchParams.has("filter.p.vendor") &&
    currentStore &&
    !currentStore.toLowerCase().includes("all brands")
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
      container.style.maxHeight = Math.max(250, menusMaxHeight) + "px";
    });
  }
}
customElements.define("store-switch-menus", StoreSwitchMenus);