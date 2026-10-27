import styles from "./FunctionModal.module.css";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Flex, Select } from "@/shared/ui/base";

import classNames from "classnames";
import { has, size } from "lodash-es";

import { Button, Input, InputNumber, Modal, Tooltip } from "@/shared/ui";
import {
  FUNCTION_DEFAULT_VALUE,
  INNER_FUNC_LIST,
} from "@/features/variables/constants/variable";
import useProjectSetting from "@/features/project/store/useProjectSetting";
import {
  FuncListRenderItem,
  InnerFuncListItem,
} from "@onapi/http-model/requests/types/variable";

interface Props {
  open: boolean;
  value?: Record<string, any>;
  editFn?: { func_name: string; func_desc?: string; paras?: any };
  onCancel: (v?: FuncListRenderItem) => void;
}

const defaultFnItem = {
  func_name: "",
  func_desc: "",
  paras: {},
};

const Index = ({
  open,
  onCancel,
  value: originValue = {},
  editFn = defaultFnItem,
}: Props) => {
  useEffect(() => {
    if (open) {
      setValue({
        ...FUNCTION_DEFAULT_VALUE,
        ...originValue,
        ...(editFn?.paras || {}),
      });
      setSelectFunc(editFn);
    }
  }, [open]);
  const { t } = useTranslation();
  const [value, setValue] = useState<Record<string, any>>({});
  const [selectFunc, setSelectFunc] = useState<{
    func_name: string;
    func_desc?: string;
    paras?: Record<string, any>;
  }>(defaultFnItem);
  const functionList = useProjectSetting((state) => state.functionList);

  const onChange = (obj: Record<string, any>) => {
    setValue({
      ...value,
      ...obj,
    });
  };

  const funcRender = ({
    function: funcStr,
    description,
    params,
  }: InnerFuncListItem) => {
    if (params) {
      return params.map((item) => {
        const v = item.key ? value[funcStr]?.[item.key] : value[funcStr]?.text;
        const change = (funcKey: string, data: any) => {
          if (item.key) {
            onChange({
              [funcKey]: {
                ...value[funcKey],
                [item.key]: data,
              },
            });
          } else {
            onChange({
              [funcKey]: {
                ...value[funcKey],
                text: data,
              },
            });
          }
        };
        if (item.type === "number") {
          return (
            <InputNumber
              placeholder={item.placeholder}
              precision={0}
              size="small"
              onChange={(e) => change(funcStr, e)}
              value={v}
            />
          );
        }
        if (item.type === "option" && item.options) {
          return (
            <Select
              size="small"
              style={{ width: "100%" }}
              onChange={(e) => change(funcStr, e)}
              value={v}
              options={item.options}
            />
          );
        }
        if (item.type === "string") {
          return (
            <Input
              placeholder={item.placeholder}
              size="small"
              maxLength={256}
              value={v}
              onChange={(e) => change(funcStr, e.target.value)}
            />
          );
        }
        return "";
      });
    } else {
      return description;
    }
  };

  const onConfirm = () => {
    onCancel({
      func_name: selectFunc.func_name,
      func_desc: selectFunc?.func_desc,
      paras: value,
    });
  };

  const footer = (
    <Flex align="center" justify="end">
      <Flex gap={12}>
        <Button onClick={() => onCancel()}>{t("base.cancel")}</Button>
        <Button
          disabled={!selectFunc?.func_name}
          onClick={onConfirm}
          type="primary"
        >
          {t("common.confirm")}
        </Button>
      </Flex>
    </Flex>
  );

  return (
    <Modal
      onCancel={() => onCancel()}
      open={open}
      destroyOnClose
      width={600}
      title={t("var_insert.handle_fn")}
      footer={footer}
    >
      <div className={styles.container}>
        {size(functionList) ? (
          <div className={styles.innerContent}>
            <span className={styles.tipTitle}>{t("var_insert.custom_fn")}</span>
            {functionList.map((item) => {
              return (
                <Tooltip title={item?.func_desc}>
                  <div
                    key={item.func_id}
                    onClick={() =>
                      setSelectFunc({
                        func_name: item.func_name,
                        func_desc: item.func_desc,
                      })
                    }
                    className={classNames(styles.item, {
                      [styles.active]: selectFunc.func_name === item.func_name,
                    })}
                  >
                    <div className={styles.name}>{item.func_name}</div>
                    <div
                      className={[styles.render, styles.customDesc].join(" ")}
                    >
                      {item.func_desc}
                    </div>
                  </div>
                </Tooltip>
              );
            })}
          </div>
        ) : (
          ""
        )}
        <div className={styles.innerContent}>
          <span className={styles.tipTitle}>{t("var_insert.inner_fn")}</span>
          {INNER_FUNC_LIST.map((item) => {
            return (
              <Tooltip title={item?.description}>
                <div
                  key={item.function}
                  onClick={() =>
                    setSelectFunc({
                      func_name: item.function,
                      func_desc: item.description,
                    })
                  }
                  className={classNames(styles.item, {
                    [styles.active]: selectFunc.func_name === item.function,
                  })}
                >
                  <div className={styles.name}>{item.function}</div>
                  <div
                    className={classNames(
                      styles.render,
                      !has(item, "params") && styles.customDesc,
                    )}
                  >
                    {funcRender(item)}
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default Index;
