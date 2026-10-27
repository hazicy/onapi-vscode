import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import i18next from "i18next";
import { isNumber, isUndefined } from "lodash";

dayjs.extend(isToday);
dayjs.extend(isYesterday);
dayjs.extend(duration);
dayjs.extend(utc);
dayjs.extend(timezone);

type TimeType = any;

/**
 *
 * Abbreviation:
 * DT - Datetime
 * L - Long
 * M - Medium
 * S - Short
 */
export const TIME_FORMAT = {
  /**
   * DateTime (Long): 2024-12-04 08:24:00
   */
  DT_L: "YYYY-MM-DD HH:mm:ss",
  /**
   * DateTime (Medium): 2024-12-04 08:24
   */
  DT_M: "YYYY-MM-DD HH:mm",
  /**
   * DateTime (Short): 2024-12-04
   */
  DT_S: "YYYY-MM-DD",
  /**
   * Date: 12-04
   */
  DATE_MD: "MM-DD",
  /**
   * Date: 2024-12
   */
  DATE_YM: "YYYY-MM",
  /**
   * Time (Long): 14:57:31
   */
  TIME_L: "HH:mm:ss",
  /**
   * Time (Medium): 14:57
   */
  TIME_M: "HH:mm",
};

export const formatTime = (time: TimeType, format: string) => {
  return dayjs(time).format(format);
};

export const formatTimeToDateTimeLong = (time: TimeType) => {
  return dayjs(time).format(TIME_FORMAT.DT_L);
};

export const formatTimeToDateTimeMedium = (time: TimeType) => {
  return dayjs(time).format(TIME_FORMAT.DT_M);
};

export const formatTimeToDateTimeShort = (time: TimeType) => {
  return dayjs(time).format(TIME_FORMAT.DT_S);
};

/**
 * Today
 */
export const today = (date: Date) => {
  return dayjs(formatTimeToDateTimeShort(date)).isToday();
};

/**
 * Yesterday
 */
export const yesterday = (date: Date) => {
  return dayjs(formatTimeToDateTimeShort(date)).isYesterday();
};

/**
 * Convert to hours minutes seconds
 */
export const formatTimeToHMS = (time: number) => {
  return dayjs
    .duration(time, "seconds")
    .format(i18next.t("supplement.time_hms"));
};

/**
 * Convert to ISO time
 */
export const formatTimeToISO = (time: number) => {
  return dayjs(time).tz("Asia/Shanghai").format();
};

export const formatTimeDiff = (date: Date) => {
  let timestamp = new Date(date).getTime();
  if (isUndefined(timestamp)) {
    return i18next.t("common.time.second", { time: "0" });
  }
  if (!isNumber(timestamp)) {
    timestamp = parseInt(timestamp);
  }
  if (`${timestamp}`.length === 10) {
    timestamp = Math.floor(timestamp * 1000);
  }
  const now = Date.now();
  let diff = (now - timestamp) / 1000; // Calculate time difference in seconds
  if (diff < 0) {
    diff = 0;
  }
  if (diff < 60) {
    // Less than one minute, display seconds
    return i18next.t("common.time.second", { time: Math.floor(diff) });
  }
  if (diff < 3600) {
    // Less than one hour, display minutes
    return i18next.t("common.time.minute", { time: Math.floor(diff / 60) });
  }
  if (diff < 86400) {
    // Less than one day, display hours
    return i18next.t("common.time.hours", { time: Math.floor(diff / 3600) });
  }
  if (diff < 86400 * 30) {
    // Less than one month, display days
    return i18next.t("common.time.day", { time: Math.floor(diff / 86400) });
  }
  if (diff < 86400 * 30 * 12) {
    // Less than one year, display months
    return i18next.t("common.time.month", {
      time: Math.floor(diff / (86400 * 30)),
    });
  }
  // More than 12 months, display years
  return i18next.t("common.time.year", {
    time: Math.floor(diff / (86400 * 30) / 12),
  });
};
