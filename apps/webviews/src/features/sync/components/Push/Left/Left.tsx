import styles from "./Left.module.css";
import React, { useMemo, useState } from "react";

import { useTranslation } from "react-i18next";
import { Flex, Input, Segmented } from "@/shared/ui/base";
import { AppIcon } from "@/shared/ui";
import { PushApiData, PushEnvData } from "../type";
import ApiCheckBox from "./ApiCheckBox";
import EnvCheckBox from "./EnvCheckBox";
import useApis from "@/features/requests/store/useApis";
import useProjectConfig from "@/features/project/store/useProjectConfig";

type PushLeftProps = {
  halfCheckedKeys: Array<React.Key>;
  setHalfCheckedKeys: any;
  conflictPush: any;
  pushEnvData: Partial<PushEnvData>;
  updatePushEnvData: (key: string, val: any) => void;
  pushApiData: Partial<PushApiData>;
  updatePushApiData: (key: string, val: any) => void;
  tabValue: "apis" | "env";
  setTabValue: (val: "apis" | "env") => void;
};

const PushLeft = (props: PushLeftProps) => {
  const {
    tabValue,
    setTabValue,
    halfCheckedKeys,
    setHalfCheckedKeys,
    pushEnvData,
    updatePushEnvData,
    pushApiData,
    updatePushApiData,
  } = props;
  const { t } = useTranslation();

  const [searchValue, setSearchValue] = useState("");
  const apiOriginDetailsList = useApis((store) => store.apiOriginDetailsList);
  const envList = useProjectConfig((store) => store?.envList) || [];

  const options = useMemo(() => {
    if (
      (pushEnvData?.conflictItems?.length || 0) <= 0 &&
      (pushApiData?.conflictItems?.length || 0) > 0
    ) {
      setTabValue("apis");
      return [
        {
          label: (
            <Flex style={{ position: "relative" }}>
              {t("common.apis_and_folders")}
              {
                <span style={{ color: "#26CEA4", fontSize: 8, marginTop: -5 }}>
                  {pushApiData?.conflictItems?.length}
                </span>
              }
            </Flex>
          ),
          value: "apis",
        },
      ];
    } else if (
      (pushApiData?.conflictItems?.length || 0) <= 0 &&
      (pushEnvData?.conflictItems?.length || 0) > 0
    ) {
      setTabValue("env");
      return [
        {
          label: (
            <Flex>
              {t("supplement.environment")}
              {
                <span style={{ color: "#26CEA4", fontSize: 8, marginTop: -5 }}>
                  {pushEnvData?.conflictItems?.length}
                </span>
              }
            </Flex>
          ),
          value: "env",
        },
      ];
    } else {
      return [
        {
          label: (
            <Flex style={{ position: "relative" }}>
              {t("common.apis_and_folders")}
              {(pushApiData?.conflictItems || [])?.length > 0 ? (
                <span style={{ color: "#26CEA4", fontSize: 8, marginTop: -5 }}>
                  {pushApiData?.conflictItems?.length}
                </span>
              ) : (
                <span style={{ color: "#26CEA4", fontSize: 8, marginTop: -5 }}>
                  {apiOriginDetailsList?.length}
                </span>
              )}
            </Flex>
          ),
          value: "apis",
        },
        {
          label: (
            <Flex>
              {t("supplement.environment")}
              {(pushEnvData?.conflictItems || [])?.length > 0 ? (
                <span style={{ color: "#26CEA4", fontSize: 8, marginTop: -5 }}>
                  {pushEnvData?.conflictItems?.length}
                </span>
              ) : (
                <span style={{ color: "#26CEA4", fontSize: 8, marginTop: -5 }}>
                  {envList?.length}
                </span>
              )}
            </Flex>
          ),
          value: "env",
        },
      ];
    }
  }, [
    pushEnvData?.conflictItems?.length,
    pushApiData?.conflictItems?.length,
    apiOriginDetailsList?.length,
    envList?.length,
  ]);

  return (
    <div className={styles.container}>
      <Flex justify="space-between" align="center">
        <Segmented<string>
          value={tabValue}
          options={options}
          onChange={(value) => {
            setTabValue(value as "apis" | "env");
          }}
        />
        <Input
          prefix={<AppIcon icon="search" />}
          placeholder={t("common.search")}
          value={searchValue}
          onChange={(event) => setSearchValue(event?.target?.value || "")}
          style={{ width: 240, marginLeft: 8, fontSize: 12 }}
          affixClassName={styles.inputAffixWrapper}
        />
      </Flex>
      {tabValue === "apis" && (
        <ApiCheckBox
          searchValue={searchValue}
          halfCheckedKeys={halfCheckedKeys}
          setHalfCheckedKeys={setHalfCheckedKeys}
          pushApiData={pushApiData}
          updatePushApiData={updatePushApiData}
        />
      )}

      {tabValue === "env" && (
        <EnvCheckBox
          searchValue={searchValue}
          pushEnvData={pushEnvData}
          updatePushEnvData={updatePushEnvData}
        />
      )}
    </div>
  );
};
export default PushLeft;
