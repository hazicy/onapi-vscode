import styles from "./FakerParamsList.module.css";
/* eslint-disable quotes */
import { useTranslation } from "react-i18next";

import { DatePicker, Flex, Input, InputNumber, Select } from "@/shared/ui/base";

import cn from "classnames";
import dayjs from "dayjs";
import {
  cloneDeep,
  concat,
  endsWith,
  entries,
  filter,
  findIndex,
  has,
  isEqual,
  keys,
  startsWith,
} from "lodash-es";

import { AppIcon, Tooltip } from "@/shared/ui";
import { MOCK_LANGUAGE_MAP } from "@onapi/domain/settings/constants/settings";
import { FAKERJS_BOOLEAN_OPTIONS } from "@/features/variables/constants/variable";
import useSystemConfig from "@/features/settings/store/useSystemConfig";
import { transKey } from "@/features/variables/utils/variable";

interface Props {
  value: any;
  fakerJsParamsMap: Record<string, any>;
  fakerJsParamList: { key: string; value: any }[];
  onChange: (fakerJsParamList: any) => void;
}

const Index = ({
  value,
  fakerJsParamsMap,
  fakerJsParamList,
  onChange,
}: Props) => {
  const { t } = useTranslation();
  const language = useSystemConfig((state) => state.systemConfig.language);
  const paramConfig = fakerJsParamsMap[value];

  const add = (key: string, type: string) => {
    if (isEqual(type, "coordinates")) {
      onChange(concat(fakerJsParamList, [{ key, value: [0, 0] }]));
    } else {
      onChange(concat(fakerJsParamList, [{ key, value: undefined }]));
    }
  };

  const del = (key: string) => {
    onChange(filter(fakerJsParamList, (item) => item?.key !== key));
  };

  const mapOptions = (arr: string[]) =>
    arr.map((item) => ({ label: item, value: item }));

  const handleChange = (key: string, value: any) => {
    const index = findIndex(fakerJsParamList, (item) => item.key === key);
    if (index !== -1) {
      const newList = cloneDeep(fakerJsParamList);
      newList[index].value = value;
      onChange(newList);
    }
  };

  const getCom = ({ key, value }: { key: string; value: any }, params: any) => {
    const type = paramConfig?.[key]?.type;
    const lowerType = type?.toLowerCase();
    if (isEqual(lowerType, "date")) {
      const timeVal = value ? dayjs(value) : undefined;
      return (
        <DatePicker
          value={timeVal}
          showTime
          onChange={(e) => handleChange(key, dayjs(e).format())}
          size="small"
        />
      );
    }
    if (isEqual(lowerType, "number")) {
      const precision = params?.[key]?.precision || 0;
      const max = params?.[key]?.max || undefined;
      const min = params?.[key]?.min || 0;
      return (
        <InputNumber
          size="small"
          onChange={(e) => handleChange(key, e)}
          value={value}
          min={min}
          max={max}
          precision={precision}
          controls={false}
        />
      );
    }
    if (isEqual(lowerType, "boolean")) {
      return (
        <Select
          onChange={(e) => handleChange(key, e)}
          size="small"
          value={value}
          options={mapOptions(FAKERJS_BOOLEAN_OPTIONS)}
          optionClassName={styles.selectItem}
          className={styles.select}
        />
      );
    }
    if (isEqual(lowerType, "string")) {
      return (
        <Input
          maxLength={256}
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          size="small"
        />
      );
    }
    if (isEqual(lowerType, "regexp")) {
      return (
        <Input
          maxLength={256}
          value={value}
          onChange={(e) => handleChange(key, e.target.value)}
          size="small"
        />
      );
    }
    if (isEqual(lowerType, "array")) {
      return (
        <Select
          value={value}
          onChange={(e) => handleChange(key, e)}
          size="small"
          mode="tags"
          optionClassName={styles.selectItem}
          className={styles.select}
        />
      );
    }
    if (isEqual(lowerType, "coordinates")) {
      const latitude = value?.[0];
      const longitude = value?.[1];
      const coordinatesChange = (index: number, key: string, e: number) => {
        const newVal = cloneDeep(value);
        newVal[index] = e;
        handleChange(key, newVal);
      };
      return (
        <Flex vertical gap={2}>
          <InputNumber
            size="small"
            onChange={(e) => coordinatesChange(0, key, e ?? latitude)}
            value={latitude}
            min={-180}
            max={180}
            precision={5}
            placeholder={t("var_insert.latitude")}
            controls={false}
          />
          <InputNumber
            size="small"
            onChange={(e) => coordinatesChange(1, key, e ?? longitude)}
            value={longitude}
            min={-180}
            max={180}
            precision={5}
            placeholder={t("var_insert.longitude")}
            controls={false}
          />
        </Flex>
      );
    }
    if (startsWith(type, "enum(") && endsWith(type, ")")) {
      const options = type
        ?.substring(5, type?.length - 1)
        ?.split("|")
        ?.map((v: string) => ({
          title: v.trim(),
          value: v.trim(),
        }));
      return (
        <Select
          value={value}
          onChange={(e) => handleChange(key, e)}
          size="small"
          options={options}
          optionClassName={styles.selectItem}
          className={styles.select}
        />
      );
    }
    if (startsWith(type, "enums(") && endsWith(type, ")")) {
      const options = type
        ?.substring(6, type?.length - 1)
        ?.split("|")
        ?.map((v: string) => ({
          title: v.trim(),
          value: v.trim(),
        }));
      return (
        <Select
          value={value}
          mode="multiple"
          onChange={(e) => handleChange(key, e)}
          size="small"
          options={options}
          optionClassName={styles.selectItem}
          className={styles.select}
        />
      );
    }
    return (
      <Input
        maxLength={256}
        value={value}
        onChange={(e) => handleChange(key, e.target.value)}
        size="small"
      />
    );
  };

  return (
    <>
      <div>{t("var_insert.param_config")}</div>
      <Flex vertical className={styles.container}>
        {fakerJsParamList?.length ? (
          <div
            className={cn(styles.param, {
              [styles.footer]:
                fakerJsParamList?.length ===
                keys(fakerJsParamsMap[value]).length,
            })}
          >
            {fakerJsParamList.map((item) => {
              const params = fakerJsParamsMap?.[value];
              const desc = has(params, item.key)
                ? params?.[item.key]?.description?.[MOCK_LANGUAGE_MAP[language]]
                : "";
              return (
                <div className={styles.paramItem}>
                  <div className={styles.paramContent}>
                    <span className={styles.paramItemDesc}>
                      <Tooltip title={desc}>{transKey(item.key)}</Tooltip>
                    </span>
                    <div className={styles.paramItemCom}>
                      {getCom(item, params)}
                    </div>
                  </div>
                  <AppIcon
                    className={styles.paramItemDel}
                    style={{ color: "#ff583e", cursor: "pointer" }}
                    onClick={() => del(item.key)}
                    icon="circle-x"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          ""
        )}

        <div className={styles.selection}>
          {entries(fakerJsParamsMap[value]).map(([key, v]: any) => {
            const newKey = transKey(key);
            if (fakerJsParamList?.find((it) => it?.key === key)) {
              return "";
            }
            return (
              <Tooltip title={v?.description?.[MOCK_LANGUAGE_MAP[language]]}>
                <span
                  onClick={() => add(key, v?.type)}
                  className={styles.selectItem}
                >
                  {newKey}
                </span>
              </Tooltip>
            );
          })}
        </div>
      </Flex>
    </>
  );
};

export default Index;
