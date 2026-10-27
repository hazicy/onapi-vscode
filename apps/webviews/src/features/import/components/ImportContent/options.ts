export const createImportOptions = () => ({
  api_cover_modal: "url_and_folder",
  model_cover_modal: "name",
  env_cover_modal: "both",
  basePath: false,
  hostPath: false,
  chooseFolder: "0",
});
export type ImportOptions = ReturnType<typeof createImportOptions>;
