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