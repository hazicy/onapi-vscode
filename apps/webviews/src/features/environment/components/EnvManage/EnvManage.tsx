import { saveEnvironments } from "@/features/requests/events/env";
import styles from "./EnvManage.module.css";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Input, message, Tooltip } from "@/shared/ui/base";

import { cloneDeep, find, isNull, isUndefined } from "lodash-es";

import Table from "@/shared/components/BasicTable/BasicTable";
import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";

import type { EnvironmentScope as EnvListItem } from "@onapi/domain";
type EnvList = EnvListItem[];

import { DEFAULT_DATA_ITEM } from "@onapi/domain/environment";
import ValueInput from "../ValueInput";

import { IEnvDataItem } from "./types";

interface EnvModifyModalProps {
  editEnvId: string | undefined;
  envMenus: EnvList;
}

const Index = (props: EnvModifyModalProps) => {
  const { t } = useTranslation();
  const { editEnvId, envMenus } = props;

  const [envData, setEnvData] = useState<Partial<EnvListItem>>({});
  const [envList, setEnvList] = useState<Array<IEnvDataItem>>([
    { ...DEFAULT_DATA_ITEM },
  ]);
  const readonly = false;

  const dirty = useRef(false);
  const editingId = useRef<string | undefined>(undefined);
  useEffect(() => {
    const data = find(envMenus, ({ id }) => id === editEnvId);
    if (!data || (editingId.current === editEnvId && dirty.current)) {
      return;
    }
    editingId.current = editEnvId;
    dirty.current = false;
    setEnvData({ ...data });
    setEnvList(cloneDeep(data.values || []));
  }, [editEnvId, envMenus]);

  const handleEnvChange = (key: string, value: string | number) => {
    dirty.current = true;
    const newEnv: any = cloneDeep(envData);
    const newEnvData = {
      ...newEnv,
      [key]: value,
    };
    setEnvData(newEnvData);
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
    dirty.current = true;
    const { static: _static, ...editableRow } = rowData;
    newList[index] = {
      ...editableRow,
      ...newVal,
    };
    setEnvList([...newList]);
  };

  const handleDeleteItem = (index: number) => {
    dirty.current = true;
    const newList = [...envList];
    if (newList.length > 0) {
      newList.splice(index, 1);
      setEnvList([...newList]);
    }
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

  const onOk = () => {
    const tempEnvData = envData;

    if (!tempEnvData.name?.trim()) {
      return;
    }
    try {
      const envVarList = envList;
      const params = {
        ...tempEnvData,
        name: tempEnvData.name?.trim(),
      } as EnvListItem;
      params.values = envVarList
        .filter((row: any) => row.key?.trim())
        .map(({ static: _, current_value: __, ...row }: any) => row);
      dirty.current = false;
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
        saveEnvironments(list);
        message.success(t("interaction.environmentSaved"));
        return;
      }
      const newList = envMenus.map((e) => {
        if (e.id === params?.id) {
          return { ...params };
        }
        return e;
      });
      saveEnvironments(newList);
      message.success(t("interaction.environmentSaved"));
    } catch (err) {
      // err
    }
  };

  return (
    <div className={styles.envManage}>
      <Flex className={styles.envManageFlex} vertical gap={15}>
        <Flex gap={15} vertical>
          <span> {t("global_setting.environment_detail.title")}</span>
          <div>
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
            value={envData.name || ""}
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
