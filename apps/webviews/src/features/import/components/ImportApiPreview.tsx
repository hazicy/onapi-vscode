import type { ImportOptions } from "./ImportContent/options";
import styles2 from "./ImportApiPreview.module.css";
import { Modal } from "@/shared/ui/base";
import { Alert, Spin } from "@/shared/ui/base";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  Checkbox,
  CheckboxProps,
  Flex,
  Select,
  Tabs,
  TreeSelect,
  Typography,
} from "@/shared/ui/base";

import { filter, isArray } from "lodash-es";

import { BasicTable } from "@/shared/components";
import Tree from "@/features/collections/components/Tree/Tree";

import { Button, Empty, Tooltip } from "@/shared/ui";
import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";
import useFolders from "@/features/collections/hooks/useFolders";
import {
  APIPOST_FULL_ENV_OPTIONS,
  EXPORT_PREVIEW_CONFIG_ITEMS,
  ExportConfigEnum,
  IMPORT_TYPE_ENUM,
  ImportLocationEnum,
  SWAGGER_FULL_MODAL_OPTIONS,
} from "@onapi/domain/settings/constants/settings";
import { ApiDetailsData } from "@onapi/domain/requests/types/api";
import { EnvList } from "@onapi/domain/environment/types/index";
import { IDataModel } from "@/features/schemas/types";
import { arrayToTreeObject } from "@/shared/utils/common";

interface Props {
  options: ImportOptions;
  onOptionsChange: (options: ImportOptions) => void;
  open: boolean;
  onCancel: () => void;
  loading: boolean;
  error?: string;
  data: {
    apis: ApiDetailsData[];
    models: IDataModel[];
    envs: EnvList;
  };
  onProjectImport: any;
  importLocation: ImportLocationEnum;
  fileType: IMPORT_TYPE_ENUM;
  previewSelectData: {
    apis: string[];
    models: string[];
    envs: string[];
  };
  setPreviewSelectData: any;
}

