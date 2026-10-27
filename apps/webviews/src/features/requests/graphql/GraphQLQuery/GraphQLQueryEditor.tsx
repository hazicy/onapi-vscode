import styles from "./GraphQLQuery.module.css";
import {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Flex, Spin, TreeProps, message } from "@/shared/ui/base";

import {
  useDebounceFn,
  useDeepCompareEffect,
  useMemoizedFn,
  useMount,
} from "ahooks";
import { ASTNode, Kind, parse, print } from "graphql";
import { produce } from "immer";
import {
  add,
  assign,
  cloneDeep,
  concat,
  difference,
  filter,
  findIndex,
  forEach,
  get,
  has,
  includes,
  isArray,
  isEmpty,
  isEqual,
  map,
  mergeWith,
  size,
  some,
  startsWith,
  union,
  unionBy,
} from "lodash-es";

import GraphQLQueryContext from "@/features/requests/graphql/GraphQLQuery/context/GraphQLQueryContext";
import GraphQLSchemaProvider from "@/features/requests/graphql/GraphQLQuery/context/GraphQLSchemaProvider";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";
import { Button, Empty, AppIcon } from "@/shared/ui";
import useApis from "@/features/requests/store/useApis";

import { FilterDataType } from "@onapi/domain/requests/types/graphql";
import { AnyObject } from "@onapi/domain/types/common";
import { graphql2json } from "@/features/requests/utils/graphql/graphql2json";
import {
  createArguments,
  createOperationDefinition,
} from "@/features/requests/utils/graphql/json2graphql";
import {
  raw2tree,
  transformStructure,
} from "@/features/requests/utils/graphql/schema2tree";

import ResizablePanels from "../../../../shared/components/ResizablePanels/ResizablePanels";
import SuspenseContent from "../../../../shared/components/SuspenseContent";
import SchemaTree from "./components/SchemaTree";

const panelProps = {
  defaultSize: 50,
  minSize: 5,
  collapsible: true,
  collapsedSize: 5,
};

interface Props {
  data: import("@onapi/domain").HttpRequestBody & { mode: "graphql" };
  onChange: (value: Props["data"]) => void;
}

