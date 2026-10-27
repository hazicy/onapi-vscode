const stub = `export const env = { language: 'en' };
export class TreeItem {
  constructor(label, collapsibleState) {
    this.label = label;
    this.collapsibleState = collapsibleState;
  }
}
export class EventEmitter {
  event = () => ({ dispose() {} });
  fire() {}
  dispose() {}
}`;

export function resolve(specifier, context, nextResolve) {
  if (specifier === "vscode") {
    return {
      url: "data:text/javascript," + encodeURIComponent(stub),
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
