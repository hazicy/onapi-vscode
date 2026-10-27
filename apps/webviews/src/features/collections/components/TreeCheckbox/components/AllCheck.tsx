import styles from "./AllCheck.module.css";
import { FC, Key, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Checkbox, CheckboxProps } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import { includes, reduce, size } from "lodash-es";

import { TreeDataItem } from "@onapi/domain/requests/types/api";

import i18next from "i18next";

interface Props {
  dataSource: {
    [key: string]: TreeDataItem;
  };
  treeData: any[];
  filteredTreeList: TreeDataItem[];
  checkedKeys: Key[];
  checkKey?: string;
  setCheckedKeys: (args: Key[]) => void;
  notCalcCheckedTypes: string[];
  allCheckDesc?: string;
}

const AllCheck: FC<Props> = ({
  dataSource,
  filteredTreeList,
  checkKey,
  checkedKeys,
  setCheckedKeys,
  notCalcCheckedTypes,
  allCheckDesc = i18next.t("common.push_tip"),
}) => {
  const { t } = useTranslation();
  const [checked, setChecked] = useSafeState(false);

  useEffect(() => {
    setChecked(size(checkedKeys) === size(filteredTreeList));
  }, [checkedKeys, filteredTreeList]);

  const calcCheckTotal = useMemo(() => {
    if (!dataSource) {
      return 0;
    }

    return reduce(
      checkedKeys,
      (pre, cur) => {
        if (!includes(notCalcCheckedTypes, dataSource[cur as string]?.kind)) {
          return pre + 1;
        }
        return pre;
      },
      0,
    );
  }, [checkedKeys, dataSource]);

  const handleChange: CheckboxProps["onChange"] = (event) => {
    const value = event.target.checked;

    if (value) {
      setCheckedKeys(filteredTreeList.map((item) => item[checkKey || "id"]));
    } else {
      setCheckedKeys([]);
    }

    setChecked(value);
  };

  return (
    <div className={styles.container}>
      <Checkbox
        checked={checked}
        onChange={handleChange}
        className={styles.checkbox}
      >
        <span className={styles.allCheckText}>{t("common.select_all")}</span>
        {allCheckDesc && (
          <span className={styles.allCheckDesc}>{allCheckDesc}</span>
        )}
      </Checkbox>
    </div>
  );
};

export default AllCheck;
