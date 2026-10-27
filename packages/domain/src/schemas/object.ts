import * as z from "zod";

/** Preserve extension fields at runtime; expose declared fields to callers. */
export function extensibleObject<Shape extends z.ZodRawShape>(
  shape: Shape,
): z.ZodType<z.output<z.ZodObject<Shape>>, z.input<z.ZodObject<Shape>>> {
  return z.looseObject(shape);
}
