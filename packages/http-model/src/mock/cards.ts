import { faker } from "@faker-js/faker/locale/en";
import dayjs from "dayjs";

export function generateBankCard(
  options: { bin?: string; length?: number } = {},
) {
  const prefix = /^\d+$/.test(String(options.bin ?? ""))
    ? String(options.bin)
    : "621700";
  const length = Math.max(
    prefix.length + 1,
    Math.min(32, Number(options.length) || 19),
  );
  let digits = prefix;
  while (digits.length < length - 1) {
    digits += faker.number.int({ min: 0, max: 9 });
  }
  const sum = [...digits].reverse().reduce((total, value, index) => {
    let digit = Number(value) * (index % 2 === 0 ? 2 : 1);
    if (digit > 9) {
      digit -= 9;
    }
    return total + digit;
  }, 0);
  return digits + ((10 - (sum % 10)) % 10);
}

export function generateIdCard(
  options: { birth?: string; areacode?: string } = {},
) {
  const area =
    options.areacode ||
    faker.helpers.arrayElement(["110101", "310101", "440106", "510104"]);
  const birth =
    options.birth ||
    dayjs(faker.date.birthdate({ min: 18, max: 80, mode: "age" })).format(
      "YYYYMMDD",
    );
  if (!/^\d{6}$/.test(area) || !/^\d{8}$/.test(birth)) {
    throw new Error("ID card area and birthday must use six and eight digits.");
  }
  const base =
    area +
    birth +
    String(faker.number.int({ min: 1, max: 999 })).padStart(3, "0");
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const sum = [...base].reduce(
    (total, digit, index) => total + Number(digit) * weights[index],
    0,
  );
  return base + "10X98765432"[sum % 11];
}
