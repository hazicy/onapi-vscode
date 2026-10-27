import styles from "./Empty.module.css";
import React, { memo, useRef } from "react";
import { useTranslation } from "react-i18next";

import { Input } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import clsx from "clsx";

import Button from "@/shared/ui/Button";
import AppIcon from "@/shared/ui/AppIcon";

import LinkModal from "../modals/Link/Link";

type Props = {
  deepIndex: number;
  nodeKey: string;
  onNodeKeyChange: (preKey: string, newKey: string) => void;
  onDeleteNode: () => void;
  onLinkSchema: (schema: any) => void;
};

const EmptyItem: React.FC<Props> = (props) => {
  const { deepIndex, nodeKey, onNodeKeyChange, onDeleteNode, onLinkSchema } =
    props;
  const { t } = useTranslation();
  const [showModal, setShowModal] = useSafeState(false);
  const isComposition = useRef(false);
  const [compositionValue, setCompositionValue] = useSafeState<
    string | undefined
  >("");

  const handleLinkSchema = (schema: any) => {
    setShowModal(false);
    onLinkSchema(schema);
  };

  const handleChangeKey: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    if (!isComposition.current) {
      onNodeKeyChange(nodeKey, e.target.value);
    } else {
      setCompositionValue(e.target.value);
    }
  };

  const onCompositionEnd = (e: any) => {
    if (e?.type === "compositionend") {
      isComposition.current = false;
      setCompositionValue(undefined);
      onNodeKeyChange(nodeKey, e.target.value);
    } else {
      isComposition.current = true;
    }
  };
  const IndentPanel = (deepIndex: any) => {
    // Generate indent array based on deepIndex
    const indents = Array.from({ length: deepIndex }, (_, index) => (
      <div key={index} className={styles.indentPanel}></div>
    ));

    return indents;
  };
  return (
    <>
      <LinkModal open={showModal} onLinkSchema={handleLinkSchema} />
      <div>
        <div className={styles.container}>
          <div className={clsx(styles.schemaTdWarper, styles.schemaWidthAuto)}>
            {IndentPanel(deepIndex)}
            <Input
              size="small"
              spellCheck={false}
              readOnly={false}
              style={{ width: 140, border: "none", boxShadow: "none" }}
              placeholder={t("common.schema.field_name")}
              value={compositionValue || `${nodeKey}`}
              onChange={handleChangeKey}
              onCompositionStart={onCompositionEnd}
              onCompositionUpdate={onCompositionEnd}
              onCompositionEnd={onCompositionEnd}
              inputClassName={styles.input}
            />
            <div className={styles.textPanel}></div>
            <div className={styles.btnList}>
              <Button
                icon={<AppIcon icon="trash-2" />}
                type="text"
                size="small"
                onClick={onDeleteNode}
              ></Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default memo(EmptyItem);
