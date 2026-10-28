import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type FocusEvent,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Input as BaseInput,
  AutoComplete,
  Flex,
  Select,
  Tabs,
  TreeSelect,
  type InputRef,
  type TreeSelectProps,
} from "@/shared/ui/base";
import { AppIcon, Input, Popover, Tooltip } from "@/shared/ui";
import fakerDefinitions from "@onapi/domain/mock/faker-definitions.json";
import { MOCK_LANGUAGE_MAP } from "@onapi/domain/settings/constants/settings";
import { has, map } from "lodash-es";
import {
  ASSIGNMENT_VALUE_KEY,
  DATE_FORMAT_OPTIONS,
  FAKER_SPLIT_CONST,
  MOCK_TABS_KEY,
  TIME_ZONE_OPTIONS,
  VAR_OPTIONS_KEY,
} from "@/features/variables/constants/variable";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { hasDateFormat } from "./variable-expression";
import {
  getDefaultDateFormat,
  type DraftAction,
  type VariableDraft,
} from "./variable-draft";
import FakerParamsList from "./FakerParamsList";
import QuoteOption from "./QuoteOption";
import styles from "./VarContent.module.css";
import { variableLabels } from "./variable-labels";

interface Props {
  optionKey: VAR_OPTIONS_KEY;
  draft: VariableDraft;
  dispatch: Dispatch<DraftAction>;
  originValue?: string;
  active: boolean;
}
interface FakerDefinition {
  module: string;
  function: string;
  description?: string | Record<string, string>;
  params?: Record<string, unknown>;
}

