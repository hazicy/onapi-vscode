/** Persisted identifiers also determine request, environment and report paths. */
export type Workspace = {
  project_id: string;
  team_id: string;
  name: string;
  intro: string;
};

export type WorkspaceGroup = {
  team_id: string;
  name: string;
  project: Workspace[] | null;
};
