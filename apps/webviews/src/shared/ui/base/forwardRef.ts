import { forwardRef as reactForwardRef } from "react";
import type {
  ForwardRefRenderFunction,
  ForwardRefExoticComponent,
  RefAttributes,
  PropsWithoutRef,
} from "react";

/** Preserve declared callback types on legacy prop bags that include extension keys. */
export function forwardRef<T, P>(
  render: ForwardRefRenderFunction<T, P>,
): ForwardRefExoticComponent<P & RefAttributes<T>> {
  return reactForwardRef(
    render as ForwardRefRenderFunction<T, PropsWithoutRef<P>>,
  ) as ForwardRefExoticComponent<P & RefAttributes<T>>;
}
