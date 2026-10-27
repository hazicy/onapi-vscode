export const parseSafeBash = (bash: string) => {
  let result = bash;
  result = result.replace(/\^\\\^"/g, '\\"');
  // Compatible with mac
  result = result.replace(/\^\n/g, "\\\n");
  // Compatible with windows
  result = result.replace(/\^\r\n/g, "\\\r\n");
  result = result.replace(/\^/g, "");
  return result;
};
