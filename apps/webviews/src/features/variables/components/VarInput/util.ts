export function getElementTextOffset(
  element: HTMLInputElement | HTMLTextAreaElement,
  index: number,
) {
  const sourceStyle = window.getComputedStyle(element);
  const sourceRect = element.getBoundingClientRect();
  const measure = document.createElement("div");
  const marker = document.createElement("span");
  const text = element.value.slice(0, index);

  Object.assign(measure.style, {
    boxSizing: sourceStyle.boxSizing,
    position: "fixed",
    left: `${sourceRect.left}px`,
    top: `${sourceRect.top}px`,
    width: `${element.clientWidth}px`,
    height: `${element.clientHeight}px`,
    padding: sourceStyle.padding,
    border: sourceStyle.border,
    font: sourceStyle.font,
    letterSpacing: sourceStyle.letterSpacing,
    lineHeight: sourceStyle.lineHeight,
    whiteSpace: element instanceof HTMLTextAreaElement ? "pre-wrap" : "pre",
    overflowWrap:
      element instanceof HTMLTextAreaElement ? "break-word" : "normal",
    wordBreak: sourceStyle.wordBreak,
    visibility: "hidden",
    overflow: "hidden",
  });
  measure.textContent = text;
  marker.textContent = "\u200b";
  measure.appendChild(marker);
  document.body.appendChild(measure);

  const markerRect = marker.getBoundingClientRect();
  const result = {
    left:
      markerRect.left -
      (element instanceof HTMLTextAreaElement ? element.scrollLeft : 0),
    top:
      markerRect.bottom -
      (element instanceof HTMLTextAreaElement ? element.scrollTop : 0) +
      5,
  };
  measure.remove();
  return result;
}
