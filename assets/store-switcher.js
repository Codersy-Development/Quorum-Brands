class StoreSwitcher extends HTMLElement {
  constructor() {
    super();

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
        const htmlEL = document.querySelector("html");
        htmlEL.dataset.storeSelected = input.value;
        localStorage.setItem("store-selected", input.value);
      });
    });
  }
}

customElements.define("store-switcher", StoreSwitcher);
