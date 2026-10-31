import type {
  OnapiDocument,
  OnapiGlobalParams,
} from "@onapi/domain/import/types/onapi";
import type { GrpcConfig } from "@onapi/domain/requests/grpc";
import { WebSocketConfig } from "@onapi/domain/requests/types/websocket";
import { SocketIoConfig } from "@onapi/domain/requests/types/socketio";
import { EnvListItem } from "@onapi/domain/environment/types/index";
import {
  ConnectToDatabaseItem,
  CustomAttributeItem,
  DescriptionItem,
  MarkItem,
  MockItem,
} from "@onapi/domain/project/types/index";
import { TestingDetailData } from "@onapi/domain/testing/types/index";

export type ApiSampleItems = {
  sample_id: string;
  type: string;
} & OnapiDocument;

type ExportCodesItem = {
  code_number: string;
  code_msg: string;
};

export type ExportServersItem = {
  server_id: string;
  name: string;
};

type ModelsItem = {
  model_id: string;
  model_type: string;
  description: string;
  parentId: string;
  project_id: string;
  name: string;
  display_name: string;
  schema?: any;
  sort?: number;
};

export type GlobalVars = {
  [k: string]: {
    value: string;
    current_value: string;
    description: string;
  };
};

export type ImportApis = OnapiDocument & {
  message?: any;
  config?: WebSocketConfig | SocketIoConfig;
  grpc?: GrpcConfig;
  server_id: string;
};

export type ApiProjectImportParams = {
  project_id: string;
  name: string;
  intro: string;
  global: {
    envs: EnvListItem[];
    servers: ExportServersItem[];
    global_vars: GlobalVars;
    global_param: OnapiGlobalParams;
    codes: ExportCodesItem[];
    marks: MarkItem;
    attributes: CustomAttributeItem[];
    mock_custom_rules: MockItem[];
    db_link: ConnectToDatabaseItem[];
    describe_library: DescriptionItem[];
  };
  models: ModelsItem[];
  apis: ImportApis[];
  samples: ApiSampleItems[];
  automated_testings: TestingDetailData[];
};
