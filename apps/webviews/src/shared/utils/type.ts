const BUILT_IN_CONSTRUCTORS = new Set<Function>([
  Object,
  Function,
  Array,
  String,
  Boolean,
  Number,
  Date,
  RegExp,
  Error,
]);

export function getTypeName(value: unknown): string {
  const typeName = Object.prototype.toString.call(value).slice(8, -1);
  if (value === null || value === undefined) {
    return typeName.toLowerCase();
  }

  const constructor = (value as { constructor?: Function }).constructor;
  return constructor && !BUILT_IN_CONSTRUCTORS.has(constructor)
    ? constructor.name
    : typeName;
}
