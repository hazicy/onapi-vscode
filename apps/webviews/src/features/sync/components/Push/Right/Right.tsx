import styles from "./Right.module.css";
import { useMemo } from "react";

import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Button, Flex, Select } from "@/shared/ui/base";
import useUserConfig from "@/features/auth/store/useUserConfig";
import { MIGRATE_RESULT_STATUS } from "@onapi/http-model/import/constants/migrate/index";
import { getTeamAndProjectByProjectId } from "@/features/project/events";
import ApiConflict from "./ApiConflict";
import { PushApiData, PushEnvData } from "../type";
import { isArray } from "lodash-es";
import EnvConflict from "./EnvConflict";

type PushRightProps = {
  handlePush: any;
  handleFix: any;
  pushApiData: Partial<PushApiData>;
  updatePushApiData: (key: string, val: any) => void;
  pushEnvData: Partial<PushEnvData>;
  updatePushEnvData: (key: string, val: any) => void;
  tabValue: "apis" | "env";
  handlePushCancel: () => void;
};

const PushRight = (props: PushRightProps) => {
  const {
    tabValue,
    handlePush,
    handleFix,
    pushApiData,
    updatePushApiData,
    pushEnvData,
    updatePushEnvData,
    handlePushCancel,
  } = props;
  const { t } = useTranslation();

  const teamProjectList = useUserConfig((stroe) => stroe.teamProjectList);
  const { currentProject, updateCurrentTeam, updateCurrentProject } =
    useUserConfig(
      useShallow(
        ({ currentProject, updateCurrentTeam, updateCurrentProject }) => {
          return {
            currentProject,
            updateCurrentTeam,
            updateCurrentProject,
          };
        },
      ),
    );

  const onProjectChange = (project_id: string) => {
    const { team, project } =
      getTeamAndProjectByProjectId({
        projectId: project_id,
        teamProjectList,
      }) || {};
    if (team && project) {
      // Switch to selected target project
      updateCurrentTeam(team);
      updateCurrentProject(project);
    }
  };

  const dynamicStyle = useMemo(() => {
    if (
      (isArray(pushApiData?.conflictItems) &&
        pushApiData.conflictItems.length > 0) ||
      (isArray(pushEnvData?.conflictItems) &&
        pushEnvData.conflictItems.length > 0)
    ) {
      return {
        marginTop: "129px",
        backgroundColor: "transparent",
        paddingTop: "0",
      };
    }
    return {};
  }, [pushApiData?.conflictItems, pushEnvData?.conflictItems]);

  const renderConfictItems = () => {
    if (
      tabValue === "apis" &&
      isArray(pushApiData?.conflictItems) &&
      pushApiData.conflictItems.length > 0
    ) {
      return (
        <ApiConflict
          handleFix={handleFix}
          pushApiData={pushApiData}
          updatePushApiData={updatePushApiData}
          handlePushCancel={handlePushCancel}
        />
      );
    }
    if (
      tabValue === "env" &&
      isArray(pushEnvData?.conflictItems) &&
      pushEnvData.conflictItems.length > 0
    ) {
      return (
        <EnvConflict
          handlePushCancel={handlePushCancel}
          pushEnvData={pushEnvData}
          updatePushEnvData={updatePushEnvData}
          handleFix={handleFix}
        />
      );
    }
    return (
      <>
        <label>{t("common.push_target_address")}</label>
        <Select
          aria-label={t("common.push_target_address")}
          placeholder={t("common.select_tip")}
          showSearch
          style={{ width: "100%" }}
          value={
            currentProject?.project_id === "-1"
              ? undefined
              : currentProject?.project_id
          }
          options={teamProjectList.flatMap((team) =>
            (team.project || []).map((project) => ({
              value: project.project_id,
              label: `${team.name} / ${project.name}`,
              disabled: project.upgrade_status !== MIGRATE_RESULT_STATUS.NORMAL,
            })),
          )}
          onChange={onProjectChange}
        />

        <Flex justify="end">
          <Button type="primary" onClick={handlePush}>
            {`${t("common.push")}(${(pushApiData?.checkedKeys?.length || 0) + (pushEnvData?.checkedKeys?.length || 0)} ${t("common.selected")})`}
          </Button>
        </Flex>
      </>
    );
  };

  const renderTitle = () => {
    if (
      tabValue === "apis" &&
      isArray(pushApiData?.conflictItems) &&
      pushApiData.conflictItems.length > 0
    ) {
      return t("common.api_folder_conflict_handling");
    } else if (
      tabValue === "env" &&
      isArray(pushEnvData?.conflictItems) &&
      pushEnvData.conflictItems.length > 0
    ) {
      return t("common.env_conflict_handling");
    } else {
      return t("common.push_to_onapi");
    }
  };

  return (
    <div style={dynamicStyle} className={styles.container}>
      <div className={styles.title}>{renderTitle()}</div>
      {renderConfictItems()}
    </div>
  );
};
export default PushRight;
