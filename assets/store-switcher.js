class StoreSwitcher extends HTMLElement {
  constructor() {
    super();
    this.htmlEL = document.querySelector("html");
    this.inputs = this.querySelectorAll("input");
    if (localStorage.getItem("store-selected")) {
      this.inputs.forEach((input) => {
        if (input.value === localStorage.getItem("store-selected")) {
          input.checked = true;
        }
      });
    }
    this.inputs.forEach((input) => {
      input.addEventListener("change", () => {
        this.htmlEL.dataset.storeSelected = input.value;
        localStorage.setItem("store-selected", input.value);
        theme.headerNav.init();
        const current = new URL(window.location.href);
        if (/\/(?:collections|products)\//.test(current.pathname)) {
          if (current.pathname.includes("/collections/")) {
            current.searchParams.set("filter.p.vendor", getStoreSentenceCase());
            window.location.replace(current.toString());
          } else {
            window.location.reload();
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
  // 1) pull + capitalize your store name
  const store = getStoreSentenceCase();
  // 2) for each link whose href *contains* “/collections/”
  document.querySelectorAll('a[href*="/collections/"]').forEach((aTag) => {
    try {
      // aTag.href is always an absolute URL string
      const url = new URL(aTag.href);

      // 3) only add if it’s missing
      if (!url.searchParams.has("filter.p.vendor")) {
        url.searchParams.set("filter.p.vendor", store);
        aTag.href = url.toString();
      }
    } catch (e) {
      // this should almost never fire, since aTag.href is absolute
      console.warn("Skipping invalid URL:", aTag.href);
    }
  });

  const current = new URL(window.location.href);
  if (
    current.pathname.includes("/collections/") &&
    !current.searchParams.has("filter.p.vendor")
  ) {
    current.searchParams.set("filter.p.vendor", store);
    // replace current history entry so back-button won’t bounce you endlessly
    window.location.replace(current.toString());
    return; // stop running the rest until after reload
  }
});
