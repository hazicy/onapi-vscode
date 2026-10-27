import { MIGRATE_RESULT_STATUS } from "@onapi/http-model/import/constants/migrate/index";
import { TeamItem } from "@onapi/http-model/auth/types/index";
import dayjs from "dayjs";
import { filter, find, get, isEmpty, last, map, size, sortBy } from "lodash";

/**
 * - Get project and team from project list by project ID
 * - If no project ID is passed, default to the first project of the first team
 * @param projectId Project ID
 */
export const getTeamAndProjectByProjectId = ({
  projectId,
  teamProjectList,
}: {
  projectId?: string;
  teamProjectList: TeamItem[];
}) => {
  if (isEmpty(teamProjectList)) {
    return;
  }
  const allProjects = filter(
    map(teamProjectList, (item) => item.project).flat(),
    (project) => project?.upgrade_status === MIGRATE_RESULT_STATUS.NORMAL,
  ); // Find all projects
  const sortProjects = sortBy(allProjects, (item) =>
    dayjs(item?.edited_at).valueOf(),
  ); // Sort by last edit time
  const lastEditProject = projectId || last(sortProjects)?.project_id; // Find the last edited one

  // Check if the project in the current route exists in the project list; if so, it belongs to the same user or team
  const currentProjectInProjectList = find(teamProjectList, (item) =>
    find(item.project, (p) => p.project_id === lastEditProject),
  );

  if (currentProjectInProjectList) {
    const team = teamProjectList?.find((item) =>
      item.project?.find((p) => p.project_id === lastEditProject),
    );

    const project = team?.project?.find(
      (item) => item.project_id === lastEditProject,
    );

    return {
      team,
      project,
    };
  }

  // Find the first team with projects or the first team
  const hasProjectFirstTeam = find(
    teamProjectList,
    (temItem) => size(temItem.project) > 0,
  );
  const team = hasProjectFirstTeam || get(teamProjectList, "[0]");
  const project = get(team, "project[0]");

  return {
    team,
    project,
  };
};