export default function VariableValueEditor({
  optionKey,
  draft,
  dispatch,
  originValue: propsValue,
  active,
}: Props) {
  const { t } = useTranslation();
  const {
    value,
    parameters: fakerJsParamList,
    mockTab: mockTabsKey,
    dateFormat: formatInfo,
  } = draft;
  const language = useSystemConfig((state) => state.systemConfig.language);
  const quoteRef = useRef<InputRef>(null);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [searchValue, setSearchValue] = useState<string | undefined>();
  const [treeOpen, setTreeOpen] = useState(false);
  const setValue = (value: string) => dispatch({ type: "value", value });
  const setMockTabsKey = (mockTab: MOCK_TABS_KEY) =>
    dispatch({ type: "mock-tab", mockTab });
  const setFakerJsParamList = (parameters: VariableDraft["parameters"]) =>
    dispatch({ type: "parameters", parameters });
  const setFormatInfo = (dateFormat: VariableDraft["dateFormat"]) =>
    dispatch({ type: "date-format", dateFormat });
  const showTheDateFormat = hasDateFormat(optionKey, value);

  useEffect(() => {
    if (!active || propsValue) {
      return;
    }
    const timer = setTimeout(() => {
      if (optionKey === VAR_OPTIONS_KEY.var) {
        quoteRef.current?.focus({ cursor: "end" });
      }
      if (optionKey === VAR_OPTIONS_KEY.mock) {
        setTreeOpen(true);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [active, optionKey, propsValue]);

  const {
    mockTreeData,
    fakerJsParamsMap,
    mockDescMap,
    treeDefaultExpandedKeys,
  } = useMemo(() => {
    const tree: NonNullable<TreeSelectProps["treeData"]> = [];
    const modules: Record<
      string,
      NonNullable<TreeSelectProps["treeData"]>[number]
    > = {};
    const parameters: Record<string, Record<string, unknown>> = {};
    const descriptions: Record<string, string> = {};
    const expanded: string[] = [];
    if (optionKey === VAR_OPTIONS_KEY.mock) {
      const definitions: FakerDefinition[] = fakerDefinitions;
      for (const item of definitions) {
        const key = `${item.module}${FAKER_SPLIT_CONST}${item.function}`;
        if (!modules[item.module]) {
          modules[item.module] = {
            value: item.module,
            title: item.module,
            key: item.module,
            isLeaf: false,
            selectable: false,
            children: [],
          };
          tree.push(modules[item.module]);
        }
        const description =
          typeof item.description === "string"
            ? item.description
            : item.description?.[MOCK_LANGUAGE_MAP[language]] || "";
        modules[item.module].children!.push({
          value: key,
          key,
          title: item.function,
          isLeaf: true,
          selectable: true,
          desc: description,
        });
        descriptions[key] = description;
        if (item.params && Object.keys(item.params).length) {
          parameters[key] = item.params;
        }
        if (propsValue === key) {
          expanded.push(item.module);
        }
      }
    }
    return {
      mockTreeData: tree,
      fakerJsParamsMap: parameters,
      mockDescMap: descriptions,
      treeDefaultExpandedKeys: expanded,
    };
  }, [optionKey, language, propsValue]);

  const assignmentAiOptions = useMemo(
    () => [
      { value: propsValue, label: t("var_insert.generate_value") },
      {
        value: ASSIGNMENT_VALUE_KEY.random,
        label: t("var_insert.send_random"),
      },
    ],
    [propsValue, t],
  );

  const dropdownRender = (originNode: ReactNode) => {
    return (
      <div className={styles.treeDropDown}>
        <Tabs
          size="small"
          activeKey={mockTabsKey}
          onChange={(key) => {
            setMockTabsKey(key as MOCK_TABS_KEY);
          }}
          items={[
            {
              key: MOCK_TABS_KEY.faker,
              label: t("settings.mock_settings.faker"),
            },
          ]}
          className={styles.tabs}
        />
        {originNode}
      </div>
    );
  };

  const treeTitleRender: TreeSelectProps["treeTitleRender"] = (props: {
    title?: ReactNode;
    value?: string;
    desc?: string;
    isLeaf?: boolean;
  }) => {
    if (has(props, "isLeaf")) {
      return (
        <div className={styles.treeTitle}>
          <span className={styles.label}>
            <Tooltip title={props?.title}>{props?.title}</Tooltip>
          </span>
          <span className={styles.desc}>
            <Tooltip title={props?.desc}>{props?.desc}</Tooltip>
          </span>
        </div>
      );
    }
    if (props?.value) {
      const prefix = "$fakerjs.";
      return (
        <Flex className={styles.treeValue}>
          <span className={styles.value}>
            {prefix}
            {props?.value || ""}
          </span>
          <Tooltip title={mockDescMap?.[props?.value]}>
            <AppIcon icon="info" className={styles.icon} />
          </Tooltip>
        </Flex>
      );
    }

    return props?.value;
  };

  const inputRender = () => {
    if (optionKey === VAR_OPTIONS_KEY.var) {
      return (
        <Popover
          overlayInnerStyle={{ padding: 8 }}
          content={
            <QuoteOption
              value={value}
              onChange={(v) => {
                setQuoteOpen(false);
                setValue(v);
              }}
            />
          }
          open={quoteOpen}
          trigger={[]}
          placement="bottom"
        >
          <div>
            <BaseInput
              maxLength={256}
              value={value}
              ref={quoteRef}
              onChange={(e) => setValue(e?.target?.value)}
              placeholder={t("var_insert.var_placeholder")}
              onFocus={() => setQuoteOpen(true)}
              onBlur={() => setQuoteOpen(false)}
              inputClassName={styles.input}
            />
          </div>
        </Popover>
      );
    }
    if (optionKey === VAR_OPTIONS_KEY.mock) {
      return (
        <TreeSelect
          treeData={mockTreeData}
          treeDefaultExpandedKeys={treeDefaultExpandedKeys}
          treeExpandAction={"click"}
          showSearch
          searchValue={searchValue}
          onSearch={(v) => setSearchValue(v)}
          placeholder={t("var_insert.fixed_placeholder")}
          dropdownRender={dropdownRender}
          treeTitleRender={treeTitleRender}
          value={value || undefined}
          style={{ width: "100%" }}
          dropdownStyle={{ maxHeight: 400, overflow: "auto", paddingTop: 0 }}
          onSelect={(e) => {
            dispatch({ type: "mock-value", value: String(e) });
          }}
          open={treeOpen}
          onDropdownVisibleChange={(v) => setTreeOpen(v)}
          className={styles.select}
        />
      );
    }
    if (optionKey === VAR_OPTIONS_KEY.fixed) {
      return (
        <Input
          placeholder={t("supplement.input_tip")}
          maxLength={256}
          value={value}
          onChange={(e) => setValue(e?.target?.value)}
          inputClassName={styles.input}
        />
      );
    }
    if (optionKey === VAR_OPTIONS_KEY.ai_value) {
      return (
        <Select
          value={value}
          onChange={(e) => setValue(e)}
          options={assignmentAiOptions}
          triggerClassName={styles.selectTrigger}
          className={styles.select}
        />
      );
    }
    return "";
  };

  const timeZoneOptions = map(TIME_ZONE_OPTIONS, ({ value, label }) => ({
    value,
    label: `${value}(${label})`,
  }));

  const dateFormatOptions = map(DATE_FORMAT_OPTIONS, ({ value, label }) => ({
    value,
    label: (
      <div className={styles.treeTitle}>
        <span style={{ maxWidth: 200 }} className={styles.label}>
          <Tooltip title={value}>{value}</Tooltip>
        </span>
        <span className={styles.desc}>
          <Tooltip title={label}>{label}</Tooltip>
        </span>
      </div>
    ),
  }));

  return (
    <>
      <Flex gap={8} vertical>
        <span className={styles.inputLabel}>
          {t(variableLabels[optionKey].input)}
        </span>
        {inputRender()}
      </Flex>
      {optionKey === VAR_OPTIONS_KEY.mock &&
        mockTabsKey === MOCK_TABS_KEY.faker &&
        has(fakerJsParamsMap, value) && (
          <FakerParamsList
            onChange={(v) => setFakerJsParamList(v)}
            fakerJsParamList={fakerJsParamList}
            fakerJsParamsMap={fakerJsParamsMap}
            value={value}
          />
        )}

      {showTheDateFormat && (
        <Flex gap={8} className="fn-format">
          <Flex gap={8} flex={1} vertical>
            <span className="fn-format-title">
              {t("var_insert.time_format")}
            </span>
            <AutoComplete
              maxLength={30}
              style={{ width: "100%" }}
              value={formatInfo.format}
              onBlur={(e: FocusEvent<HTMLInputElement>) => {
                const v = e.currentTarget.value.trim();
                if (!v) {
                  setFormatInfo({
                    ...formatInfo,
                    format: "YYYY-MM-DD HH:mm:ss",
                  });
                }
              }}
              onChange={(e) =>
                setFormatInfo({
                  ...formatInfo,
                  format: e,
                })
              }
              options={dateFormatOptions}
              triggerClassName={styles.selectTrigger}
              className={styles.select}
            />
          </Flex>
          <Flex gap={8} vertical>
            <span className="fn-format-title">
              {t("var_insert.utc_format")}
            </span>
            <AutoComplete
              value={formatInfo.utc}
              maxLength={30}
              onBlur={(e: FocusEvent<HTMLInputElement>) => {
                const v = e.currentTarget.value.trim();
                if (!v) {
                  setFormatInfo({
                    ...formatInfo,
                    utc: getDefaultDateFormat().utc,
                  });
                }
              }}
              onChange={(e) =>
                setFormatInfo({
                  ...formatInfo,
                  utc: e,
                })
              }
              style={{ width: 100 }}
              options={timeZoneOptions}
              triggerClassName={styles.selectTrigger}
              className={styles.select}
            />
          </Flex>
        </Flex>
      )}
    </>
  );
}
