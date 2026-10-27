import type { DatePickerProps } from "./types";

export const DatePicker = ({
  value,
  onChange,
  format,
  showTime,
  ...props
}: DatePickerProps) => (
  <input
    {...props}
    type={showTime ? "datetime-local" : "date"}
    value={
      (typeof value === "object"
        ? value?.format(showTime ? "YYYY-MM-DDTHH:mm" : "YYYY-MM-DD")
        : value) ?? ""
    }
    onChange={async (e) => {
      const dayjs = (await import("dayjs")).default;
      onChange?.(e.target.value ? dayjs(e.target.value) : null, e.target.value);
    }}
  />
);
