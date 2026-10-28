export type DATA_MODEL_TYPE = "model" | "folder";

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
