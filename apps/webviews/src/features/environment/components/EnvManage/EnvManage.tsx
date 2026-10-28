import { saveEnvironments } from "@/features/requests/events/env";
import styles from "./EnvManage.module.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Input, message, Tooltip } from "@/shared/ui/base";

import { useUpdateEffect } from "ahooks";
import { produce } from "immer";
import { cloneDeep, find, findIndex, isNull, isUndefined } from "lodash-es";

import Table from "@/shared/components/BasicTable/BasicTable";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";

import useProjectConfig from "@/features/project/store/useProjectConfig";
import type { EnvironmentScope as EnvListItem } from "@onapi/domain";
type EnvList = EnvListItem[];

import { DEFAULT_DATA_ITEM } from "@onapi/domain/environment";
import ValueInput from "../ValueInput";

import { IEnvDataItem } from "./types";

interface EnvModifyModalProps {
  editEnvId: string | undefined;
  envMenus: EnvList;
  changeKey: React.Dispatch<string[]>;
}

const Index = (props: EnvModifyModalProps) => {
  const { t } = useTranslation();
  const { editEnvId, envMenus } = props;

  const updateHttpEnvironments = useProjectConfig(
    (state) => state.updateHttpEnvironments,
  );
  const serverList = useProjectConfig((state) => state.serverList);

  const [envData, setEnvData] = useState<Partial<EnvListItem>>({});
  const [envList, setEnvList] = useState<Array<IEnvDataItem>>([
    { ...DEFAULT_DATA_ITEM },
  ]);
  const readonly = false;

  useEffect(() => {
    const data = find(envMenus, ({ id }) => id === editEnvId) as EnvListItem;

    if (!data) {
      return;
    }

    setEnvData({ ...data });
  }, [editEnvId, envMenus]);

  useEffect(() => {
    const data = find(envMenus, ({ id }) => id === editEnvId) as EnvListItem;
    if (data) {
      const list = data.values || [];
      setEnvList(list);
    }
  }, [editEnvId, envMenus]);

  const isDefaultOrMockEnv = () => {
    return false;
  };

  const handleEnvChange = (key: string, value: string | number) => {
    const newEnv: any = cloneDeep(envData);
    const newEnvData = {
      ...newEnv,
      [key]: value,
    };
    setEnvData(newEnvData);

    // Add auto-save logic
    // onOk({envData:newEnvData});
  };

  const tableDataList = () => {
    const hasStatic = envList.some((item) => item.static);
    if (!hasStatic) {
      return [...envList, { ...DEFAULT_DATA_ITEM }];
    }
    return [...envList];
  };

  const handleItemChange = (rowData: any, index: number, newVal: any) => {
    const newList: Array<IEnvDataItem> = cloneDeep(envList);
    delete rowData.static;
    newList[index] = {
      ...rowData,
      ...newVal,
    };
    setEnvList([...newList]);

    // Add auto-save logic
    // onOk({
    //   envList:[...newList]
    // });
  };

  const handleDeleteItem = (index: number) => {
    const newList = [...envList];
    if (newList.length > 0) {
      newList.splice(index, 1);
      setEnvList([...newList]);
    }

    // Add auto-save logic
    // onOk({
    //   envList:[...newList]
    // });
  };

  const envColumn: any[] = [
    {
      title: t("global_setting.variables_table.variables"),
      width: 150,
      dataIndex: "key",
      enableResize: true,
      render: (text: any, rowData: any, rowIndex: number) => (
        <Input
          className={styles.envVarName}
          value={text}
          disabled={readonly}
          onChange={(e) => {
            handleItemChange(rowData, rowIndex, { key: e.target.value });
          }}
        />
      ),
    },
    {
      title: (
        <Flex gap={8}>
          <span>{"Value"}</span>
          <Tooltip title={t("global_setting.variables_table.local_tip")}>
            <AppIcon icon="circle-help" className={styles.icon} />
          </Tooltip>
        </Flex>
      ),
      width: 150,
      dataIndex: "value",
      enableResize: true,
      render: (text: any, rowData: any, rowIndex: number) => (
        <Flex style={{ width: "100%" }}>
          <ValueInput
            value={isNull(text) || isUndefined(text) ? "" : String(text)}
            disabled={readonly}
            onChange={(e) =>
              handleItemChange(rowData, rowIndex, {
                value: e,
              })
            }
          />
        </Flex>
      ),
    },
    {
      title: t("global_setting.variables_table.description"),
      dataIndex: "description",
      render: (text = "", rowData: any, rowIndex: number) => (
        <ValueInput
          value={String(text ?? "")}
          disabled={readonly}
          onChange={(e) =>
            handleItemChange(rowData, rowIndex, {
              description: e,
            })
          }
        />
      ),
    },
    {
      title: "",
      dataIndex: "del",
      align: "center",
      width: 50,
      render: (_text: any, _rowData: any, rowIndex: number) =>
        readonly ? (
          <></>
        ) : (
          <div className={styles.envOp}>
            <AppIcon
              onClick={() => handleDeleteItem(rowIndex)}
              icon="trash-2"
              className={styles.icon}
            />
          </div>
        ),
    },
  ];

  const onOk = (options?: any) => {
    const tempEnvData = options?.envData || envData;

    if (!tempEnvData.name?.trim()) {
      return;
    }
    try {
      const envVarList = options?.envList || envList;
      const params = {
        ...tempEnvData,
        name: tempEnvData.name?.trim(),
      } as EnvListItem;
      params.values = envVarList
        .filter((row: any) => row.key?.trim())
        .map(({ static: _, current_value: __, ...row }: any) => row);
      if (params?.isLocal) {
        delete params.isLocal;
        // Get maximum sort value
        const maxSort = envMenus.reduce(
          (max, obj) => ((obj?.sort || 0) > max ? obj?.sort || 0 : max),
          0,
        );
        const list = envMenus.map((e) => {
          if (e.id === params?.id) {
            return { ...params, sort: maxSort + 1, isLocal: undefined };
          }
          return e;
        });
        updateHttpEnvironments(list);
        // changeKey([res.id]);
        saveEnvironments(list);
        message.success("Success");
        return;
      }
      const newList = envMenus.map((e) => {
        if (e.id === params?.id) {
          return { ...params };
        }
        return e;
      });
      saveEnvironments(newList);
      message.success("Success");
      // await updateEnvRequest({ ...params, project_id: project_id || '' });
      updateEnv({ ...params }, false);
    } catch (err) {
      // err
    }
  };
  useUpdateEffect(() => {}, [serverList]);
  const updateEnv = async (envData: any, serverUpdate = true) => {
    try {
      const newEnvList = produce(envMenus, (draft) => {
        const targetIndex = findIndex(draft, (e) => e.id === editEnvId);
        draft[targetIndex] = { ...draft[targetIndex], ...envData };
      });

      if (serverUpdate) {
        // Get service list
      } else {
        updateHttpEnvironments(newEnvList);
      }
    } catch (err) {
      // err
    }
  };

  return (
    <div className={styles.envManage}>
      <Flex className={styles.envManageFlex} vertical gap={15}>
        <Flex gap={15} vertical>
          <span> {t("global_setting.environment_detail.title")}</span>
          <div className={[undefined, undefined].join(" ")}>
            <div>{t("global_setting.environment_detail.tips")}</div>
            <div>{t("global_setting.environment_detail.tips1")}</div>
            <div>{t("global_setting.environment_detail.tips2")}</div>
          </div>
        </Flex>
        <div className={styles.envManageContent}>
          <div className={styles.container}>
            {t("global_setting.environment_detail.name")}
          </div>
          <Input
            className={styles.envManageInput}
            maxLength={128}
            placeholder={t("supplement.env_input_tip")}
            disabled={isDefaultOrMockEnv()}
            value={envData.name}
            onChange={(e) => handleEnvChange("name", e.target.value)}
          />
          <div className={styles.container}>
            {t("global_setting.environment_detail.environment_variables")}
          </div>
          <div>
            <Table
              pagination={false}
              rowKey={(_, i) => `${i}`}
              dataSource={tableDataList()}
              columns={envColumn}
            />
          </div>
        </div>

        <Flex justify="flex-end">
          <Button onClick={onOk} type="primary">
            {t("global_setting.environment_detail.save")}
          </Button>
        </Flex>
      </Flex>
    </div>
  );
};

export default Index;
