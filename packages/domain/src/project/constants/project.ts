import { Project, TeamItem } from "@onapi/domain/auth/types/index";
import dayjs from "dayjs";
import { DEFAULT_TEAM } from "@onapi/domain/project/constants/team";
import { ProjectConfigType } from "@onapi/domain/project/types/index";

export const INIT_ENV_LIST = [
  {
    env_id: "1",
    name: "Default Environment",
    is_private: -1,
    sort: 1,
    server_list: [
      {
        server_id: "1",
        name: "Default Services",
        sort: 1,
        uri: "",
        is_default: 1,
      },
    ],
    env_var_list: {},
  },
];

export const INIT_SERVER_LIST = [
  {
    name: "Default Services",
    server_id: "1",
    uri: "",
    sort: 1,
    is_default: 1,
  },
];

export const DEFAULT_PROJECT: Project = {
  project_id: "-1",
  team_id: "",
  name: "Local Project",
  is_lock: -1,
  is_default: 1,
  is_describe_library: 1,
  is_force: "1",
  logo: "",
  intro: "",
  created_at: dayjs().toDate(),
  can_del: -1,
  can_quit: -1,
  is_project_admin: 1,
  role: 1,
  authority: 3,
  edited_at: dayjs().toDate(),
  upgrade_status: 1,
};

export const DEFAULT_TEAM_PROJECT: TeamItem = {
  ...DEFAULT_TEAM,
  project: [{ ...DEFAULT_PROJECT }],
};

export const DEFAULT_PROJECT_CONFIG: ProjectConfigType = {
  http: {
    collection: {
      info: {
        name: "Requests",
        schema:
          "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
      },
    },
    environments: [
      {
        id: "default",
        name: "Default",
        values: [{ key: "baseUrl", value: "https://httpbin.org" }],
      },
    ],
    activeEnvironment: "default",
    options: {
      globals: { values: [] },
      stopOnError: true,
      timeout: { request: 30000, script: 30000 },
      requester: { strictSSL: false, followRedirects: true },
    },
  },
  envList: INIT_ENV_LIST,
  envDetailKeys: "1",
  serverList: INIT_SERVER_LIST,
};
