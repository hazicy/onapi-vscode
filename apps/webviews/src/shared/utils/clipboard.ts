function copyWithSelection(text: string) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.clip = "rect(0 0 0 0)";
  textarea.style.top = "10px";
  document.body.appendChild(textarea);
  try {
    textarea.select();
    if (!document.execCommand("copy")) {
      throw new Error("Clipboard copy failed");
    }
  } finally {
    textarea.remove();
  }
}

async function writeText(text: string) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Webviews may expose the Clipboard API while denying write access.
    }
  }
  copyWithSelection(text);
}

export async function copyStringToClipboard(
  text: string,
  onSuccess?: () => void,
  onError?: () => void,
) {
  try {
    await writeText(text);
  } catch {
    onError?.();
    return;
  }
  onSuccess?.();
}
