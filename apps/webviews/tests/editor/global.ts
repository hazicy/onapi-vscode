export async function getEditorVariable(key: string) {
  return key === "{{token}}" ? "**Current value** **:** example-token" : "";
}
