import type { Page } from "@playwright/test";

export class BaseComponentsPage {
  constructor(readonly page: Page) {}

  async open(query = "") {
    await this.page.goto("/?base" + query);
  }

  get smallButton() {
    return this.page.getByRole("button", { name: "Small module button" });
  }

  get largeButton() {
    return this.page.getByRole("button", { name: "Large module button" });
  }

  get styledEmptyDescription() {
    return this.page.getByText("Styled empty description", { exact: true });
  }

  get plainEmptyDescription() {
    return this.page.getByText("Plain empty description", { exact: true });
  }

  get textValueTextbox() {
    return this.page.getByRole("textbox", { name: "Text value" });
  }

  get acceptTermsCheckbox() {
    return this.page.getByRole("checkbox", { name: "Accept terms" });
  }

  get enableFeatureSwitch() {
    return this.page.getByRole("switch", { name: "Enable feature" });
  }

  get modeBRadio() {
    return this.page.getByRole("radio", { name: "Mode B" });
  }

  get searchChoiceCombobox() {
    return this.page.getByRole("combobox", { name: "Search choice" });
  }

  get secondOption() {
    return this.page.getByRole("option", { name: "Second option" });
  }

  get controlResultStatus() {
    return this.page.getByRole("status", { name: "Control result" });
  }

  get multipleChoicesCombobox() {
    return this.page.getByRole("combobox", { name: "Multiple choices" });
  }

  get alphaOption() {
    return this.page.getByRole("option", { name: "Alpha" });
  }

  get removeAlphaButton() {
    return this.page.getByRole("button", { name: "Remove Alpha" });
  }

  get secondTab() {
    return this.page.getByRole("tab", { name: "Second tab" });
  }

  get firstPanel() {
    return this.page.getByRole("tabpanel", { name: "First tab" });
  }

  get secondPanel() {
    return this.page.getByRole("tabpanel", { name: "Second tab" });
  }

  get expandDetailsButton() {
    return this.page.getByRole("button", { name: "Expand details" });
  }

  get expandedContent() {
    return this.page.getByText("Expanded content");
  }

  get saveFormButton() {
    return this.page.getByRole("button", { name: "Save form" });
  }

  get alert() {
    return this.page.getByRole("alert");
  }

  get requiredNameTextbox() {
    return this.page.getByRole("textbox", { name: "Required name" });
  }

  get submittedValueStatus() {
    return this.page.getByRole("status", { name: "Submitted value" });
  }

  get firstRow() {
    return this.page.getByRole("row", { name: "First row" });
  }

  get rowSelectionStatus() {
    return this.page.getByRole("status", { name: "Row selection" });
  }

  get leafNodeTreeitem() {
    return this.page.getByRole("treeitem", { name: "Leaf node" });
  }

  get openMenuButton() {
    return this.page.getByRole("button", { name: "Open menu", exact: true });
  }

  get runMenuActionMenuitem() {
    return this.page.getByRole("menuitem", { name: "Run menu action" });
  }

  get menuResultStatus() {
    return this.page.getByRole("status", { name: "Menu result" });
  }

  get openConfirmationButton() {
    return this.page.getByRole("button", { name: "Open confirmation" });
  }

  get confirmActionDialog() {
    return this.page.getByRole("dialog", { name: "Confirm action" });
  }

  get showToastButton() {
    return this.page.getByRole("button", { name: "Show toast" });
  }

  get savedSuccessfully() {
    return this.page.getByText("Saved successfully");
  }

  get fileInput() {
    return this.page.locator("input[type=file]");
  }

  get uploadedNameStatus() {
    return this.page.getByRole("status", { name: "Uploaded name" });
  }

  get contextTargetButton() {
    return this.page.getByRole("button", { name: "Context target" });
  }

  get runContextActionMenuitem() {
    return this.page.getByRole("menuitem", { name: "Run context action" });
  }

  get awaitConfirmationButton() {
    return this.page.getByRole("button", {
      name: "Await confirmation",
      exact: true,
    });
  }

  get awaitConfirmationDialog() {
    return this.page.getByRole("dialog", { name: "Await confirmation" });
  }

  get tagValuesCombobox() {
    return this.page.getByRole("combobox", { name: "Tag values" });
  }

  get treeChoice() {
    return this.page.getByLabel("Tree choice", { exact: true });
  }

  get leafChoice() {
    return this.page.getByText("Leaf choice", { exact: true });
  }

  get clearButton() {
    return this.page.getByRole("button", { name: "Clear", exact: true });
  }

  get increaseButton() {
    return this.page.getByRole("button", { name: "Increase", exact: true });
  }
}
