class FilesDownloadSearchSection extends HTMLElement {
  constructor() {
    super();

    this.hasView = this.dataset.hasView === "true";
    this._init();
  }
  _init() {
    if (this.hasView) {
      const popup = document.getElementById("file-preview-popup");
      // if has view, then on click the popup should open
      this.querySelectorAll(".view-link").forEach((link) => {
        link.addEventListener("click", (e) => {
          e.preventDefault();

          if (popup) {
            popup.style.display = "flex";
            const popupContent = popup.querySelector(".popup-content");
            const popupBody = popup.querySelector(".popup-body");
            popupBody.innerHTML = ""; // Clear previous content

            const img = document.createElement("img");
            img.src = link.href;

            popupBody.appendChild(imageBox);
          }
        });
      });
      const closeButton = popup.querySelector(".close-popup");
      closeButton.addEventListener("click", () => {
        popup.style.display = "none";
        popupBody.innerHTML = ""; // Clear content on close
      });
    }
  }
}
customElements.define(
  "files-download-search-section",
  FilesDownloadSearchSection
);

class ProductsDownloadSearch extends HTMLElement {
  constructor() {
    super();

    this.search = this.querySelector(".js-search-products");
    this.searchForm = this.querySelector("form");
    this.__initSearch();

    this.floatingBtn = this.querySelector(".js-floating-btn");

    this._initFloatingButton();
    // initially   query the "Quorum" word param
    this.search.value = "Quorum";
    this.performSearch();
  }

  _initFloatingButton() {
    this.floatingBtn.addEventListener("click", async () => {
      let linksToDownload = Array.from(this.querySelectorAll("input:checked"))
        .map((checkbox) => {
          // Find the parent .fds__item container
          const item = checkbox.closest(".fds__item");
          if (item) {
            // Get the download link within this item
            const downloadLink = item.querySelector(".download-link");
            return downloadLink ? downloadLink.href : null;
          }
          return null;
        })
        .filter((href) => href && href !== "");

      console.log("Links to download:", linksToDownload.length);
      if (linksToDownload.length > 0) {
        try {
          const JSZip = (await import("https://cdn.skypack.dev/jszip")).default;
          const zip = new JSZip();
          let totalSize = 0;
          const MAX_SIZE = 1024 * 1024 * 1024; // 1GB in bytes

          const usedFilenames = new Set();

          for (const link of linksToDownload) {
            try {
              const response = await fetch(link);
              const blob = await response.blob();

              // Check if adding this file would exceed the limit
              if (totalSize + blob.size > MAX_SIZE) {
                alert(
                  "The zip file would exceed the 1GB size limit. Please select fewer files."
                );
                return;
              }

              totalSize += blob.size;
              let filename = link.split("/").pop() || `file_${Date.now()}`;

              // Ensure unique filename
              let counter = 1;
              const originalFilename = filename;
              while (usedFilenames.has(filename)) {
                const nameWithoutExt = originalFilename.replace(
                  /\.[^/.]+$/,
                  ""
                );
                const ext = originalFilename.match(/\.[^/.]+$/) || [""];
                filename = `${nameWithoutExt}_${counter}${ext[0]}`;
                counter++;
              }
              usedFilenames.add(filename);

              zip.file(filename, blob);
            } catch (error) {
              console.error(`Error downloading ${link}:`, error);
            }
          }

          const zipBlob = await zip.generateAsync({ type: "blob" });
          const url = URL.createObjectURL(zipBlob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `files_${Date.now()}.zip`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (error) {
          console.error("Error creating zip file:", error);
        }
      }
    });
  }

  __initSearch() {
    this.searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      this.performSearch();
    });
  }

