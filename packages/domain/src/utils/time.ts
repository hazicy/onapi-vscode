import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import isToday from "dayjs/plugin/isToday";
import isYesterday from "dayjs/plugin/isYesterday";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";



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



/**
 * Today
 */

/**
 * Yesterday
 */

/**
 * Convert to hours minutes seconds
 */

/**
 * Convert to ISO time
 */
