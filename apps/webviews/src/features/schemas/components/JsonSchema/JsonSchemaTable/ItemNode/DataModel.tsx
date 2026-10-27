import styles from "./DataModel.module.css";
import React, { useEffect, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { useMemoizedFn, useSafeState } from "ahooks";
import cn from "classnames";
import { produce } from "immer";
import {
  assign,
  has,
  isArray,
  isEmpty,
  isPlainObject,
  isString,
  values,
} from "lodash-es";

import ItemNode from "./ItemNode";
import { useSchemaContext } from "../context";
import LinkModal from "../modals/Link/Link";
import ObjectList from "../NodeList/Object";

import { AnyObject } from "@onapi/domain/types/common";

type Props = {
  deepIndex: number;
  nodeKey: any;
  nodeValue: any;
  onLinkSchema: (schema: any) => void;
  onDeleteModel: () => void;
  onCancelLinkSchema: () => void;
  onChangeRefs: any;
  parentModels: React.MutableRefObject<string[]>;
  linkSchema: any;
};

const DataModel: React.FC<Props> = (props) => {
  const {
    deepIndex,
    nodeValue,
    onDeleteModel,
    onLinkSchema,
    onCancelLinkSchema,
    onChangeRefs,
    linkSchema,
    parentModels,
  } = props;
  const { t } = useTranslation();
  const refTable = useRef(null);
  const [warpHeight, setWarpHeight] = useSafeState(0);
  const [showModal, setShowModal] = useSafeState(false);

  const { schemaData } = useSchemaContext();
  const emptyModelInfo = useMemo(() => {
    return schemaData?.[nodeValue?.ONAPI_MODEL_ID];
  }, [schemaData, nodeValue?.ONAPI_MODEL_ID]);

  const parentNodeRef = useRef(
    parentModels.current.concat(nodeValue?.ONAPI_MODEL_ID),
  );

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        if (warpHeight !== height) {
          setWarpHeight(height - 1);
        }
      }
    });
    if (refTable.current) {
      resizeObserver.observe(refTable.current);
    }
    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const handleLinkSchema = (schema: any) => {
    setShowModal(false);
    onLinkSchema(schema);
  };

  // Handle sorting issue after modifying key
  const orderKeys = nodeValue?.ONAPI_ORDERS ?? [];

  const listData = useMemo(() => {
    if (!isArray(orderKeys) || !isPlainObject(nodeValue?.properties)) {
      if (!(isArray(nodeValue?.properties) && isEmpty(nodeValue?.properties))) {
        return [];
      }
    }
    const resultList: any[] = [];
    // Handle case where imported data has no ONAPI_ORDERS or ONAPI_ORDERS is empty
    if (
      (!isArray(orderKeys) || orderKeys.length <= 0) &&
      isPlainObject(nodeValue?.properties)
    ) {
      Object.keys(nodeValue?.properties).forEach((key) => {
        if (isPlainObject(nodeValue?.properties[key])) {
          resultList.push([key, nodeValue?.properties[key]]);
          return;
        }
        const refData = nodeValue?.ONAPI_REFS?.[key];
        const schemaKey = nodeValue?.ONAPI_REFS?.[key]?.ref;

        const modelData = schemaData?.[schemaKey];
        if (isPlainObject(modelData) && isPlainObject(modelData?.schema)) {
          const modelSchema = produce(modelData?.schema, (draft: any) => {
            draft.type = "dataModel";
            draft.ONAPI_MODEL_ID = schemaKey;
            draft.ONAPI_MODEL_KEY = key;
            draft.refData = refData;
          });
          resultList.push([key, modelSchema]);
        }
      });
    } else {
      orderKeys.forEach((key: string) => {
        if (isPlainObject(nodeValue?.properties[key])) {
          resultList.push([key, nodeValue?.properties[key]]);
          return;
        }
        const refData = nodeValue?.ONAPI_REFS?.[key];
        const schemaKey = nodeValue?.ONAPI_REFS?.[key]?.ref;

        const modelData = schemaData?.[schemaKey];
        if (isPlainObject(modelData) && isPlainObject(modelData?.schema)) {
          const modelSchema = produce(modelData?.schema, (draft: any) => {
            draft.type = "dataModel";
            draft.ONAPI_MODEL_ID = schemaKey;
            draft.ONAPI_MODEL_KEY = key;
            draft.refData = refData;
          });
          resultList.push([key, modelSchema]);
        }
      });
    }

    return resultList;
  }, [orderKeys, nodeValue, schemaData]);

  const handleEditModel = useMemoizedFn(async () => {
    if (!isString(nodeValue?.ONAPI_MODEL_ID)) {
      return;
    }
    setShowModal(true);
  });
  const isLoopLink = parentModels.current.some(
    (item) => item === nodeValue?.ONAPI_MODEL_ID,
  );

  const getProperties = (model: any) => {
    if (model?.ONAPI_REFS) {
      return values(model?.ONAPI_REFS)?.reduce((pre, e) => {
        pre = { ...pre, ...getProperties(schemaData?.[e?.ref]?.schema) };
        return pre;
      }, model?.properties || {});
    } else {
      return model?.properties;
    }
  };

  if (linkSchema === "disable") {
    if (isLoopLink) {
      return null;
    }
    return (
      <ObjectList
        {...{ ...props, deepIndex: deepIndex - 1, parentModels: parentNodeRef }}
      />
    );
  }

  return (
    <>
      {showModal && (
        <LinkModal
          open={showModal}
          default_model_id={nodeValue?.ONAPI_MODEL_ID}
          onLinkSchema={handleLinkSchema}
        />
      )}
      <div
        ref={refTable}
        className={cn(
          styles.container,
          "ref-table",
          "model-tbody",
          "table-tbody",
        )}
      >
        <div className={styles.outerBox} style={{ height: warpHeight }}>
          <div className={styles.editForm}>
            <div className={styles.btnItem} onClick={handleEditModel}>
              <span>{t("supplement.edit")}</span>
            </div>
            <div className={styles.btnItem} onClick={onCancelLinkSchema}>
              <span>{t("supplement.disassociate")}</span>
            </div>
            <div className={styles.btnItem} onClick={onDeleteModel}>
              {t("supplement.delete")}
            </div>
          </div>
        </div>

        {isLoopLink ? (
          <div className={styles.loopLinkItem}>
            {t("supplement.link_schema_loop")}
          </div>
        ) : isArray(listData) && listData.length ? (
          listData.map(([key, value], index) => {
            const mergedValue = assign(
              {},
              value,
              nodeValue.refData?.ONAPI_OVERRIDES?.[key],
            );
            // Recursively validate if refValue is an empty schema
            const refValue = schemaData?.[nodeValue?.refData?.ref]?.schema;
            const properties = getProperties(refValue);
            if (isEmpty(value) || isEmpty(properties)) {
              return (
                <div className={styles.loopEmptyModel}>
                  {t("supplement.sch")}
                  <span>{emptyModelInfo?.name}</span>
                  {t("supplement.no_field")}
                </div>
              );
            }
            return (
              <ItemNode
                key={index}
                {...{
                  value,
                  nodeKey: key,
                  readOnly: true,
                  deepIndex,
                  onNodeKeyChange: () => void 0,
                  onChange: () => void 0,
                  onDeleteNode: () => void 0,
                  onAddSiblingNode: () => void 0,
                  isRequired:
                    nodeValue.refData?.ONAPI_OVERRIDES?.[
                      key
                    ]?.required?.includes(key),
                  onSetRequired: (k) => {
                    const newData = produce(mergedValue, (draft: AnyObject) => {
                      if (!has(draft, "required")) {
                        draft["required"] = [];
                      }
                      if (draft?.required?.includes(k)) {
                        // Delete
                        draft["required"] = draft?.required?.filter(
                          (e: string) => e !== k,
                        );
                      } else {
                        draft["required"] = draft?.required?.concat([k]);
                      }
                    });
                    onChangeRefs.apply(null, [key, ...[newData]]);
                  },
                  singleOnly: true,
                  isModelItem: true,
                  onChangeRefs,
                  overrideData: nodeValue.refData?.ONAPI_OVERRIDES?.[key],
                  linkSchema: "disable",
                  parentModels: parentNodeRef,
                  mergedValue: mergedValue,
                }}
              />
            );
          })
        ) : (
          <div className={styles.loopEmptyModel}>
            {t("supplement.she")}
            <span>{emptyModelInfo?.name}</span>
            {t("supplement.no_field")}
          </div>
        )}
      </div>
    </>
  );
};

export default React.memo(DataModel);
