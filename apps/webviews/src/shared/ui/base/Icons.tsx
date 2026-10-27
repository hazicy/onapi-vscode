import { forwardRef } from "react";
import type { SVGProps } from "react";
type Props = SVGProps<SVGSVGElement> & { rotate?: number; spin?: boolean };
const icon = (path: string) =>
  forwardRef<SVGSVGElement, Props>(({ rotate, spin, style, ...props }, ref) => (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      {...props}
      ref={ref}
      className={props.className}
      style={{
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
        ...style,
      }}
    >
      <path d={path} />
    </svg>
  ));
export const DownOutlined = icon("m3 5 5 5 5-5-1-1-4 4-4-4z");
export const CaretDownOutlined = icon("m3 5 5 6 5-6z");
export const CaretRightOutlined = icon("m5 3 6 5-6 5z");
export const UploadOutlined = icon(
  "M7 11h2V4l3 3 1-1-5-5-5 5 1 1 3-3zM2 10H1v5h14v-5h-1v4H2z",
);
export const CheckCircleFilled = icon(
  "M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m-1 12L3 8l1-1 3 3 5-5 1 1z",
);
export const CloseCircleFilled = icon(
  "M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0m4 11-1 1-3-3-3 3-1-1 3-3-3-3 1-1 3 3 3-3 1 1-3 3z",
);
