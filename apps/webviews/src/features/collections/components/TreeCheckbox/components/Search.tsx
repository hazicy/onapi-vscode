import styles from "./Search.module.css";
import { FC, useEffect } from "react";

import { Flex, Input } from "@/shared/ui/base";

import { useDebounce, useSafeState } from "ahooks";
import i18next from "i18next";
import { concat } from "lodash";

import { TreeDataFilterParams } from "@/features/collections/components/Tree/types";
import AppIcon from "@/shared/ui/AppIcon";
import {
  DEFAULT_API_MARK_ENUM,
  DEFAULT_API_MARK_ENUM_ALL_OPTION,
  DEFAULT_API_MARK_ENUM_LIST,
} from "@onapi/http-model/requests/constants/index";

const DEFAULT_API_MARK_LIST = concat(
  [DEFAULT_API_MARK_ENUM_ALL_OPTION],
  DEFAULT_API_MARK_ENUM_LIST,
);

interface Props {
  hasMarkFilter?: boolean;
  searchInputPlaceholder?: string;
  treeDataFilterParams: TreeDataFilterParams;
  setTreeDataFilterParams: (params: TreeDataFilterParams) => void;
}

const Search: FC<Props> = ({
  treeDataFilterParams,
  hasMarkFilter = true,
  searchInputPlaceholder = i18next.t("supplement.folder_api"),
  setTreeDataFilterParams,
}) => {
  const [searchValue, setSearchValue] = useSafeState(
    treeDataFilterParams.value,
  );
  const debouncedSearchValue = useDebounce(searchValue, { wait: 500 });

  useEffect(() => {
    handleChange("value", debouncedSearchValue);
  }, [debouncedSearchValue]);

  const handleChange = (
    field: string,
    value: string | DEFAULT_API_MARK_ENUM,
  ) => {
    setTreeDataFilterParams({
      ...treeDataFilterParams,
      [field]: value,
    });
  };

  return (
    <div className={styles.container}>
      <Flex className={styles.flex}>
        <div className={styles.searchWrap}>
          <Input
            prefix={<AppIcon icon="search" />}
            placeholder={searchInputPlaceholder}
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            suffix={null}
            affixClassName={styles.inputAffixWrapper}
            suffixClassName={styles.inputSuffix}
          />
        </div>
      </Flex>
    </div>
  );
};

export default Search;
