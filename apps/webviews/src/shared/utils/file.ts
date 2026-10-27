export const fileTodataUrl = (file: File): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result?.toString() || "");
    reader.onerror = (error) => reject(error);
  });
};

export const dataURLtoFile = (dataurl: any, filename: any) => {
  const arr: any = dataurl.split(",");
  const mime: any = arr[0].match(/:(.*?);/)[1];
  const bstr: any = atob(arr[arr.length - 1]);

  let n: any = bstr.length;
  const u8arr: any = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const getFileExtension = (filename: any) => {
  const regex = /(?:\.([^.]+))?$/;
  const extension = regex.exec(filename)?.[1];

  return extension;
};
