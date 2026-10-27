import styles from "./Link.module.css";
import React, { memo, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox, Input, Tree } from "@/shared/ui/base";

import { useMemoizedFn, useSafeState } from "ahooks";
import { isPlainObject, isUndefined } from "lodash-es";

import Button from "@/shared/ui/Button";
import Empty from "@/shared/ui/Empty";
import AppIcon from "@/shared/ui/AppIcon";
import Modal from "@/shared/ui/Modal";

import { useSchemaContext } from "../../context";
import { listToTree } from "../../utils/list2tree";
import useListData from "./hooks/useListData";

type Props = {
  open?: boolean;
  onLinkSchema: (modelInfo: any) => void;
  default_model_id?: string;
};

const LinkPanel: React.FC<Props> = (props) => {
  const { t } = useTranslation();
  const { open, onLinkSchema, default_model_id } = props;

  const [value, setValue] = useSafeState<any | null>(null);
  const [expandedKeys, setExpandedKeys] = useSafeState<string[]>([]);
  const [filterName, setFilterName] = useSafeState<string>("");

  const { schemaData, getModelItem, model_id }: any = useSchemaContext();

  useEffect(() => {
    const defaultValue = schemaData?.[default_model_id!];
    if (isPlainObject(defaultValue)) {
      setValue(defaultValue);
    }
  }, [schemaData, default_model_id]);

  const menuList: any[] = useMemo(() => {
    return Object.values(schemaData || {});
  }, [schemaData]);
  const { filteredTreeList } = useListData({ menuList, filterName });

  const treeData = listToTree(filteredTreeList);

  const handleConfirm = async () => {
    onLinkSchema(value);
  };

  const handleClose = () => {
    onLinkSchema(null);
  };

  const onNodeClick = useMemoizedFn(async (key: string) => {
    const nodeData = getModelItem(key);
    if (!isPlainObject(nodeData)) {
      return;
    }
    if (nodeData.model_type !== "model") {
      return;
    }
    if (nodeData?.model_id === value?.model_id) {
      setValue(null);
    } else {
      setValue(nodeData);
    }
  });

  const renderNode = (item: any) => {
    return (
      <div
        onClick={() => {
          if (item.model_type === "folder" || item.key === model_id) {
            return;
          }
          onNodeClick(item.key);
        }}
        className={styles.modelNodeItem}
      >
        <div className={styles.iconPanel}>
          {item.model_type === "model" && (
            <>
              <Checkbox
                value={item.key}
                onClick={() => {
                  onNodeClick(item.key);
                }}
                checked={
                  !isUndefined(value?.model_id) && item.key === value?.model_id
                }
                disabled={item.key === model_id}
              />
              <AppIcon className={styles.iconModel} icon="shapes" />
            </>
          )}
        </div>
        <span className={styles.nodeText}>
          {item.model_type === "folder" && (
            <AppIcon
              style={{ marginRight: 5 }}
              icon={
                expandedKeys?.includes(item?.key) ? "folder-open" : "folder"
              }
            />
          )}
          {item?.title}
        </span>
      </div>
    );
  };

  return (
    <Modal
      width={600}
      style={{ height: 410 }}
      title={t("imp_models.title")}
      open={open}
      onCancel={handleClose}
      footer={
        filteredTreeList.length === 0
          ? null
          : [
              <div className={styles.footer}>
                <Button type="primary" onClick={handleConfirm}>
                  {t("imp_models.confirm")}
                </Button>
              </div>,
            ]
      }
    >
      <div className={styles.container}>
        <Input
          value={filterName}
          onChange={(e) => {
            setFilterName(e.target.value);
          }}
          prefix={<AppIcon icon="search" />}
          placeholder={t("imp_models.search_tip")}
        />

        {filteredTreeList.length === 0 ? (
          <div className={styles.emptyList}>
            <Empty />
          </div>
        ) : (
          <Tree
            virtual
            height={360}
            showIcon={false}
            treeData={treeData}
            blockNode
            expandedKeys={expandedKeys}
            onExpand={(expandedKeys: any) => setExpandedKeys(expandedKeys)}
            className={styles.treePanel}
            titleRender={renderNode}
          ></Tree>
        )}
      </div>
    </Modal>
  );
};

export default memo(LinkPanel);
