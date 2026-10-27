import { forwardRef, useImperativeHandle, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { cloneDeep } from "lodash-es";
import clsx from "clsx";
import { Flex } from "@/shared/ui/base";
import { AppIcon, Button } from "@/shared/ui";
import { INNER_FUNC_LIST } from "@/features/variables/constants/variable";
import useProjectSetting from "@/features/project/store/useProjectSetting";
import { transFuncName } from "@/features/variables/utils/variable";
import type { FuncListRenderItem } from "@onapi/domain/requests/types/variable";
import FunctionModal from "./FunctionModal";
import styles from "./VarContent.module.css";

export interface VariableFunctionsRef {
  readonly open: boolean;
}

type FunctionEdit =
  | { mode: "closed" }
  | { mode: "add"; draft: FuncListRenderItem }
  | { mode: "edit"; index: number; draft: FuncListRenderItem };

interface Props {
  functions: FuncListRenderItem[];
  onChange: (functions: FuncListRenderItem[]) => void;
}

const VariableFunctions = forwardRef<VariableFunctionsRef, Props>(
  ({ functions, onChange }, ref) => {
    const { t } = useTranslation();
    const [edit, setEdit] = useState<FunctionEdit>({ mode: "closed" });
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);
    const customFunctions = useProjectSetting((state) => state.functionList);
    const catalog = useMemo(
      () =>
        Object.fromEntries([
          ...customFunctions.map((fn) => [fn.func_name, fn.func_desc]),
          ...INNER_FUNC_LIST.map((fn) => [fn.function, fn.description]),
        ]),
      [customFunctions],
    );
    useImperativeHandle(ref, () => ({ open: edit.mode !== "closed" }), [edit]);

    const finish = (fn?: FuncListRenderItem) => {
      if (fn && edit.mode !== "closed") {
        onChange(
          edit.mode === "edit"
            ? functions.map((item, index) => (index === edit.index ? fn : item))
            : [...functions, fn],
        );
      }
      setEdit({ mode: "closed" });
    };

    return (
      <>
        <Flex gap={4} className={styles.fnList} vertical>
          {functions.length > 0 && (
            <div className={styles.listContent}>
              {functions.map((fn, index) => (
                <Flex
                  key={`${fn.func_name}:${index}`}
                  gap={4}
                  className={styles.listContentItem}
                  justify="space-between"
                  onMouseOver={() => setHoverIndex(index)}
                  onMouseOut={() => setHoverIndex(null)}
                >
                  <div
                    role="button"
                    tabIndex={0}
                    aria-label={`Edit function ${index + 1}`}
                    aria-disabled={!(fn.func_name in catalog)}
                    onClick={() => {
                      if (fn.func_name in catalog) {
                        setEdit({ mode: "edit", index, draft: cloneDeep(fn) });
                      }
                    }}
                    onKeyDown={(event) => {
                      if (
                        (event.key === "Enter" || event.key === " ") &&
                        fn.func_name in catalog
                      ) {
                        event.preventDefault();
                        setEdit({ mode: "edit", index, draft: cloneDeep(fn) });
                      }
                    }}
                    className={clsx(styles.name, {
                      [styles.del]: !(fn.func_name in catalog),
                    })}
                  >
                    {transFuncName(fn.func_name, fn.paras)}
                  </div>
                  <Flex gap={4} className={styles.desc} align="center">
                    <span>{fn.func_desc || catalog[fn.func_name] || ""}</span>
                    {index === hoverIndex ? (
                      <AppIcon
                        role="button"
                        aria-label={`Remove function ${index + 1}`}
                        onClick={() =>
                          onChange(
                            functions.filter(
                              (_, candidate) => candidate !== index,
                            ),
                          )
                        }
                        style={{ color: "#ff583e", cursor: "pointer" }}
                        icon="circle-x"
                        className={styles.icon}
                      />
                    ) : (
                      <AppIcon
                        rotate={-90}
                        icon="chevron-down"
                        className={styles.icon}
                      />
                    )}
                  </Flex>
                </Flex>
              ))}
            </div>
          )}
          <Button
            size="small"
            mode="light"
            type="primary"
            onClick={() =>
              setEdit({
                mode: "add",
                draft: { func_name: "", func_desc: "", paras: {} },
              })
            }
            icon={<AppIcon icon="plus" className={styles.icon} />}
          >
            {t("var_insert.add_fn")}
          </Button>
        </Flex>
        {edit.mode !== "closed" && (
          <FunctionModal editFn={edit.draft} onCancel={finish} />
        )}
      </>
    );
  },
);

export default VariableFunctions;
