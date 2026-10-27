import {
  selectActiveEnvironment,
  scopeValues,
} from "@/features/project/store/useProjectConfig/selectors";
import styles from "./VarContent.module.css";
import {
  ReactNode,
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import {
  Input as BaseInput,
  AutoComplete,
  Flex,
  Select,
  Spin,
  Tabs,
  TreeSelect,
  TreeSelectProps,
  message,
} from "@/shared/ui/base";

import { useDebounceFn } from "ahooks";
import classNames from "classnames";
import {
  encryptString,
  getFakerObject,
  mockExp,
} from "@onapi/http-model/mock/expressions";
import {
  cloneDeep,
  concat,
  entries,
  find,
  has,
  includes,
  isArray,
  isEmpty,
  isEqual,
  isNumber,
  isObject,
  isPlainObject,
  isString,
  map,
  mapKeys,
  merge,
  size,
} from "lodash";

import { Button, Empty, AppIcon, Input, Popover, Tooltip } from "@/shared/ui";
import { MOCK_LANGUAGE_MAP } from "@onapi/http-model/settings/constants/settings";
import { SYSTEM_VARS } from "@/shared/constants/system";
import {
  ASSIGNMENT_VALUE_KEY,
  FAKERJS_VAR_LIST,
  FAKER_SPLIT_CONST,
  INNER_FUNC_LIST,
  MOCK_TABS_KEY,
  OPTIONS_KEY_LABEL_MAP,
  OPTIONS_KEY_MAP,
  VAR_OPTIONS_KEY,
  TIME_ZONE_OPTIONS,
  FAKERJS_FORMAT_LIST,
  DATE_FORMAT_OPTIONS,
} from "@/features/variables/constants/variable";
import { VariableInsertContext } from "@/shared/contexts";
import {
  useProjectConfig,
  useProjectSetting,
  useSystemConfig,
} from "@/app/store";
import {
  FuncListRenderItem,
  InsertAction,
} from "@onapi/http-model/requests/types/variable";
import { copyStringToClipboard } from "@/shared/utils/common";
import { getGlobals } from "@/features/requests/utils/send/utils";
import { transFuncName } from "@/features/variables/utils/variable";
import { transKey } from "@/features/variables/utils/variable";

import FakerParamsList from "./FakerParamsList";
import FunctionModal from "./FunctionModal";
import QuoteOption from "./QuoteOption";

const defaultFnItem = {
  func_name: "",
  func_desc: "",
  paras: {},
};

const offsetHour = Math.floor(-new Date().getTimezoneOffset() / 60);
const offsetMinutes = Math.abs(-new Date().getTimezoneOffset()) % 60;
const defaultUtcOffset = `${offsetHour >= 0 ? "+" : "-"}${offsetHour
  .toString()
  .padStart(2, "0")}:${offsetMinutes.toString().padStart(2, "0")}`;

const Index = (_props: { className?: string }, ref: React.Ref<any>) => {
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
  const quoteRef = useRef<any>(null);
  const [value, setValue] = useState<any>("");
  const [fnList, setFnList] = useState<FuncListRenderItem[]>([]);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [funcOpen, setFuncOpen] = useState<boolean>(false);
  const [previewText, setPreviewText] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [mockTabsKey, setMockTabsKey] = useState<MOCK_TABS_KEY>(
    MOCK_TABS_KEY.faker,
  );
  const [descHoverIndex, setDescHoverIndex] = useState<string>("");
  const [editFn, setEditFn] = useState<FuncListRenderItem>(defaultFnItem);
  const [editIndex, setEditIndex] = useState<number | undefined>(undefined);
  const [fakerJsParamsMap, setFakerJsParamsMap] = useState<Record<string, any>>(
    {},
  );
  const [fakerJsTreeData, setFakerJsTreeData] = useState<
    TreeSelectProps["treeData"]
  >([]);
  const [fakerJsParamList, setFakerJsParamList] = useState<
    { key: string; value: any }[]
  >([]);
  const [treeDefaultExpandedKeys, setTreeDefaultExpandedKeys] = useState<any>(
    [],
  );
  const [searchValue, setSearchValue] = useState<string | undefined>(undefined);
  const [treeOpen, setTreeOpen] = useState(false);

  const environment = useProjectConfig(selectActiveEnvironment);
  const functionList = useProjectSetting((state) => state.functionList);
  const descriptionList = useProjectSetting((state) => state.descriptionList);
  const language = useSystemConfig((state) => state.systemConfig.language);
  const [formatInfo, setFormatInfo] = useState({
    format: "YYYY/MM/DD HH:mm:ss",
    utc: defaultUtcOffset,
  });
  useImperativeHandle(ref, () => {
    return {
      funcOpen,
    };
  });

  const fnKeyMap = useMemo(() => {
    const innerMap = INNER_FUNC_LIST.reduce(
      (pre, item) => {
        pre[item.function] = {
          func_name: item.function,
          func_desc: item.description,
        };
        return pre;
      },
      {} as Record<string, any>,
    );
    const FuncMap = functionList.reduce(
      (pre, item) => {
        pre[item.func_name] = {
          func_name: item.func_name,
          func_desc: item.func_desc,
        };
        return pre;
      },
      {} as Record<string, any>,
    );
    return merge(FuncMap, innerMap);
  }, [functionList]);

  const getPreviewTextWithEmptyFn = async () => {
    if (optionKey === VAR_OPTIONS_KEY.fixed) {
      return `${value}`;
    }
    if (optionKey === VAR_OPTIONS_KEY.ai_value) {
      if (value === ASSIGNMENT_VALUE_KEY.random) {
        return "@ai()";
      } else {
        return `${value}`;
      }
    }
    if (optionKey === VAR_OPTIONS_KEY.var) {
      const globals = await getGlobals();
      const systemMap = mapKeys(SYSTEM_VARS, (_value, key) => `$${key}`);
      const varMap = merge(systemMap, globals, environmentMap);
      if (isString(varMap?.[value])) {
        return varMap?.[value] || t("var_insert.undefine_tip");
      } else {
        return JSON.stringify(varMap?.[value]);
      }
    }
    return "";
  };

  const fakerStr = useMemo(() => {
    const list = fakerJsParamList.map((item) => {
      if (item?.value) {
        if (isArray(item.value)) {
          const arrStr = encryptString(`[${item.value?.join(",")}]`);
          return `${transKey(item.key)}=${arrStr}`;
        }
        if (isNumber(item.value)) {
          return `${transKey(item.key)}=${encryptString(item.value.toString())}`;
        }
        return `${transKey(item.key)}=${encryptString(item.value)}`;
      }
      return "";
    });
    const str = list.filter((s) => s !== "").join(",");
    if (size(str)) {
      return `(${str})`;
    } else {
      return "";
    }
  }, [fakerJsParamList]);

  useEffect(() => {
    if (step === 2 && isEmpty(propsValue)) {
      if (isEqual(optionKey, VAR_OPTIONS_KEY.var) && quoteRef.current) {
        setTimeout(() => {
          quoteRef.current!.focus({
            cursor: "end",
          });
        }, 100);
      }
      if (isEqual(optionKey, VAR_OPTIONS_KEY.mock)) {
        setTimeout(() => {
          setTreeOpen(true);
        }, 100);
      }
    }
  }, [step]);

  const fakerShowTheDateFormat =
    isEqual(optionKey, VAR_OPTIONS_KEY.mock) &&
    includes(FAKERJS_FORMAT_LIST, value?.toLowerCase());

  const showTheDateFormat = fakerShowTheDateFormat;

  const expression = useMemo(() => {
    const formatStr = showTheDateFormat
      ? `|format(${formatInfo.format},${formatInfo.utc})`
      : "";
    if (fnList.length) {
      if (optionKey === VAR_OPTIONS_KEY.fixed) {
        return `{{'${value}'|${fnList
          .map((e) => transFuncName(e.func_name, e.paras))
          ?.join("|")}}}`;
      }
      if (optionKey === VAR_OPTIONS_KEY.ai_value) {
        if (value === ASSIGNMENT_VALUE_KEY.random) {
          return `{{@ai()|${fnList.map((e) => transFuncName(e.func_name, e.paras))?.join("|")}}}}}`;
        } else {
          return `{{'${value}'|${fnList
            .map((e) => transFuncName(e.func_name, e.paras))
            ?.join("|")}}}`;
        }
      }
      if (optionKey === VAR_OPTIONS_KEY.mock) {
        return `{{$fakerjs.${value}${fakerStr}${formatStr}|${fnList
          .map((e) => transFuncName(e.func_name, e.paras))
          ?.join("|")}}}`;
      }
      return `{{${value}${formatStr}|${fnList
        .map((e) => transFuncName(e.func_name, e.paras))
        ?.join("|")}}}`;
    } else {
      if (optionKey === VAR_OPTIONS_KEY.fixed) {
        return `{{'${value}'}}`;
      }
      if (optionKey === VAR_OPTIONS_KEY.ai_value) {
        if (value === ASSIGNMENT_VALUE_KEY.random) {
          return "{{@ai()}}";
        } else {
          return `{{'${value}'}}`;
        }
      }
      if (optionKey === VAR_OPTIONS_KEY.mock) {
        return `{{$fakerjs.${value}${fakerStr}${formatStr}}}`;
      }
      return `{{${value}${formatStr}}}`;
    }
  }, [
    value,
    fnList,
    optionKey,
    fakerJsParamList,
    showTheDateFormat,
    formatInfo,
  ]);

  const functionObj = useMemo(() => {
    return functionList.reduce(
      (pre, item) => {
        pre[item.func_name] = item.func_body;
        return pre;
      },
      {} as Record<string, any>,
    );
  }, [functionList]);

  useEffect(() => {
    setFnList(originFnList || []);
    setFakerJsParamList(originFakerJsParamList || []);
    if (optionKey === VAR_OPTIONS_KEY.mock) {
      getFakerJsTreeData();
    }
    if (!isEdit) {
      setValue("");
    }
  }, [optionKey]);

  useEffect(() => {
    setFormatInfo({
      ...formatInfo,
      ...originFormatInfo,
    });
  }, []);

  useEffect(() => {
    if (originMockTabsKey) {
      setMockTabsKey(originMockTabsKey);
    }
    setValue(propsValue || "");
  }, [propsValue, originMockTabsKey]);

  useEffect(() => {
    updatePreviewText();
  }, [value, expression, optionKey]);

  const updatePreviewText = () => {
    if ([VAR_OPTIONS_KEY.desc, VAR_OPTIONS_KEY.ai_desc].includes(optionKey)) {
      return;
    }
    if ([VAR_OPTIONS_KEY.var, VAR_OPTIONS_KEY.fixed].includes(optionKey)) {
      if (!value || !fnList.length) {
        getPreviewTextWithEmptyFn().then((text) => {
          setPreviewText(text || "");
        });
        return;
      }
    }
    if (optionKey === VAR_OPTIONS_KEY.ai_value) {
      if (value !== ASSIGNMENT_VALUE_KEY.random && !fnList.length) {
        getPreviewTextWithEmptyFn().then((text) => {
          setPreviewText(text || "");
        });
        return;
      }
    }
    run();
  };

  const environmentMap = useMemo(() => scopeValues(environment), [environment]);

  const { run } = useDebounceFn(
    async () => {
      setPreviewLoading(true);
      try {
        const globals = await getGlobals();

        const customFn = fnList.filter((e) => e.func_name?.startsWith("fn_"));
        const custom_script = customFn.reduce(
          (pre, item) => {
            if (has(functionObj, item.func_name)) {
              pre[item.func_name] = functionObj[item.func_name];
            }
            return pre;
          },
          {} as Record<string, string>,
        );
        const systemMap = mapKeys(SYSTEM_VARS, (_value, key) => `$${key}`);
        const data = await mockExp(
          expression,
          merge(systemMap, globals, environmentMap),
          language,
          custom_script,
        );
        if (isString(data)) {
          setPreviewText(data || "");
        } else if (isObject(data)) {
          setPreviewText(JSON.stringify(data) || "");
        } else {
          setPreviewText(String(data) || "");
        }
      } catch (err) {
        setPreviewText(expression);
      } finally {
        setPreviewLoading(false);
      }
    },
    { wait: 500 },
  );

  const assignmentAiOptions = useMemo(() => {
    return [
      {
        value: propsValue,
        label: t("var_insert.generate_value"),
      },
      {
        value: ASSIGNMENT_VALUE_KEY.random,
        label: t("var_insert.send_random"),
      },
    ];
  }, [propsValue]);

  const dropdownRender = (originNode: ReactNode) => {
    return (
      <div className={styles.treeDropDown}>
        <Tabs
          size="small"
          activeKey={mockTabsKey}
          onChange={(key) => {
            setValue("");
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

  const treeTitleRender: TreeSelectProps["treeTitleRender"] = (
    props: Record<string, any>,
  ) => {
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

  const getFakerJsTreeData = () => {
    const result: TreeSelectProps["treeData"] = [];
    const map: { [key: string]: any } = {};
    const paramsMap: { [key: string]: any } = {};
    const fakerVarList = getFakerObject() || FAKERJS_VAR_LIST;
    let fakerKey: string | undefined = undefined;
    fakerVarList.forEach((item: any) => {
      const { module, function: func, description, params } = item;
      if (!has(map, module)) {
        map[module] = {
          value: module,
          title: module,
          key: module,
          isLeaf: false,
          selectable: false,
          children: [],
        };
        result.push(map[module]);
      }
      map[module].children.push({
        value: `${module}${FAKER_SPLIT_CONST}${func}`,
        key: `${module}${FAKER_SPLIT_CONST}${func}`,
        title: func,
        isLeaf: true,
        selectable: true,
        desc: isPlainObject(description)
          ? description?.[MOCK_LANGUAGE_MAP[language]] || ""
          : description || "",
      });
      if (propsValue === `${module}${FAKER_SPLIT_CONST}${func}`) {
        fakerKey = module;
      }
      if (!isEmpty(params)) {
        paramsMap[`${module}${FAKER_SPLIT_CONST}${func}`] = params;
      }
    });
    setFakerJsParamsMap(paramsMap);
    setFakerJsTreeData(result);

    getDefaultExpand(fakerKey);
  };

  const getDefaultExpand = (fakerKey: string | undefined) => {
    if (fakerKey) {
      setTreeDefaultExpandedKeys([fakerKey]);
    }
  };

  const mockTreeData: TreeSelectProps["treeData"] = useMemo(() => {
    return fakerJsTreeData;
  }, [mockTabsKey, fakerJsTreeData]);

  const mockDescMap = useMemo(() => {
    return mockTreeData?.reduce(
      (pre, item) => {
        item.children?.forEach((e: { value?: string; desc?: string }) => {
          if (e.value) {
            pre[e.value] = e.desc || "";
          }
        });
        return pre;
      },
      {} as Record<string, string>,
    );
  }, [mockTreeData]);

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
          arrow={false}
          autoAdjustOverflow={false}
          placement="bottom"
        >
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
            setValue(e);
            if (mockTabsKey === MOCK_TABS_KEY.faker) {
              setFakerJsParamList([]);
            }
          }}
          open={treeOpen}
          onDropdownVisibleChange={(v) => setTreeOpen(v)}
          triggerClassName={styles.selectTrigger}
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

  const funcCancel = (v?: FuncListRenderItem) => {
    if (v) {
      if (isNumber(editIndex)) {
        const arr = cloneDeep(fnList);
        arr.splice(editIndex, 1, v);
        setFnList(arr);
      } else {
        setFnList(concat(fnList, v));
      }
    }
    setFuncOpen(false);
  };

  const confirm = (action: InsertAction) => {
    if ([VAR_OPTIONS_KEY.ai_desc, VAR_OPTIONS_KEY.desc].includes(optionKey)) {
      onChange(value, action);
    } else {
      onChange(expression, action);
    }
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
    <div className={classNames(styles.container, _props?.className)}>
      <Flex justify="space-between" align="center">
        <Flex
          onClick={() => stepChange({ step: 1, key: optionKey })}
          className={[styles.title, styles.cursor].join(" ")}
          gap={8}
          align="center"
        >
          <AppIcon rotate={90} icon="download" className={styles.icon} />
          <span>{OPTIONS_KEY_MAP[optionKey]}</span>
        </Flex>
        <AppIcon
          onClick={() => setOpen?.(false)}
          className={classNames(styles.cursor, styles.icon)}
          icon="circle-x"
        />
      </Flex>
      {[VAR_OPTIONS_KEY.desc, VAR_OPTIONS_KEY.ai_desc].includes(optionKey) ? (
        <Flex flex={1} style={{ width: "100%", overflowY: "auto" }}>
          {optionKey === VAR_OPTIONS_KEY.desc ? (
            <Flex vertical className={styles.descList}>
              {size(descriptionList) ? (
                descriptionList.map((item) => (
                  <div
                    onClick={() => {
                      setDescHoverIndex(item.id);
                      setValue(item.description);
                    }}
                    className={classNames(styles.descItem, {
                      [styles.active]: item.id === descHoverIndex,
                    })}
                    key={item.id}
                  >
                    {item.description}
                  </div>
                ))
              ) : (
                <Empty wrapStyle={{ width: "100%" }} />
              )}
            </Flex>
          ) : (
            <Flex gap={8} vertical className={styles.descAi}>
              <Flex gap={4} vertical>
                <span className={styles.descAiTitle}>
                  {t("var_insert.current_key")}
                </span>
                <span className={styles.descAiKey}>''</span>
              </Flex>
              <Flex gap={4} vertical>
                <span
                  className={[styles.descAiTitle, styles.refresh].join(" ")}
                >
                  <span>{t("settings.description.param_desc")}</span>
                  <span onClick={fixedRefresh} className={styles.paramsRefresh}>
                    <AppIcon icon="refresh-cw" className={styles.icon} />
                    {t("base.refresh")}
                  </span>
                </span>
                <BaseInput.TextArea
                  value={value}
                  onChange={(e) => setValue(e?.target?.value)}
                  maxLength={1024}
                  autoSize={{ minRows: 8, maxRows: 18 }}
                  inputClassName={styles.input}
                />
              </Flex>
            </Flex>
          )}
        </Flex>
      ) : (
        <Flex gap={8} style={{ overflowY: "auto" }} flex={1} vertical>
          <Flex gap={8} vertical>
            <span className={styles.inputLabel}>
              {OPTIONS_KEY_LABEL_MAP[optionKey]}
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
                  onBlur={(e) => {
                    const v = (e?.target as any)?.value?.trim();
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
                  popupMatchSelectWidth={320}
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
                  onBlur={(e) => {
                    const v = (e?.target as any)?.value?.trim();
                    if (!v) {
                      setFormatInfo({
                        ...formatInfo,
                        utc: defaultUtcOffset,
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
                  placement="bottomRight"
                  popupMatchSelectWidth={320}
                  options={timeZoneOptions}
                  triggerClassName={styles.selectTrigger}
                  className={styles.select}
                />
              </Flex>
            </Flex>
          )}

          {value ? (
            <Flex gap={4} className={styles.fnList} vertical>
              {size(fnList) ? (
                <div className={styles.listContent}>
                  {map(fnList, (item, index) => (
                    <Flex
                      gap={4}
                      className={styles.listContentItem}
                      justify="space-between"
                      onMouseOver={() => setHoverIndex(index)}
                      onMouseOut={() => setHoverIndex(null)}
                    >
                      <div
                        onClick={() => {
                          if (!has(fnKeyMap, item.func_name)) {
                            return;
                          }
                          setEditIndex(index);
                          setEditFn({ ...item });
                          setFuncOpen(true);
                        }}
                        className={classNames(styles.name, {
                          [styles.del]: !has(fnKeyMap, item.func_name),
                        })}
                      >
                        {transFuncName(item.func_name, item.paras)}
                      </div>
                      <Flex gap={4} className={styles.desc} align="center">
                        <span>
                          {item?.func_desc ||
                            fnKeyMap?.[item.func_name]?.func_desc ||
                            ""}
                        </span>
                        {index === hoverIndex ? (
                          <AppIcon
                            onClick={() => {
                              const arr = cloneDeep(fnList);
                              arr.splice(index, 1);
                              setFnList(arr);
                            }}
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
              ) : (
                ""
              )}
              <Button
                size="small"
                mode="light"
                type="primary"
                onClick={() => {
                  setEditIndex(undefined);
                  setEditFn(defaultFnItem);
                  setFuncOpen(true);
                }}
                icon={<AppIcon icon="plus" className={styles.icon} />}
              >
                {t("var_insert.add_fn")}
              </Button>
            </Flex>
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
      <FunctionModal editFn={editFn} onCancel={funcCancel} open={funcOpen} />
      <Flex gap={16} vertical className={styles.footer}>
        {value &&
          ![VAR_OPTIONS_KEY.desc, VAR_OPTIONS_KEY.ai_desc].includes(
            optionKey,
          ) && (
            <Flex gap={8} className={styles.footerPreview} vertical>
              <span className={styles.previewTip}>
                <span>{t("common.assertion.expression.title")}</span>
              </span>
              <div className={styles.previewContent}>
                <span className={styles.previewContentText}>
                  <Tooltip placement="topLeft" title={expression}>
                    {expression}
                  </Tooltip>
                </span>
                <AppIcon
                  onClick={() =>
                    copyStringToClipboard(expression, () =>
                      message.success(t("supplement.copy_success")),
                    )
                  }
                  icon="copy"
                  className={styles.icon}
                />
              </div>
              <span className={styles.previewTip}>
                <Flex gap={4}>
                  {t("common.api_tab.preview")}
                  <span
                    onClick={updatePreviewText}
                    className={styles.previewRefresh}
                  >
                    <AppIcon icon="refresh-cw" className={styles.icon} />
                  </span>
                </Flex>
              </span>
              <Spin spinning={previewLoading}>
                <div className={styles.previewContent}>
                  <span className={styles.previewContentText}>
                    <Tooltip placement="topLeft" title={previewText}>
                      {previewText}
                    </Tooltip>
                  </span>
                  <AppIcon
                    onClick={() =>
                      copyStringToClipboard(previewText, () =>
                        message.success(t("supplement.copy_success")),
                      )
                    }
                    icon="copy"
                    className={styles.icon}
                  />
                </div>
              </Spin>
            </Flex>
          )}
        <Flex gap={12} className={styles.footerBth}>
          {optionKey === VAR_OPTIONS_KEY.desc && <></>}
          {(isEdit &&
            [
              VAR_OPTIONS_KEY.var,
              VAR_OPTIONS_KEY.mock,
              VAR_OPTIONS_KEY.fixed,
              VAR_OPTIONS_KEY.ai_value,
            ].includes(optionKey)) ||
          isInsertDynamic ? (
            <Flex style={{ width: "100%" }} justify="flex-end">
              <Button
                disabled={!value}
                size="small"
                type="primary"
                onClick={() => confirm(InsertAction.confirm)}
              >
                {t("common.confirm")}
              </Button>
            </Flex>
          ) : (
            <>
              <Button
                disabled={!value}
                onClick={() => confirm(InsertAction.replace)}
                size="small"
              >
                {t("var_insert.replace")}
              </Button>
              <Button
                disabled={!value}
                onClick={() => confirm(InsertAction.insert)}
                size="small"
              >
                {t("var_insert.insert")}
              </Button>
            </>
          )}
        </Flex>
      </Flex>
    </div>
  );
};

export default forwardRef(Index);
