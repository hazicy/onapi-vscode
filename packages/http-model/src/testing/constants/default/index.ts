/**
 * Default data for adding test cases
 */
export const ADD_CASE_DEFAULT = {
  parentId: "",
  project_id: "",
  name: "",
  settings: {
    env_id: "",
    /**Whether to use test data */
    enable_request: -1,
    /**Execution count */
    execute_count: 1,
    /**Execution interval (milliseconds) */
    interval_time: 0,
    /**Whether to continue execution on error */
    ignore_error: 1,
    /**Sandbox execution mode */
    enable_sandbox: -1,
    /**Test data */
    iteration_data: [],
    /**unknown */
    iterates_data_list: [],
    /**unknown */
    iterates_data_id: "0",
  },
  testing_type: "testing",
  event_list: [],
};
