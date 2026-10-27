import styles from "../GraphQLQuery.module.css";
import {
  forwardRef,
  useContext,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { useTranslation } from "react-i18next";

import { Button, Flex, Field, Input, Select, message } from "@/shared/ui/base";

import {
  PropertyPath,
  concat,
  entries,
  filter,
  find,
  get,
  groupBy,
  has,
  isArray,
  isEmpty,
  isEqual,
  isPlainObject,
  keys,
  setWith,
  some,
} from "lodash-es";

import GraphQLSchemaProvider from "@/features/requests/graphql/GraphQLQuery/context/GraphQLSchemaProvider";
import { AppIcon } from "@/shared/ui";

interface Props {
  onCancel?: () => void;
  data?: any[];
  open: boolean;
  path: string;
}
const Filters = (props: Props, ref: any) => {
  const { t } = useTranslation();
  const { onCancel, data: _data, open, path } = props || {};
  type Argument = {
    id: string;
    name?: string;
    operation?: string;
    value?: any;
  };
  const [args, setArgs] = useState<Argument[]>([]);
  const resetArgs = (items: Omit<Argument, "id">[] = []) =>
    setArgs(items.map((item) => ({ ...item, id: crypto.randomUUID() })));
  const updateArg = (id: string, patch: Partial<Argument>) =>
    setArgs((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  const [independent, setIndependent] = useState(false);
  const [nameOptions, setNameOptions] = useState<any[]>([]);
  const [operaOptions, setOperaOptions] = useState<any>({});
  const [filterItem, setFilterItem] = useState<any>({});
  const { filterData, setFilterData, refreshCheck } = useContext(
    GraphQLSchemaProvider,
  );

  useEffect(() => {
    if (open) {
      init();
    }
  }, [open]);

  const getList = (obj: any, name: string) => {
    return entries(obj).map(([key, value]) => ({
      name,
      operation: key,
      value,
    }));
  };

  const init = () => {
    const filterArgs = find(_data, (e: any) => has(e, "inputObjects"));
    setFilterItem(filterArgs);
    if (filterArgs) {
      if (isArray(filterArgs?.inputObjects)) {
        setIndependent(false);
        const { nameOptions = [], operations = {} } =
          filterArgs.inputObjects.reduce(
            (
              pre: {
                nameOptions: { value: any; label: any }[];
                operations: any;
              },
              item: { name: PropertyPath; operations: any },
            ) => {
              if (item.name && item.operations) {
                pre.nameOptions.push({
                  value: item.name,
                  label: item.name,
                });
                setWith(pre.operations, item.name, item.operations, Object);
              }
              return pre;
            },
            {
              nameOptions: [],
              operations: {},
            },
          );
        setNameOptions(nameOptions);
        setOperaOptions(operations);
        const data = filterData[path]?.find((item: any) =>
          isEqual(item.name, filterArgs.name),
        );
        if (
          get(filterData, path) &&
          data &&
          !isEmpty(data?.value) &&
          isPlainObject(data?.value)
        ) {
          const args = keys(data?.value).reduce((pre, key) => {
            pre = concat(pre, getList(data?.value[key], key));
            return pre;
          }, [] as any[]);
          resetArgs(args);
        } else {
          resetArgs([{}]);
        }
      }
    } else {
      setIndependent(true);
      if (get(filterData, path)) {
        resetArgs(filterData[path]);
      } else {
        resetArgs(_data?.map((item) => ({ name: item.name, value: "" })));
      }
    }
  };

  useImperativeHandle(ref, () => {
    return {
      init,
    };
  });

  const onFinish = (values: any) => {
    if (filterItem && !independent) {
      const groupedByFields = groupBy(
        filter(values?.args, (e) => e.name && e.operation),
        (item) => `${item.name}-${item.operation}`,
      );
      const hasRepeat = some(groupedByFields, (group) => group.length > 1);
      if (hasRepeat) {
        message.error(t("graphql.finish_tip"));
        return;
      }
      const argValue = values?.args?.reduce(
        (pre: any, item: any) => {
          if (item.name) {
            if (has(pre.value, item.name)) {
              const i = pre.value[item.name];
              pre.value[item.name] = {
                ...i,
              };
              if (item.operation) {
                setWith(
                  pre.value,
                  [item.name],
                  { ...i, [item.operation]: item.value },
                  Object,
                );
              }
            } else {
              setWith(
                pre.value,
                [item.name],
                { [item.operation || ""]: item.value },
                Object,
              );
            }
          }
          return pre;
        },
        {
          value: {},
        },
      );
      const d = {
        ...filterData,
        [path]: [
          {
            name: filterItem?.name || "",
            value: argValue?.value,
          },
        ],
      };
      setFilterData(d);
      refreshCheck(d);
    } else {
      setFilterData({
        ...filterData,
        [path]: values?.args || undefined,
      });
      refreshCheck({
        ...filterData,
        [path]: values?.args || undefined,
      });
    }

    onCancel?.();
  };

  const clearCondition = () => {
    resetArgs(
      independent
        ? _data?.map((item) => ({ name: item.name, value: "" }))
        : [{}],
    );
  };

  const submit = () => onFinish({ args: args.map(({ id, ...item }) => item) });

  return (
    <Flex vertical gap={12} className={styles.filter}>
      <Flex style={{ overflowY: "auto" }} flex={1}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          style={{
            width: 600,
            background: "var(--color-bg-page)",
            borderRadius: "var(--border-radius)",
            padding: 8,
            paddingBottom: 0,
            overflowY: "auto",
          }}
          autoComplete="off"
        >
          {args.map((arg) => (
            <Flex key={arg.id} gap={8} align="baseline">
              <Flex flex={independent ? 0.2 : 0.4}>
                <Field style={{ width: "100%" }}>
                  {independent ? (
                    <Input
                      readOnly
                      value={arg.name ?? ""}
                      placeholder={t("supplement.input_tip")}
                      inputClassName={styles.input}
                      affixClassName={styles.inputAffixWrapper}
                    />
                  ) : (
                    <Select
                      value={arg.name}
                      options={nameOptions}
                      placeholder={t("common.select_tip")}
                      onChange={(name: string) =>
                        updateArg(arg.id, {
                          name,
                          operation: undefined,
                          value: undefined,
                        })
                      }
                    />
                  )}
                </Field>
              </Flex>
              {!independent && (
                <Flex flex={0.2}>
                  <Field style={{ width: "100%" }}>
                    <Select
                      value={arg.operation}
                      fieldNames={{ value: "name", label: "name" }}
                      options={get(operaOptions, arg.name ?? "") || []}
                      placeholder={t("common.select_tip")}
                      onChange={(operation: string) =>
                        updateArg(arg.id, { operation, value: undefined })
                      }
                    />
                  </Field>
                </Flex>
              )}
              <Flex flex={independent ? 0.8 : 0.4}>
                <Field style={{ width: "100%" }}>
                  {!independent &&
                  ["in", "nin"].includes(arg.operation ?? "") ? (
                    <Select
                      mode="tags"
                      value={arg.value ?? []}
                      placeholder={t("supplement.input_tip")}
                      onChange={(value: string[]) =>
                        updateArg(arg.id, { value })
                      }
                    />
                  ) : (
                    <Input
                      value={arg.value ?? ""}
                      placeholder={t("supplement.input_tip")}
                      onChange={(event) =>
                        updateArg(arg.id, { value: event.target.value })
                      }
                      inputClassName={styles.input}
                      affixClassName={styles.inputAffixWrapper}
                    />
                  )}
                </Field>
              </Flex>
              {!independent && args.length > 1 && (
                <button
                  type="button"
                  aria-label="Remove condition"
                  className={styles.filterRemove}
                  onClick={() =>
                    setArgs((items) =>
                      items.filter((item) => item.id !== arg.id),
                    )
                  }
                >
                  <AppIcon icon="circle-x" />
                </button>
              )}
            </Flex>
          ))}
          {!independent && (
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() =>
                setArgs((items) => [...items, { id: crypto.randomUUID() }])
              }
              icon={<AppIcon icon="plus" />}
            >
              {t("api.apis_list.filter_modal.add_condition")}
            </Button>
          )}
        </form>
      </Flex>
      <Flex justify={independent ? "flex-end" : "space-between"}>
        {!independent && (
          <Button
            style={{ padding: 0 }}
            type="text"
            size="small"
            className={styles.clearBtn}
            onClick={clearCondition}
            icon={<AppIcon icon="eraser" />}
          >
            {t("api.apis_list.filter_modal.clear_condition")}
          </Button>
        )}

        <Flex align="center" gap={12}>
          <Button onClick={onCancel}>{t("base.cancel")}</Button>
          <Button type="primary" onClick={submit}>
            {t("common.confirm")}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
};

export default forwardRef(Filters);
