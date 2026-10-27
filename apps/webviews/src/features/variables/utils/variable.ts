import { includes } from "lodash";

export const transFuncName = (originName: string, value: any) => {
  try {
    let name = originName;
    const v = value[originName];
    switch (originName) {
      case "substr":
        name = `substr(${v?.start || 0}${v?.length ? `,${v?.length}` : ""})`;
        break;
      case "sha":
        name = `${v?.text}`;
        break;
      case "concat":
        name = v?.text ? `concat(${v?.text})` : "concat";
        break;
      case "lconcat":
        name = v?.text ? `lconcat(${v?.text})` : "lconcat";
        break;
      case "padStart":
        name = `padStart(${v?.length || 0}${v?.text ? `,${v?.text}` : ""})`;
        break;
      case "padEnd":
        name = `padEnd(${v?.length || 0}${v?.text ? `,${v?.text}` : ""})`;
        break;

      default:
        break;
    }
    return name;
  } catch (err) {
    return originName;
  }
};

export const transKey = (key: string) => {
  if (includes(["length.min", "extensionCount.min", "count.min"], key)) {
    return "min";
  }
  if (includes(["length.max", "extensionCount.max", "count.max"], key)) {
    return "max";
  }
  return key;
};
