/**
 * Create migration
 */

/**
 * Migration status
 */

/**
 * Migration result
 */
export enum MIGRATE_RESULT_STATUS {
  /** Normal */
  NORMAL = 1,
  /** Pending migration */
  WAIT = -1,
  /** Migrating */
  MIGRATING = -2,
  /** Migration failed */
  FAIL = -3,
  /** Migration successful */
  SUCCESS = 3,
}

/**
 * Migration type
 */
