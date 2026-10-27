import styles from "./Push.module.css";
import React, { useState } from "react";

import { Flex, message, Spin, Typography } from "@/shared/ui/base";
import { useTranslation } from "react-i18next";
import { useShallow } from "zustand/react/shallow";
import { Modal } from "@/shared/ui/Modal";
import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import useUserConfig from "@/features/auth/store/useUserConfig";

import {
  batchSaveApiService,
  getApisListService,
} from "@/shared/services/apis";
import { cloneDeep, forEach, isArray, isPlainObject } from "lodash-es";
import Left from "./Left/Left";
import Right from "./Right/Right";
import {
  completeServiceList,
  getEnvConflictList,
} from "@/features/sync/utils/push";
import { resolveEnvironmentConflicts } from "@/features/sync/utils/environmentDiff";
import { findApiConflicts } from "@onapi/domain/sync/utils/api-versions";
import { PushApiData, PushEnvData } from "./type";
import { produce } from "immer";
import {
  addProjectEnvService,
  addProjectEnvSeverService,
  updateProjectEnvService,
  updateProjectEnvSeverService,
} from "@/shared/services/project";

const Push = () => {
  const { t } = useTranslation();

  const [halfCheckedKeys, setHalfCheckedKeys] = useState<React.Key[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [conflictType, setConflictType] = useState<string>("manual");
  const envList = useProjectConfig((store) => store?.envList) || [];
  const [tabValue, setTabValue] = useState<"apis" | "env">("apis");
  const [modal, contextHolder] = Modal.useModal();
  const [pushEnvData, setPushEnvData] = useState<Partial<PushEnvData>>({
    checkedKeys: [],
    conflictType: "mergeCloud",
    conflictItems: [],
    conflictCheckedKeys: [],
    addEnvs: [],
    uploadItems: [],
    newServiceList: [],
    cloudServiceList: [],
  });

  const [pushApiData, setPushApiData] = useState<Partial<PushApiData>>({
    checkedKeys: [],
    conflictType: "local",
    conflictItems: [],
    conflictCheckedKeys: [],
  });

  const apiOriginDetailsList = useApis((store) => store.apiOriginDetailsList);

  const localProjectApisVersion = useApis(
    (store) => store.localProjectApisVersion,
  );
  const { currentProject } = useUserConfig(
    useShallow(({ currentProject }) => {
      return {
        currentProject,
      };
    }),
  );

  const serverList = useProjectConfig((store) => store.serverList);

  const updatePushApiData = (key: any, value?: any) => {
    let newPushApiData = produce(pushApiData, (draft: any) => {
      if (isPlainObject(key)) {
        Object.keys(key).forEach((k) => {
          draft[k] = key[k];
        });
      } else {
        draft[key] = value;
      }
    });
    setPushApiData(newPushApiData);
  };

  const updatePushEnvData = (key: any, value?: any) => {
    let newPushEnvData = produce(pushEnvData, (draft: any) => {
      if (isPlainObject(key)) {
        Object.keys(key).forEach((k) => {
          draft[k] = key[k];
        });
      } else {
        draft[key] = value;
      }
    });
    setPushEnvData(newPushEnvData);
  };

  const completePush = (
    uploaded: Array<{ id: string; version: number }> = [],
    selectedIds?: Set<string>,
  ) => {
    window?.vscode.postMessage({
      action: "completePush",
      data: {
        project_id: currentProject.project_id,
        versions: uploaded
          .filter((item) => !selectedIds || selectedIds.has(item.id))
          .map(({ id, version }) => ({ id, version })),
      },
    });
  };

  const handlePush = async () => {
    if (!currentProject?.project_id || currentProject?.project_id === "-1") {
      message.error(t("common.choose_target_tip"));
      return;
    }

    let checkedKeys = pushApiData?.checkedKeys || [];

    let envCheckedKeys = pushEnvData?.checkedKeys || [];

    if (checkedKeys.length <= 0 && envCheckedKeys.length <= 0) {
      message.error(t("common.least_one_item_tip"));
      return;
    }
    const localApiList = cloneDeep(apiOriginDetailsList);
    let checkedItems = localApiList.filter((i) =>
      checkedKeys.concat(halfCheckedKeys).includes(i?.id),
    );

    // Handle environment and service conflicts (get conflicting environment list)
    let envConflictList: Awaited<ReturnType<typeof getEnvConflictList>>;
    let cloudList: Awaited<ReturnType<typeof getApisListService>>["list"];
    try {
      envConflictList = await getEnvConflictList(
        pushEnvData?.checkedKeys || [],
        currentProject.project_id,
      );
      const response = await getApisListService({
        project_id: currentProject.project_id,
      });
      if (!isArray(response?.list)) {
        throw new Error("Unable to load API versions for conflict checking.");
      }
      cloudList = response.list;
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error));
      return;
    }

    const localApisVersion =
      localProjectApisVersion?.[currentProject.project_id] || {};
    const conflictList = findApiConflicts(
      checkedItems,
      cloudList,
      localApisVersion,
    );
    const conflictIdList = conflictList.map((item) => item.id);
    // API or environment has conflict, proceed to conflict resolution step
    if (conflictList.length > 0 || envConflictList.diffEnvs.length > 0) {
      if (conflictType === "manual") {
        updatePushApiData({
          conflictItems: conflictList,
          conflictCheckedKeys: conflictList.map((i: any) => i?.id),
        });
        updatePushEnvData({
          conflictItems: envConflictList.diffEnvs,
          addEnvs: envConflictList?.addEnvs || [],
          newServiceList: envConflictList?.newServiceList || [],
          conflictCheckedKeys: envConflictList.diffEnvs.map(
            (i) => i?.localEnv?.env_id,
          ),
          cloudServiceList: envConflictList?.cloudServiceList || [],
        });
        return;
      } else if (conflictType === "local") {
        // Use local data to resolve conflicts directly
      } else if (conflictType === "cloud") {
        // Filter out conflicting items, do not submit to cloud
        checkedItems = checkedItems.filter(
          (i) => !conflictIdList.includes(i?.id),
        );
      }
    }

    setSpinning(true);
    // Update project ID before upload
    forEach(checkedItems, (item) => {
      item.project_id = currentProject.project_id;
    });
    try {
      // Upload environments without conflicts
      if (
        isArray(envConflictList?.addEnvs) &&
        envConflictList.addEnvs.length > 0
      ) {
        // Before uploading environments, upload necessary services from the service list first
        for (
          let index = 0;
          index < envConflictList.newServiceList.length;
          index++
        ) {
          const newService = envConflictList.newServiceList[index];
          if (newService?.mode === "add") {
            await addProjectEnvSeverService({
              ...newService,
              project_id: currentProject.project_id,
            });
          } else if (newService?.mode === "update") {
            await updateProjectEnvSeverService({
              ...newService,
              project_id: currentProject.project_id,
            });
          }
        }

        for (let index = 0; index < envConflictList.addEnvs.length; index++) {
          const localEnv = envConflictList.addEnvs[index];
          // Complete service list
          completeServiceList(localEnv, envConflictList.newServiceList);
          await addProjectEnvService({
            ...localEnv,
            project_id: currentProject.project_id,
          });
        }
      }

      if (checkedItems.length <= 0) {
        // Close upload page and show success message
        completePush();
        return;
      }

      // Upload APIs without conflicts
      const result = await batchSaveApiService({
        project_id: currentProject.project_id,
        apis: checkedItems,
      });
      if (!isArray(result?.list)) {
        throw new Error("The upload response did not contain API versions.");
      }
      completePush(result.list, new Set(checkedItems.map((item) => item.id)));
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSpinning(false);
    }
  };
  const conflictPush = async (keys?: React.Key[], uploadItem?: any[]) => {
    let checkedKeys = (pushApiData?.checkedKeys || []).concat(halfCheckedKeys);

    setSpinning(true);
    try {
      //#region Upload environments start
      // Before uploading environments, upload necessary services from the service list first
      if (
        isArray(pushEnvData?.newServiceList) &&
        pushEnvData.newServiceList.length > 0
      ) {
        for (
          let index = 0;
          index < pushEnvData.newServiceList.length;
          index++
        ) {
          const newService = pushEnvData.newServiceList[index];
          if (newService?.mode === "add") {
            await addProjectEnvSeverService({
              ...newService,
              project_id: currentProject.project_id,
            });
          } else if (newService?.mode === "update") {
            await updateProjectEnvSeverService({
              ...newService,
              project_id: currentProject.project_id,
            });
          }
        }
      }

      // Upload new environments
      if (isArray(pushEnvData?.addEnvs) && pushEnvData.addEnvs.length > 0) {
        for (let index = 0; index < pushEnvData.addEnvs.length; index++) {
          const localEnv = pushEnvData.addEnvs[index];
          // Complete service list
          completeServiceList(localEnv, pushEnvData?.newServiceList || []);
          await addProjectEnvService({
            ...localEnv,
            project_id: currentProject.project_id,
          });
        }
      }

      // Upload modified environments
      let uploadArrs = pushEnvData?.uploadItems;
      if (isArray(uploadItem)) {
        uploadArrs = uploadItem;
      }
      if (isArray(uploadArrs) && uploadArrs.length > 0) {
        for (let index = 0; index < uploadArrs.length; index++) {
          const localEnv = uploadArrs[index];
          // Complete service list
          completeServiceList(localEnv, pushEnvData?.newServiceList || []);
          await updateProjectEnvService({
            ...localEnv,
            project_id: currentProject.project_id,
          });
        }
      }
      //#endregion Upload environments end

      //#region Upload APIs start
      const localApiList = cloneDeep(apiOriginDetailsList);
      const checkedItems = localApiList.filter((i) => {
        if (keys) {
          return keys.includes(i?.id);
        } else {
          return checkedKeys.includes(i?.id);
        }
      });
      // Update project ID before upload
      forEach(checkedItems, (item) => {
        item.project_id = currentProject.project_id;
      });
      if (checkedItems.length <= 0) {
        // Close upload page and show success message
        completePush();
        return;
      }
      const result = await batchSaveApiService({
        project_id: currentProject.project_id,
        apis: checkedItems,
      });

      if (!isArray(result?.list)) {
        throw new Error("The upload response did not contain API versions.");
      }
      completePush(result.list, new Set(checkedItems.map((item) => item.id)));
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error));
    } finally {
      setSpinning(false);
    }
  };

  const handleFix = async () => {
    try {
      let envConflictItems = pushEnvData?.conflictItems || [];
      let conflictItems = pushApiData?.conflictItems || [];
      if (tabValue === "apis") {
        const checkedKeys = [
          ...new Set((pushApiData?.checkedKeys || []).concat(halfCheckedKeys)),
        ];
        const mode = pushApiData?.conflictType;
        const conflictCheckedKeys = new Set(
          pushApiData?.conflictCheckedKeys || [],
        );
        if (!mode) {
          message.error(t("common.select_conflict_mode_tip"));
          return;
        }
        if (conflictCheckedKeys.size === 0) {
          message.error(t("common.least_one_item_tip"));
          return;
        }
        const remaining = conflictItems.filter(
          (item) => !conflictCheckedKeys.has(item.id),
        );
        const uploadKeys =
          mode === "cloud"
            ? checkedKeys.filter((key) => !conflictCheckedKeys.has(key))
            : checkedKeys;
        updatePushApiData({
          conflictItems: remaining,
          checkedKeys: uploadKeys,
          conflictCheckedKeys: [],
        });
        if (remaining.length === 0) {
          if (envConflictItems.length === 0) {
            await conflictPush(uploadKeys);
          } else {
            setTabValue("env");
          }
        }
        return;
      }
      if (tabValue === "env") {
        const conflictCheckedKeys = pushEnvData?.conflictCheckedKeys || [];
        const mode = pushEnvData?.conflictType;
        if (!mode) {
          message.error(t("common.select_conflict_mode_tip"));
          return;
        }
        if (conflictCheckedKeys.length === 0) {
          message.error(t("common.least_one_item_tip"));
          return;
        }
        const newServiceList = pushEnvData?.newServiceList || [];
        if (mode === "local") {
          // Check for service changes before conflict resolution, show modal if changed
          if (newServiceList.length !== serverList.length) {
            const res = await modal?.confirm({
              title: "Push Confirmation",
              content: (
                <Flex vertical gap={20}>
                  <Flex
                    gap={8}
                    vertical
                    style={{
                      padding: 12,
                      background: "var(--color-bg-page)",
                    }}
                  >
                    <Typography.Text
                      style={{ color: "var(--font-content-color)" }}
                    >
                      After selecting "Use Local Data", the system will
                      automatically add any missing cloud services to ensure
                      everything functions properly.
                    </Typography.Text>
                  </Flex>
                  <span>Do you want to continue?</span>
                </Flex>
              ),
              width: 800,
              okText: "Continue",
              cancelText: "Cancel",
            });
            if (!res) {
              return;
            }
          }
        }
        const resolved = resolveEnvironmentConflicts(
          envConflictItems,
          conflictCheckedKeys.map(String),
          mode,
          newServiceList,
          pushEnvData?.uploadItems || [],
        );
        updatePushEnvData({ ...resolved, conflictCheckedKeys: [] });
        if (resolved.conflictItems.length === 0) {
          if (conflictItems.length === 0) {
            await conflictPush(
              pushApiData?.checkedKeys || [],
              resolved.uploadItems,
            );
          } else {
            setTabValue("apis");
          }
        }
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : String(error));
    }
  };

  const handlePushCancel = () => {
    updatePushApiData({
      conflictItems: [],
      conflictCheckedKeys: [],
    });
    updatePushEnvData({
      conflictItems: [],
      conflictCheckedKeys: [],
      newServiceList: [],
      cloudServiceList: [],
      addEnvs: [],
      uploadItems: [],
    });
    message.error(t("common.push_faied"));
  };

  const result = {
    conflictType,
    setConflictType,
    handlePush,
    halfCheckedKeys,
    setHalfCheckedKeys,
    conflictPush,
    handleFix,
    pushEnvData,
    updatePushEnvData,
    pushApiData,
    updatePushApiData,
    tabValue,
    setTabValue,
    handlePushCancel,
  };

  return (
    <Spin tip={t("common.loading")} spinning={spinning}>
      <div className={styles.container}>
        <Left {...result} />
        <Right {...result} />
      </div>
      {contextHolder}
    </Spin>
  );
};
export default Push;