const Index = ({
  options,
  onOptionsChange,
  open,
  onCancel,
  data,
  loading,
  error,
  onProjectImport,
  importLocation,
  fileType,
  previewSelectData,
  setPreviewSelectData,
}: Props) => {
  const { t } = useTranslation();
  const { apisFolders } = useFolders();
  const apiCheckedKeys = useMemo(() => {
    return previewSelectData?.apis || [];
  }, [previewSelectData]);

  const setApiCheckedKeys = (apis: string[], e?: any) => {
    setPreviewSelectData({
      ...previewSelectData,
      apis,
      apiHalfs: isArray(e?.halfCheckedKeys) ? e?.halfCheckedKeys : [],
    });
  };

  const modelCheckedKeys = useMemo(() => {
    return previewSelectData?.models || [];
  }, [previewSelectData]);

  const setModelCheckedKeys = (models: string[], e?: any) => {
    setPreviewSelectData({
      ...previewSelectData,
      models,
      modelHalfs: isArray(e?.halfCheckedKeys) ? e?.halfCheckedKeys : [],
    });
  };

  const columns = useMemo(() => {
    return [
      {
        title: t("global_setting.environment_detail.name"),
        width: "48%",
        ellipsis: true,
        dataIndex: "name",
        render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
      },
      {
        title: t("global_setting.environment_detail.url"),
        width: "50%",
        ellipsis: true,
        dataIndex: "url",
        render: (text: string) => <Tooltip title={text}>{text}</Tooltip>,
      },
    ];
  }, []);
  const onCheckAllChange: CheckboxProps["onChange"] = (e) => {
    if (e.target.checked) {
      setApiCheckedKeys(data?.apis?.map((i) => i.id));
    } else {
      setApiCheckedKeys([]);
    }
  };

  const onModelCheckAllChange: CheckboxProps["onChange"] = (e) => {
    if (e.target.checked) {
      setModelCheckedKeys(data?.models?.map((i) => i.model_id));
    } else {
      setModelCheckedKeys([]);
    }
  };
  const onEnvCheckAllChange: CheckboxProps["onChange"] = (e) => {
    if (e.target.checked) {
      setPreviewSelectData({
        ...previewSelectData,
        envs: data?.envs?.map((i) => i.env_id),
      });
    } else {
      setPreviewSelectData({ ...previewSelectData, envs: [] });
    }
  };

  const rowSelectionChange = (_selectedRowKeys: string[]) => {
    setPreviewSelectData({ ...previewSelectData, envs: _selectedRowKeys });
  };

  const items = useMemo(() => {
    const dataSource = data?.envs?.map((item) => {
      return {
        name: item.name,
        env_id: item.env_id,
        url: "",
        children: item.server_list?.map((serverItem) => {
          return {
            name: serverItem.name,
            url: serverItem.uri,
          };
        }),
      };
    });

    const children = (key: ExportConfigEnum) => {
      if (key === ExportConfigEnum.request) {
        return data?.apis?.length ? (
          <Flex gap={12}>
            <Flex vertical flex={1}>
              <Checkbox
                indeterminate={
                  apiCheckedKeys.length > 0 &&
                  apiCheckedKeys.length < data?.apis?.length
                }
                onChange={onCheckAllChange}
                checked={apiCheckedKeys.length >= data?.apis?.length}
                style={{ marginBottom: "10px" }}
              >
                <span style={{ minWidth: "max-content" }}>
                  {t("api.case.select_all")}
                </span>
              </Checkbox>
              <Tree
                checkable
                onCheck={(checkedKeys, e) =>
                  setApiCheckedKeys(
                    (Array.isArray(checkedKeys)
                      ? checkedKeys
                      : checkedKeys.checked
                    ).map(String),
                    e,
                  )
                }
                checkedKeys={apiCheckedKeys}
                height={410}
                className={styles2.previewTree}
                treeData={arrayToTreeObject(data?.apis)}
                defaultExpandAll
                selectable={false}
                fieldNames={{
                  title: "name",
                  children: "children",
                  key: "id",
                  type: "kind",
                }}
              />
            </Flex>
            {importLocation === ImportLocationEnum.append && (
              <Flex
                style={{
                  width: "300px",
                  height: "450px",
                  padding: "12px",
                  background: "var(--color-bg-page)",
                  borderRadius: "4px",
                }}
                className={styles2.importProjectAppendConfig}
                gap={16}
                vertical
              >
                <Flex vertical gap={8}>
                  <span>{t("supplement.select_folder")}</span>

                  <TreeSelect
                    value={options.chooseFolder}
                    onChange={(value: string) =>
                      onOptionsChange({ ...options, chooseFolder: value })
                    }
                    showSearch
                    filterTreeNode={(input, treeNode) => {
                      return treeNode?.name?.includes(input);
                    }}
                    treeDefaultExpandAll
                    placeholder={t("supplement.select_folder_tip")}
                    style={{ width: "100%" }}
                    fieldNames={{
                      label: "name",
                      value: "id",
                      children: "children",
                    }}
                    dropdownStyle={{ maxHeight: 400, overflow: "auto" }}
                    treeData={apisFolders}
                  />
                </Flex>
              </Flex>
            )}
          </Flex>
        ) : (
          <Empty style={{ minHeight: 400 }} />
        );
      }
      if (key === ExportConfigEnum.model) {
        return data?.models?.length ? (
          <Flex gap={12}>
            <Flex vertical flex={1}>
              <Checkbox
                indeterminate={
                  modelCheckedKeys.length > 0 &&
                  modelCheckedKeys.length < data?.models?.length
                }
                onChange={onModelCheckAllChange}
                checked={modelCheckedKeys.length >= data?.models?.length}
                style={{ marginBottom: "10px" }}
              >
                <span style={{ minWidth: "max-content" }}>
                  {t("api.case.select_all")}
                </span>
              </Checkbox>
              <Tree
                checkable
                onCheck={(selectedKeys, e) => {
                  const keys = (
                    Array.isArray(selectedKeys)
                      ? selectedKeys
                      : selectedKeys.checked
                  ).map(String);
                  setModelCheckedKeys(keys, e);
                }}
                checkedKeys={modelCheckedKeys}
                height={460}
                className={styles2.previewTree}
                treeData={arrayToTreeObject(data?.models, "model_id")}
                defaultExpandAll
                selectable={false}
                titleRender={(nodeData: any) => {
                  return (
                    nodeData.title.props?.display_name ||
                    nodeData.title.props?.name
                  );
                }}
                fieldNames={{
                  children: "children",
                  key: "model_id",
                  type: "model_type",
                }}
              />
            </Flex>
            {importLocation === ImportLocationEnum.append && (
              <Flex
                style={{
                  width: "300px",
                  height: "450px",
                  padding: "12px",
                  background: "var(--color-bg-page)",
                  borderRadius: "4px",
                }}
                className={styles2.importProjectAppendConfig}
                gap={16}
                vertical
              >
                <span>{t("supplement.overwrite_mode")}</span>

                <Select
                  style={{ width: "100%" }}
                  placeholder={t("common.select_tip")}
                  options={SWAGGER_FULL_MODAL_OPTIONS}
                  value={options.model_cover_modal}
                  onChange={(value: string) =>
                    onOptionsChange({ ...options, model_cover_modal: value })
                  }
                  triggerClassName={styles2.selectTrigger}
                  outlinedClassName={styles2.selectOutlined}
                />

                <span className={styles2.importProjectFullTip}>
                  {t("supplement.same_model_name")}
                </span>
              </Flex>
            )}
          </Flex>
        ) : (
          <Empty style={{ minHeight: 400 }} />
        );
      }
      if (key === ExportConfigEnum.env) {
        return (
          <Flex gap={12}>
            <Flex vertical flex={1}>
              <Checkbox
                indeterminate={
                  previewSelectData.envs.length > 0 &&
                  previewSelectData.envs.length < data?.envs?.length
                }
                onChange={onEnvCheckAllChange}
                checked={previewSelectData.envs.length >= data?.envs?.length}
                style={{ marginBottom: "10px" }}
              >
                <span style={{ minWidth: "max-content" }}>
                  {t("api.case.select_all")}
                </span>
              </Checkbox>
              <BasicTable
                scroll={{ y: 500 }}
                showHeader={false}
                rowKey="env_id"
                dataSource={dataSource}
                columns={columns}
                pagination={false}
                rowSelection={{
                  selectedRowKeys: previewSelectData.envs,
                  onChange: rowSelectionChange,
                  renderCell(_, record: any, __, node: React.ReactNode) {
                    if (!record?.env_id) {
                      return null;
                    }
                    return node;
                  },
                }}
              />
            </Flex>
            {importLocation === ImportLocationEnum.append &&
              fileType === IMPORT_TYPE_ENUM.ONAPI && (
                <Flex
                  style={{
                    width: "300px",
                    height: "450px",
                    padding: "12px",
                    background: "var(--color-bg-page)",
                    borderRadius: "4px",
                  }}
                  className={styles2.importProjectAppendConfig}
                  gap={16}
                  vertical
                >
                  <span>{t("supplement.overwrite_mode")}</span>

                  <Select
                    style={{ width: "100%" }}
                    placeholder={t("common.select_tip")}
                    options={APIPOST_FULL_ENV_OPTIONS}
                    value={options.env_cover_modal}
                    onChange={(value: string) =>
                      onOptionsChange({ ...options, env_cover_modal: value })
                    }
                    triggerClassName={styles2.selectTrigger}
                    outlinedClassName={styles2.selectOutlined}
                  />
                </Flex>
              )}
          </Flex>
        );
      }
      return "";
    };

    const getLength = (key: ExportConfigEnum) => {
      if (key === ExportConfigEnum.request) {
        const apis = filter(
          data?.apis,
          (item: ApiDetailsData) =>
            item.kind !== APIS_TARGET_TYPE_ENUM.FOLDER &&
            item.kind !== APIS_TARGET_TYPE_ENUM.SOCKET,
        );
        const selectApis = filter(
          data?.apis,
          (item: ApiDetailsData) =>
            item.kind !== APIS_TARGET_TYPE_ENUM.FOLDER &&
            item.kind !== APIS_TARGET_TYPE_ENUM.SOCKET &&
            previewSelectData.apis.includes(item?.id),
        );
        return apis?.length ? `${selectApis.length}/${apis.length}` : 0;
      }
      if (key === ExportConfigEnum.model) {
        const models = filter(
          data?.models,
          (item) => item?.model_type !== APIS_TARGET_TYPE_ENUM.FOLDER,
        );
        const selectModels = filter(
          data?.models,
          (item) =>
            item?.model_type !== APIS_TARGET_TYPE_ENUM.FOLDER &&
            previewSelectData.models.includes(item?.model_id),
        );
        return models?.length ? `${selectModels.length}/${models.length}` : 0;
      }
      if (key === ExportConfigEnum.env) {
        const selectEnvs = previewSelectData.envs;
        return data?.envs?.length
          ? `${selectEnvs.length}/${data?.envs.length}`
          : 0;
      }
      return 0;
    };

    return EXPORT_PREVIEW_CONFIG_ITEMS.map(({ key, label }) => {
      return {
        label: (
          <Flex>
            <span>{label}</span>
            <span>({getLength(key)})</span>
          </Flex>
        ),
        key,
        children: children(key),
      };
    });
  }, [data, previewSelectData, apisFolders]);

  return (
    <Modal
      width="80%"
      destroyOnClose
      title={t("common.api_tab.preview")}
      onCancel={onCancel}
      closable={!loading}
      keyboard={!loading}
      styles={{
        body: {
          minHeight: 505,
        },
      }}
      footer={
        <Flex justify="space-between" align="center">
          <Typography.Text style={{ color: "var(--font-light-color)" }}>
            {t("common.import_modal.import_tip")}
          </Typography.Text>
          <Button
            loading={loading}
            aria-label={t(
              loading
                ? "interaction.importing"
                : "settings.synchronize.import_now_tip_confirm",
            )}
            aria-busy={loading}
            onClick={() => onProjectImport()}
            type="primary"
          >
            {t(
              loading
                ? "interaction.importing"
                : "settings.synchronize.import_now_tip_confirm",
            )}
          </Button>
        </Flex>
      }
      open={open}
      className={styles2.container}
    >
      {error && (
        <Alert
          type="error"
          message={t("interaction.importFailed")}
          description={error}
        />
      )}
      <Spin spinning={loading} tip={t("interaction.importing")}>
        <Tabs items={items} />
      </Spin>
    </Modal>
  );
};

export default Index;