  async performSearch() {
    try {
      const response = await fetch(
        this.searchForm.action +
          "?q=" +
          encodeURIComponent(this.search.value) +
          "&view=files_download"
      );
      const jsonData = await response.json();
      this.renderData(jsonData);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
  }

  renderData(data) {
    const template = this.querySelector("#file-item-template");
    const detailsTemplate = this.querySelector("#details-template");
    const accordionSection = this.querySelector(".spec-accordion-section");
    const fileTypes = [
      "revit",
      "photo_metrics",
      "instructions",
      "ies",
      "cutsheet",
    ];

    // Clear all existing items in static sections
    fileTypes.forEach((fileType) => {
      const container = this.querySelector(`[data-file-type="${fileType}"]`);
      if (container) {
        container.innerHTML = "";
      }
    });

    // Remove all dynamically created details sections
    const dynamicDetails = accordionSection.querySelectorAll(
      '.spec-accordion[data-dynamic="true"]'
    );
    dynamicDetails.forEach((detail) => detail.remove());

    // Render items for static file types
    data.products.forEach((product) => {
      fileTypes.forEach((fileType) => {
        const button = product.buttons[fileType];
        if (button && button.title && button.link) {
          const container = this.querySelector(
            `[data-file-type="${fileType}"]`
          );
          if (container && template) {
            const clone = template.content.cloneNode(true);

            const checkbox = clone.querySelector('input[type="checkbox"]');
            const fileName = clone.querySelector(".file-name");
            const viewLink = clone.querySelector(".view-link");
            const downloadLink = clone.querySelector(".download-link");

            checkbox.value = `${product.handle}_${fileType}`;
            fileName.textContent = button.title;
            viewLink.href = button.link;
            downloadLink.href = button.link;
            downloadLink.setAttribute("download", "");

            container.appendChild(clone);
          }
        }
      });
    });

    // Handle metaobject downloads - group by title
    const metaobjectGroups = {};

    data.products.forEach((product) => {
      const metaobjects = product.buttons.metaobjects_downloads;
      if (metaobjects && metaobjects.length > 0) {
        metaobjects.forEach((metaobject) => {
          if (
            metaobject.title &&
            metaobject.images &&
            metaobject.images.length > 0
          ) {
            const title = metaobject.title;

            if (!metaobjectGroups[title]) {
              metaobjectGroups[title] = [];
            }

            // Add each image as a separate item with product context
            metaobject.images.forEach((image) => {
              metaobjectGroups[title].push({
                productHandle: product.handle,
                title: title,
                imageSrc: image.src,
                imageAlt: image.alt,
              });
            });
          }
        });
      }
    });

    // Create details sections for each unique title
    Object.keys(metaobjectGroups).forEach((title) => {
      if (detailsTemplate) {
        const detailsClone = detailsTemplate.content.cloneNode(true);
        const detailsElement = detailsClone.querySelector(".spec-accordion");
        const titleSpan = detailsClone.querySelector(".title");
        const itemsContainer = detailsClone.querySelector(".fds__items");

        // Mark as dynamic and set title
        detailsElement.setAttribute("data-dynamic", "true");
        titleSpan.textContent = title;
        itemsContainer.setAttribute(
          "data-file-type",
          title.toLowerCase().replace(/\s+/g, "_")
        );

        // Add items for this title
        metaobjectGroups[title].forEach((item) => {
          if (template) {
            const itemClone = template.content.cloneNode(true);

            const checkbox = itemClone.querySelector('input[type="checkbox"]');
            const fileName = itemClone.querySelector(".file-name");
            const viewLink = itemClone.querySelector(".view-link");
            const downloadLink = itemClone.querySelector(".download-link");

            checkbox.value = `${item.productHandle}_${title}_${item.imageSrc}`;
            fileName.textContent =
              item.imageAlt || `${title} - ${item.productHandle}`;
            viewLink.href = item.imageSrc;
            downloadLink.href = item.imageSrc?.split("?v=")[0] || "#";
            downloadLink.setAttribute("download", "");

            itemsContainer.appendChild(itemClone);
          }
        });

        // Append the new details section
        accordionSection.appendChild(detailsClone);
      }
    });
  }
}

customElements.define("products-download-search", ProductsDownloadSearch);

document.addEventListener("DOMContentLoaded", function () {
  const toggle = document.querySelector(".accordion-toggle");
  const container = document.querySelector(".spec-accordion");

  toggle.addEventListener("click", function () {
    container.classList.toggle("accordion-open");
  });
});
