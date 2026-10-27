import {
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import clsx from "clsx";
import { Flex } from "@/shared/ui/base";
import { AppIcon, Empty } from "@/shared/ui";
import VariableInsertContext from "@/features/variables/contexts/variable-insert";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import {
  selectActiveEnvironment,
  scopeValues,
} from "@/features/project/store/useProjectConfig/selectors";
import useProjectSetting from "@/features/project/store/useProjectSetting";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { createVariableDraft, variableDraftReducer } from "./variable-draft";
import {
  buildVariableExpression,
  isDescriptionOption,
} from "./variable-expression";
import { evaluateVariablePreview, usesPlainPreview } from "./variable-preview";
import useVariablePreview from "./useVariablePreview";
import VariableValueEditor from "./VariableValueEditor";
import VariableDescriptionEditor from "./VariableDescriptionEditor";
import VariableFunctions, {
  type VariableFunctionsRef,
} from "./VariableFunctions";
import VariableInsertFooter from "./VariableInsertFooter";
import styles from "./VarContent.module.css";
import { variableLabels } from "./variable-labels";

export interface VarContentRef {
  readonly funcOpen: boolean;
}

const VarContent = forwardRef<VarContentRef, { className?: string }>(
  ({ className }, ref) => {
    const { t } = useTranslation();
    const {
      optionKey,
      stepChange,
      onChange,
      value: propsValue,
      setOpen,
      isEdit,
      fixedRefresh,
      originFnList,
      originMockTabsKey,
      originFakerJsParamList,
      isInsertDynamic,
      originFormatInfo,
      step,
    } = useContext(VariableInsertContext);
    const [draft, dispatch] = useReducer(
      variableDraftReducer,
      {
        value: propsValue,
        functions: originFnList,
        parameters: originFakerJsParamList,
        mockTab: originMockTabsKey,
        dateFormat: originFormatInfo,
      },
      createVariableDraft,
    );
    const previousOption = useRef(optionKey);
    const functionEditor = useRef<VariableFunctionsRef>(null);
    useImperativeHandle(
      ref,
      () => ({
        get funcOpen() {
          return functionEditor.current?.open || false;
        },
      }),
      [],
    );

    // A mode change restores its source functions/parameters together. External
    // value refreshes update only the value so they cannot discard function edits.
    useEffect(() => {
      if (previousOption.current !== optionKey) {
        dispatch({
          type: "option",
          isEdit,
          origin: {
            functions: originFnList,
            parameters: originFakerJsParamList,
          },
        });
        previousOption.current = optionKey;
      }
    }, [optionKey, isEdit, originFnList, originFakerJsParamList]);
    useEffect(() => {
      dispatch({
        type: "origin-value",
        value: propsValue,
        mockTab: originMockTabsKey,
      });
    }, [propsValue, originMockTabsKey]);

    const environment = useProjectConfig(selectActiveEnvironment);
    const environmentMap = useMemo(
      () => scopeValues(environment),
      [environment],
    );
    const functionList = useProjectSetting((state) => state.functionList);
    const functionSources = useMemo(
      () =>
        Object.fromEntries(
          functionList.flatMap((fn) =>
            typeof fn.func_body === "string"
              ? [[fn.func_name, fn.func_body]]
              : [],
          ),
        ),
      [functionList],
    );
    const language = useSystemConfig((state) => state.systemConfig.language);
    const expression = useMemo(
      () => buildVariableExpression(optionKey, draft),
      [optionKey, draft],
    );
    const undefinedTip = t("var_insert.undefine_tip");
    const loadPreview = useCallback(
      () =>
        evaluateVariablePreview({
          option: optionKey,
          value: draft.value,
          expression,
          functions: draft.functions,
          environment: environmentMap,
          functionSources,
          language,
          undefinedTip,
        }),
      [
        optionKey,
        draft.value,
        draft.functions,
        expression,
        environmentMap,
        functionSources,
        language,
        undefinedTip,
      ],
    );
    const preview = useVariablePreview({
      enabled: step === 2 && !isDescriptionOption(optionKey),
      load: loadPreview,
      delay: usesPlainPreview({
        option: optionKey,
        value: draft.value,
        functions: draft.functions,
      })
        ? 0
        : 500,
      fallback: expression,
    });

    return (
      <div
        className={clsx(
          styles.container,
          step === 2 && styles.active,
          className,
        )}
        aria-hidden={step !== 2}
        inert={step !== 2}
      >
        <Flex justify="space-between" align="center">
          <Flex
            role="button"
            tabIndex={0}
            aria-label="Back to variable types"
            onClick={() => stepChange({ step: 1, key: optionKey })}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                stepChange({ step: 1, key: optionKey });
              }
            }}
            className={[styles.title, styles.cursor].join(" ")}
            gap={8}
            align="center"
          >
            <AppIcon rotate={90} icon="download" className={styles.icon} />
            <span>{t(variableLabels[optionKey].title)}</span>
          </Flex>
          <AppIcon
            onClick={() => setOpen?.(false)}
            className={clsx(styles.cursor, styles.icon)}
            icon="circle-x"
          />
        </Flex>
        {isDescriptionOption(optionKey) ? (
          <VariableDescriptionEditor
            key={optionKey}
            option={optionKey}
            value={draft.value}
            onChange={(value) => dispatch({ type: "value", value })}
            onRefresh={fixedRefresh}
          />
        ) : (
          <Flex gap={8} style={{ overflowY: "auto" }} flex={1} vertical>
            <VariableValueEditor
              key={`value:${optionKey}`}
              optionKey={optionKey}
              draft={draft}
              dispatch={dispatch}
              originValue={propsValue}
              active={step === 2}
            />
            {draft.value ? (
              <VariableFunctions
                key={`functions:${optionKey}`}
                ref={functionEditor}
                functions={draft.functions}
                onChange={(functions) =>
                  dispatch({ type: "functions", functions })
                }
              />
            ) : (
              <Empty
                wrapStyle={{
                  width: "100%",
                  flex: 1,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              />
            )}
          </Flex>
        )}
        <VariableInsertFooter
          value={draft.value}
          expression={expression}
          optionKey={optionKey}
          isEdit={isEdit}
          isInsertDynamic={isInsertDynamic}
          previewText={preview.text}
          previewLoading={preview.loading}
          updatePreviewText={preview.refresh}
          onChange={onChange}
        />
      </div>
    );
  },
);

export default VarContent;
