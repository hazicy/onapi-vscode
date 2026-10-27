import type { Page } from "@playwright/test";

export class DataPage {
  constructor(readonly page: Page) {}

  async open(query = "") {
    await this.page.goto("/?data" + query);
  }

  get dataTableRegion() {
    return this.page.getByRole("region", { name: "Data table", exact: true });
  }

  get selectedRows() {
    return this.page.getByLabel("Selected rows");
  }

  get filesTree() {
    return this.page.getByRole("tree", { name: "Files", exact: true });
  }

  get halfCheckedKeys() {
    return this.page.getByLabel("Half checked keys");
  }

  get clearTreeChecksButton() {
    return this.page.getByRole("button", { name: "Clear tree checks" });
  }

  get lazyFolderTreeitem() {
    return this.page.getByRole("treeitem", {
      name: "Lazy folder",
      exact: true,
    });
  }

  get loadedChildTreeitem() {
    return this.page.getByRole("treeitem", {
      name: "Loaded child",
      exact: true,
    });
  }

  get collapseLazyFolderButton() {
    return this.page.getByRole("button", { name: "Collapse Lazy folder" });
  }

  get expandLazyFolderButton() {
    return this.page.getByRole("button", { name: "Expand Lazy folder" });
  }

  get loadCount() {
    return this.page.getByLabel("Load count");
  }

  get folderChoiceCombobox() {
    return this.page.getByRole("combobox", { name: "Folder choice" });
  }

  get searchTreeTextbox() {
    return this.page.getByRole("textbox", { name: "Search tree" });
  }

  get secondChoiceTreeitem() {
    return this.page.getByRole("treeitem", {
      name: "Second choice",
      exact: true,
    });
  }

  get chosenFolder() {
    return this.page.getByLabel("Chosen folder");
  }

  get resetChoiceButton() {
    return this.page.getByRole("button", { name: "Reset choice" });
  }

  get firstChoiceTreeitem() {
    return this.page.getByRole("treeitem", {
      name: "First choice",
      exact: true,
    });
  }

  get localFilesRegion() {
    return this.page.getByRole("region", { name: "Local files" });
  }

  get fileNames() {
    return this.page.getByLabel("File names");
  }

  get fileChanges() {
    return this.page.getByLabel("File changes");
  }

  get removeTwoJsonButton() {
    return this.page.getByRole("button", {
      name: "Remove two.json",
      exact: true,
    });
  }

  get resizableDraggableTableRegion() {
    return this.page.getByRole("region", {
      name: "Resizable draggable table",
    });
  }

  get treeDrop() {
    return this.page.getByLabel("Tree drop");
  }

  get rowOrder() {
    return this.page.getByLabel("Row order");
  }
}