const GraphQLQueryEditor = forwardRef((props: Props, ref) => {
  const { t } = useTranslation();
  const { data, onChange } = props;
  const { apiData } = useContext(GraphQLQueryContext);

  const currentServerId = useApis((state) => state.currentServerId);
  const schemaLoading = useApis((state) => state?.schemaLoading);
  const updateSchemaLoading = useApis((state) => state.updateSchemaLoading);

  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [filterData, setFilterData] = useState<FilterDataType>({});
  const [treeData, setTreeData] = useState<any>([]);

  const variablesPanelRef = useRef<any>(null);
  const searchData = {
    query: "",
    ...data.graphql,
    variables:
      typeof data.graphql?.variables === "string"
        ? data.graphql.variables
        : JSON.stringify(data.graphql?.variables || {}),
  };
  const querySchema = apiData.graphqlSchema;

  useImperativeHandle(ref, () => ({
    resetRawLayout: (layout: any) => {
      variablesPanelRef?.current?.setPanelGroupLayout(layout);
    },
  }));

  useMount(() => {
    if (!searchData.query) {
      return;
    }
    rawToTree(searchData.query);
  });

  useDeepCompareEffect(() => {
    try {
      const { tree } = raw2tree(querySchema || {});
      setTreeData(tree.Query ? [tree.Query] : []);
      rawToTree(searchData.query);
    } catch (err) {
      setTreeData([]);
    }
  }, [querySchema]);

  const getKeys = (arr: any[], prefix: string = "") => {
    return arr.reduce(
      (pre, item) => {
        if (!item.children) {
          pre.keys.push(`${prefix ? `${prefix}.` : ""}${item.name}`);
        } else {
          const { keys, filterData } = getKeys(
            item.children,
            `${prefix ? `${prefix}.` : ""}${item.name}`,
          );
          pre.keys = concat(pre.keys, keys);
          pre.filterData = assign(pre.filterData, filterData);
        }
        if (item.arguments) {
          pre.filterData[`${prefix ? `${prefix}.` : ""}${item.name}`] =
            item.arguments;
        }
        return pre;
      },
      {
        keys: [],
        filterData: {},
      },
    );
  };

  const getNewKeys = (keys: string[]) => {
    const list = keys?.reduce(
      (pre, k) => {
        if (includes(k, ".")) {
          const res = getPartialStrings(k);
          pre = union(pre.concat(res));
        }
        return pre;
      },
      [...keys],
    );
    const keySet = new Set(list);
    let highestLevel = 1;
    forEach(list, (str) => {
      const level = str.split(".").length;
      // The split array length is one more than the number of dots (including empty string or the first part), so this is the correct level
      if (level > highestLevel) {
        highestLevel = level;
      }
    });
    const filterChildrenKeys = (children: any, level = 0) => {
      const deepLevel = add(level, 1);
      return children.reduce((acc: any, child: any) => {
        const key = child.key;
        if (keySet.has(key) && level <= highestLevel) {
          acc.push(key);
          if (child.children || has(graphqlObjects, child?.itemKind)) {
            const newChildren = size(child.children)
              ? child.children
              : map(graphqlObjects?.[child?.itemKind]?.children, (e) => ({
                  ...e,
                  key: `${child.key}.${e?.name}`,
                  path: `${child.key}.${e?.name}`,
                  ...(has(graphqlObjects, e?.itemKind)
                    ? { children: [] }
                    : { isLeaf: true }),
                }));
            const keys = filterChildrenKeys(newChildren, deepLevel);
            acc = concat(acc, keys);
          }
        }
        return acc;
      }, []);
    };
    const checkedKeys = filterChildrenKeys(treeData[0]?.children);
    return {
      checkedKeys: size(checkedKeys)
        ? union(concat(["Query"], checkedKeys))
        : checkedKeys,
    };
  };

  const { run: rawToTree } = useDebounceFn(
    (value) => {
      try {
        const data = graphql2json(value);
        const { keys, filterData } = getKeys([data]);
        const { checkedKeys } = getNewKeys(keys);
        setCheckedKeys(checkedKeys);
        setFilterData(filterData);
      } catch (err) {
        setCheckedKeys([]);
        setFilterData({});
      }
    },
    { wait: 200 },
  );

  const filterGraphQLSchema = (schema: any, paths: string[]) => {
    const pathSet = new Set(paths); // Use set for fast lookup
    const filteredChildren = [];
    // Can recursively search here and set a level based on the dot-separated keyList to stop at a certain depth
    let highestLevel = 1;
    forEach(paths, (str) => {
      const level = str.split(".").length;
      if (level > highestLevel) {
        highestLevel = level;
      }
    });

    const filterChildren = (children: any, level = 0) => {
      const deepLevel = add(level, 1);
      return children.reduce((acc: any, child: any) => {
        // Generate the key for the current node
        const key = child.key;

        // Check if the current node is in the path set
        if (pathSet.has(key)) {
          if (child.children || has(graphqlObjects, child?.itemKind)) {
            const newChildren = size(child.children)
              ? child.children
              : map(graphqlObjects?.[child?.itemKind]?.children, (e) => ({
                  ...e,
                  key: `${child.key}.${e?.name}`,
                  path: `${child.key}.${e?.name}`,
                  ...(has(graphqlObjects, e?.itemKind)
                    ? { children: [] }
                    : { isLeaf: true }),
                }));
            const filtered = filterChildren(newChildren, deepLevel);
            if (filtered.length > 0) {
              acc.push({
                ...child,
                children: filtered,
              });
            }
          } else {
            acc.push(child);
          }
        }
        return acc;
      }, []);
    };

    // Filter on Query's children
    filteredChildren.push(...filterChildren(schema.children));

    return {
      ...schema,
      children: filteredChildren,
    };
  };

  const recursiveMerge = (
    qAst: object,
    sAst: object,
    prefix: string,
    checkKeys: string[],
    allKeys: string[],
    backFilterData?: FilterDataType,
  ) => {
    return mergeWith(qAst, sAst, (qValue, sValue, key, object) => {
      if (isEqual(key, "selections") && isArray(qValue) && isArray(sValue)) {
        const arr = unionBy(qValue, sValue, "name.value").reduce(
          (pre, item) => {
            const valueKey = get(item, "name.value");
            const qValueIndex = findIndex(qValue, (e) =>
              isEqual(get(e, "name.value"), valueKey),
            );
            const sValueIndex = findIndex(sValue, (e) =>
              isEqual(get(e, "name.value"), valueKey),
            );
            if (qValueIndex !== -1 && sValueIndex !== -1) {
              const qValueItem = qValue[qValueIndex];
              const sValueItem = sValue[sValueIndex];
              pre.push(
                recursiveMerge(
                  qValueItem,
                  sValueItem,
                  `${prefix}.${valueKey}`,
                  checkKeys,
                  allKeys,
                  backFilterData,
                ),
              );
            } else {
              const item =
                qValueIndex === -1 ? sValue[sValueIndex] : qValue[qValueIndex];
              const itemKey = get(item, "name.value");
              if (allKeys.includes(`${prefix}.${itemKey}`)) {
                if (checkKeys.includes(`${prefix}.${itemKey}`)) {
                  const filterObj = backFilterData || filterData;
                  pre.push({
                    ...item,
                    arguments: has(filterObj, `${prefix}.${itemKey}`)
                      ? createArguments(filterObj[`${prefix}.${itemKey}`])
                      : [],
                  });
                } else if (qValueIndex !== -1) {
                  if (
                    has(item, "selectionSet.selections") &&
                    isArray(get(item, "selectionSet.selections"))
                  ) {
                    const list = getCurrentSelectionsKeys(
                      get(item, "selectionSet.selections"),
                      `${prefix}.${itemKey}`,
                    );
                    const childList = new Set(allKeys);
                    const hasIdNot = some(list, (id) => !childList.has(id));
                    if (hasIdNot) {
                      const childArr = recursiveMerge(
                        item,
                        {
                          selectionSet: {
                            kind: Kind.SELECTION_SET,
                            selections: [],
                          },
                        },
                        `${prefix}.${itemKey}`,
                        checkKeys,
                        allKeys,
                        backFilterData,
                      );
                      pre = concat(pre, childArr);
                    }
                  }
                }
              } else {
                const filterObj = backFilterData || filterData;
                pre.push({
                  ...item,
                  arguments: has(filterObj, `${prefix}.${itemKey}`)
                    ? createArguments(filterObj[`${prefix}.${itemKey}`])
                    : [],
                });
              }
            }
            return pre;
          },
          [],
        );
        return arr;
      }
      if (isEqual(key, "arguments")) {
        const valueKey = get(object, "name.value");
        const filterObj = backFilterData || filterData;
        const pre = backFilterData ? `${prefix}` : `${prefix}.${valueKey}`;
        if (has(filterObj, pre)) {
          return createArguments(filterObj[pre]);
        }
      }
      return undefined;
    });
  };

  const getCurrentSelectionsKeys = (arr: any[], prefix: string) => {
    return arr.reduce((pre, item) => {
      if (
        has(item, "selectionSet.selections") &&
        isArray(get(item, "selectionSet.selections"))
      ) {
        pre = concat(
          pre,
          getCurrentSelectionsKeys(
            get(item, "selectionSet.selections"),
            `${prefix}.${get(item, "name.value")}`,
          ),
        );
      } else {
        pre.push(`${prefix}.${get(item, "name.value")}`);
      }
      return pre;
    }, []);
  };

  const graphqlObjects: AnyObject = useMemo(() => {
    if (has(querySchema, "objects")) {
      return (
        transformStructure({ objects: (querySchema as any)?.objects })
          ?.objects || {}
      );
    }
    return {};
  }, [querySchema]);

  const getPartialStrings = (str: string) => {
    const parts = str.split(".");
    const results = [];

    for (let i = 1; i <= parts.length; i++) {
      results.push(parts.slice(0, i).join("."));
    }

    return results;
  };

  const gerRemoveKeys = (checked: string[], key: string) => {
    if (key.includes(".")) {
      const keysPathList = getPartialStrings(key).reverse().slice(1);
      const keys = keysPathList.reduce(
        (pre, item) => {
          if (!some(pre, (i) => startsWith(i, item) && !isEqual(i, item))) {
            pre = filter(pre, (e) => !startsWith(e, item));
          }
          return pre;
        },
        [...checked],
      );
      return keys;
    }
    return checked;
  };

  const customGetKeys = (checked: string[], e: any) => {
    let keys = [];
    if (e?.checked) {
      const list = checked?.reduce(
        (pre, selectKey) => {
          if (includes(selectKey, ".")) {
            const res = getPartialStrings(selectKey);
            pre = union(pre.concat(res));
          }
          return pre;
        },
        [...checked],
      );
      if (has(graphqlObjects, e?.node?.itemKind)) {
        const children = filter(
          graphqlObjects[e?.node?.itemKind]?.children,
          (i) => !has(graphqlObjects, i?.itemKind),
        );
        const childrenKeys = children?.map((i) => `${e?.node?.key}.${i?.name}`);
        keys = union(concat(list, childrenKeys));
      } else {
        keys = union(list);
      }
    } else {
      if (has(graphqlObjects, e?.node?.itemKind)) {
        const removeList = filter(checked, (i) => startsWith(i, e?.node?.key));
        keys = difference([...checked], removeList);
        keys = gerRemoveKeys(keys, e?.node?.key);
      } else {
        keys = difference([...checked], [e?.node?.key]);
        keys = gerRemoveKeys(keys, e?.node?.key);
      }
    }
    return keys;
  };

  const getAllKeys = (checkKeys: string[]) => {
    let highestLevel = 1;
    let queryKeys = [];
    if (searchData?.query) {
      try {
        const data = graphql2json(searchData?.query);
        const { keys } = getKeys([data]);
        queryKeys = keys;
      } catch (err) {}
    }
    forEach(union(concat(checkKeys, queryKeys)), (str) => {
      const level = str.split(".").length;
      // The split array length is one more than the number of dots (including empty string or the first part), so this is the correct level
      if (level > highestLevel) {
        highestLevel = level;
      }
    });

    const filterAllKeys = (children: any, level = 1) => {
      const deepLevel = add(level, 1);
      return children.reduce((acc: string[], child: any) => {
        const key = child.key;
        acc.push(key);
        if (level <= highestLevel) {
          if (child.children || has(graphqlObjects, child?.itemKind)) {
            const newChildren = size(child.children)
              ? child.children
              : map(graphqlObjects?.[child?.itemKind]?.children, (e) => ({
                  ...e,
                  key: `${child.key}.${e?.name}`,
                  path: `${child.key}.${e?.name}`,
                  ...(has(graphqlObjects, e?.itemKind)
                    ? { children: [] }
                    : { isLeaf: true }),
                }));
            const keys = filterAllKeys(newChildren, deepLevel);
            acc = concat(acc, keys);
          }
        }
        return acc;
      }, []);
    };
    const allKeys = filterAllKeys(treeData);
    return allKeys;
  };

  const onCheck: TreeProps["onCheck"] = ({ checked }: any, e) => {
    const keys = customGetKeys(checked, e);
    setCheckedKeys(keys as string[]);
    try {
      const obj = filterGraphQLSchema(treeData[0], keys as string[]);
      let queryAst: any = {};
      try {
        queryAst = parse(searchData.query);
      } catch (err) {}
      const ast = {
        kind: Kind.DOCUMENT,
        definitions: [createOperationDefinition(obj)],
      };
      const allKeys = getAllKeys(union(keys));
      const mergeAst = recursiveMerge(
        cloneDeep(queryAst),
        cloneDeep(ast),
        "Query",
        union(keys as string[], e?.halfCheckedKeys || []) as string[],
        allKeys,
      );
      const query = print(mergeAst as ASTNode);
      onChangeQueryItem("query", query);
    } catch (err) {}
  };

  const onChangeQueryItem = useMemoizedFn(
    (key: "query" | "variables", val: string) => {
      // Read the committed request even when React has not rendered the previous
      // editor update yet. Independent field changes must preserve each other.
      const active = useApis.getState().apisActiveData;
      const body =
        active?.id === apiData.id ? active.request?.body || data : data;
      const newData = {
        ...body,
        mode: "graphql" as const,
        graphql: { ...body.graphql, [key]: val },
      };
      onChange(newData);
    },
  );

  const getRealUrl = async () => {
    return "";
  };

  const refreshSchema = async () => {
    try {
      updateSchemaLoading(true);

      window?.vscode.postMessage({
        action: "getGraphQLSchema",
        data: {
          apiData,
          currentServerId,
        },
      });
    } catch (error) {
      message.error(t("graphql.refresh_fail"));
    }
  };

  const refreshCheck = (data: FilterDataType) => {
    try {
      const obj = filterGraphQLSchema(treeData[0], checkedKeys);
      let queryAst: any = {};
      try {
        queryAst = parse(searchData.query);
      } catch (err) {}
      const ast = {
        kind: Kind.DOCUMENT,
        definitions: [createOperationDefinition(obj)],
      };
      const allKeys = getAllKeys(checkedKeys);
      const mergeAst = recursiveMerge(
        cloneDeep(queryAst),
        cloneDeep(ast),
        "Query",
        checkedKeys,
        allKeys,
        data,
      );
      const query = print(mergeAst as ASTNode);
      onChangeQueryItem("query", query);
    } catch (err) {}
  };

  return (
    <GraphQLSchemaProvider.Provider
      value={{ filterData, setFilterData, refreshCheck }}
    >
      <div className={styles.main}>
        <ResizablePanels
          panelGroupProps={{
            autoSaveId: "graphql_debug_container_resize_save_id",
            direction: "horizontal",
          }}
          leftPanelProps={{ ...panelProps, collapseTitle: "GraphQL Schema" }}
          rightPanelProps={{ ...panelProps, collapseTitle: "queryEdit" }}
          leftPanel={
            <SuspenseContent>
              <Flex vertical style={{ height: "100%" }}>
                <Flex
                  className={styles.editHeader}
                  align="center"
                  justify="space-between"
                >
                  GraphQL Schema
                  <Button
                    onClick={refreshSchema}
                    type="text"
                    size="small"
                    icon={<AppIcon icon="refresh-cw" />}
                  >
                    {t("base.refresh")}
                  </Button>
                </Flex>
                <Flex flex={1} style={{ height: 0 }}>
                  <Spin
                    spinning={schemaLoading}
                    contentClassName={styles.spinContainer}
                  >
                    {isEmpty(treeData) ? (
                      <Empty
                        footerClassName={styles.emptyFooter}
                        imageClassName={styles.emptyImage}
                        descriptionClassName={styles.emptyDescription}
                      >
                        <Button
                          size="small"
                          onClick={refreshSchema}
                          type="primary"
                          mode="light"
                        >
                          {t("graphql.get_schema")}
                        </Button>
                      </Empty>
                    ) : (
                      <SchemaTree
                        checkable
                        treeData={treeData}
                        setTreeData={setTreeData}
                        querySchema={querySchema}
                        checkedKeys={checkedKeys}
                        onCheck={onCheck}
                        checkStrictly
                      />
                    )}
                  </Spin>
                </Flex>
              </Flex>
            </SuspenseContent>
          }
          rightPanel={
            <SuspenseContent>
              <Spin
                spinning={schemaLoading}
                contentClassName={styles.spinContainer}
              >
                <ResizablePanels
                  ref={variablesPanelRef}
                  panelGroupProps={{
                    autoSaveId:
                      "graphql_debug_queryEdit_container_resize_save_id",
                    direction: "vertical",
                  }}
                  leftPanelProps={{
                    ...panelProps,
                    defaultSize: 70,
                    collapseTitle: "Query",
                  }}
                  rightPanelProps={{
                    ...panelProps,
                    defaultSize: 30,
                    collapseTitle: "Variable",
                  }}
                  leftPanel={
                    <SuspenseContent>
                      <Flex vertical style={{ height: "100%" }}>
                        <Flex
                          className={styles.editHeader}
                          align="center"
                          justify="space-between"
                        >
                          Query
                        </Flex>
                        <Flex flex={1} style={{ height: 0 }}>
                          <CodeEditor
                            onChange={(v) => {
                              onChangeQueryItem("query", v);
                              rawToTree(v);
                            }}
                            language="graphql"
                            value={searchData.query}
                          />
                        </Flex>
                      </Flex>
                    </SuspenseContent>
                  }
                  rightPanel={
                    <SuspenseContent>
                      <Flex vertical style={{ height: "100%" }}>
                        <Flex
                          className={styles.editHeader}
                          align="center"
                          justify="space-between"
                        >
                          Variables
                        </Flex>
                        <Flex flex={1} style={{ height: 0 }}>
                          <CodeEditor
                            onChange={(v) => onChangeQueryItem("variables", v)}
                            language="json"
                            value={searchData.variables}
                          />
                        </Flex>
                      </Flex>
                    </SuspenseContent>
                  }
                />
              </Spin>
            </SuspenseContent>
          }
        />
      </div>
    </GraphQLSchemaProvider.Provider>
  );
});

export default GraphQLQueryEditor;
