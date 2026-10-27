/**
 * Create migration
 */
export enum MIGRATE_CREATE {
  /** Skip */
  CLOSE = 0,
  /** Select migration type */
  SELECT = 1,
  /** Select team or project based on migration type */
  SELECT_TEAM_OR_PROJECT = 2,
}

/**
 * Migration status
 */
export enum MIGRATE_STATUS {
  /** Closed */
  CLOSE = 0,
  /** Start migration */
  START = 1,
  /** Migrating */
  MIGRATING = 2,
  /** Migration complete */
  FINISH = 3,
}

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
export enum MIGRATE_TYPE {
  /** Migrate team */
  TEAM = "team",
  /** Migrate project */
  PROJECT = "project",
}
