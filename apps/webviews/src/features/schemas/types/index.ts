// Get max sort value for test cases
export type TYPE_GET_MAX_SORT = (val: Partial<IDataModel>) => Promise<number>;

// Get default model info
export type TYPE_GET_CONSTANT_DATA = (
  model_type: DATA_MODEL_TYPE,
) => IDataModel | IDataModelFolder;

export type DATA_MODEL_TYPE = "model" | "folder";

// Compare two data models for consistency
export type TYPE_DIFF_OBJECT_JSON = (
  source: IDataModel,
  opens: IDataModel,
) => 1 | -1;

// Model directory info
export type IDataModelFolder = Omit<IDataModel, "display_name" | "description">;

// Convert data model to JSON-schema
export type TYPE_PARSE_MODEL_TO_JSON_SCHEMA = (
  model: object,
  parentNodes: string[],
  schemasBaseData: any,
) => Promise<object>;

export type DirectoryCreate = {
  /**Model type */
  model_type: DATA_MODEL_TYPE;
  /**Project ID */
  project_id: string;
  /**Name */
  name: string;
  /**Model ID */
  model_id: string;
};

export type SchemaData = {
  type: string;
  properties: { [key: string]: SchemaData };
  apipiost_allow_null: boolean;
  description: string;
  ONAPI_ORDERS: string[];
  required: string[];
  ONAPI_REFS: { [model_id: string]: { ref: string } };
};

export type SocketType = 1 | -1;

export type ModelCreate = {
  /**Description */
  description: string;
  /**Parent ID */
  parentId: string;
  /**Schema data */
  schema: SchemaData;
  /**Alias */
  display_name: string;
  /**Sort order */
  sort: number;
  /**Version */
  version: number;
  /**Parent ID */
  is_socket: SocketType;
};

export type Create = DirectoryCreate & ModelCreate;

export type GetInfo = {
  model_id: string;
  project_id: string | undefined;
};

export type DeleteInfo = {
  model_ids: string[];
  project_id: string | undefined;
};

export type SortSchemasParams = {
  project_id: string;
  parentId: string;
  model_ids: string[];
  after_model_id: string;
  before_model_id: string;
};

export type DirectoryResponse = {
  version: number;
  socket_status: number;
  sort: number;
};

export type TYPE_DATA_KEYS = { [key in keyof IDataModel]: string };

export type BatchCloseProps = {
  /** Update source data */
  idUpdateSchemasBase: boolean;
};

export type BatchGetDetails = {
  project_id: string;
  model_ids: string[];
};

export interface SchemaObj {
  type?: string;
  properties?: any;
  $schema?: any;
  ONAPI_ORDERS?: string[];
}

export interface IDataModel {
  // Unique ID
  model_id: string;

  // Parent directory ID
  parentId: string;

  // Project ID
  project_id: string;

  // Data type: model, folder
  model_type: DATA_MODEL_TYPE;

  // Model name
  name: string;

  // Display name
  display_name: string;

  // Model description
  description: string;

  // Model data
  schema: any;

  // Sort order in left directory, higher = later, starting from 0
  sort: number;

  // Version number, backend returns latest on directory/API changes; update local indexDB; on save, code 10100 means version conflict, resolve then update local version before saving
  version: number;

  // 1=Normal -1=Deleted -99=Permanently deleted
  status: 1 | -1 | -99;

  // Last editor UUID
  updated_id: string;

  // Last modification timestamp
  updated_time: number;

  //  Created byUUID
  // created_id: string;

  // Created timestamp
  created_time: number;

  // Whether modified (1=changed, -1=modifying)
  is_changed?: 1 | -1;

  // Created at
  created_at?: string | number | Date;

  // Updated at
  updated_at?: string | number | Date;

  // Whether new (true=new, false=edit)
  isLocalCreate: boolean;

  // Creator info
  created_user_info: {
    portrait: string;
    nick_name: string;
  };

  // Modifier info
  updated_user_info: {
    portrait: string;
    nick_name: string;
  };

  // Whether conflicted
  is_conflicted: 1 | -1;

  // Whether deleted
  is_deleted: 1 | -1;

  // Whether force update
  is_force: 1 | -1;
}
