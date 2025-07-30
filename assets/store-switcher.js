// ADD THIS AT THE VERY TOP
const isAllBrands = (storeValue) => {
  if (!storeValue) return false;
  const normalized = storeValue.toLowerCase().trim();
  return normalized === 'all brands';
};

const setCollectionsFilters = () => {
  // 1) pull + capitalize your store name
  const store = getStoreSentenceCase();
  // 2) for each link whose href *contains* “/collections/”
  document.querySelectorAll('a[href*="/collections/"]').forEach((aTag) => {
    try {
      // aTag.href is always an absolute URL string
      const url = new URL(aTag.href);
if (isAllBrands(store)) {
        url.searchParams.delete("filter.p.vendor");
        aTag.href = url.toString();
        return
      }
      // 3) only add if it’s missing
      if (!url.searchParams.has("filter.p.vendor")) {
        url.searchParams.set("filter.p.vendor", store);
        aTag.href = url.toString();
      } else {
        url.searchParams.set("filter.p.vendor", store);
        aTag.href = url.toString();
      }
    } catch (e) {
      // this should almost never fire, since aTag.href is absolute
      console.warn("Skipping invalid URL:", aTag.href);
    }
  });
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
        theme.headerNav.init();
const current = new URL(window.location.href);
        if (/\/(?:collections|products)\//.test(current.pathname)) {
          if (current.pathname.includes("/collections/") && !current.pathname.includes("/products/")) {
            // This is a collections page
            console.log('Collection page - store value:', input.value);
            if(isAllBrands(input.value)) {
              current.searchParams.delete("filter.p.vendor");
              window.location.replace(current.toString());
            } else {
              current.searchParams.set("filter.p.vendor", getStoreSentenceCase());
              window.location.replace(current.toString());
            }
          } else if (current.pathname.includes("/products/")) {
            // This is a product page
            console.log('Product page - store value:', input.value);
            if(isAllBrands(input.value)) {
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
      theme.headerNav.init();
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
  setCollectionsFilters();

  const current = new URL(window.location.href);
  const currentStore = localStorage.getItem("store-selected");
  
  console.log('Page URL:', current.href);
  console.log('Current store:', currentStore);
  console.log('Is product page:', current.pathname.includes("/products/"));
  console.log('Is collection page:', current.pathname.includes("/collections/") && !current.pathname.includes("/products/"));
  
  // Handle product pages FIRST (they take priority)
  if (current.pathname.includes("/products/")) {
    console.log('Processing as product page');
    
    if (current.searchParams.has("filter.p.vendor") && currentStore && isAllBrands(currentStore)) {
      console.log('Removing vendor filter from product page for All Brands');
      current.searchParams.delete("filter.p.vendor");
      window.location.replace(current.toString());
      return;
    }
    // For product pages, don't do anything else - let the page load normally
    return;
  }
  
  // Handle collection pages ONLY (not products accessed through collections)
  if (current.pathname.includes("/collections/") && !current.pathname.includes("/products/")) {
    console.log('Processing as collection page');
    
    const existingVendor = current.searchParams.get("filter.p.vendor");
    
    if (currentStore && isAllBrands(currentStore)) {
      if (existingVendor) {
        console.log('All Brands selected - removing vendor filter from collection');
        current.searchParams.delete("filter.p.vendor");
        window.location.replace(current.toString());
        return;
      }
    } else if (currentStore && !existingVendor) {
      const storeSentence = currentStore[0].toUpperCase() + currentStore.slice(1);
      console.log('Adding vendor filter for collection:', storeSentence);
      current.searchParams.set("filter.p.vendor", storeSentence);
      window.location.replace(current.toString());
      return;
    }
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
