import styles from "./ShareList.module.css";

import { AppIcon } from "@/shared/ui";
import { Flex, Input, Typography } from "@/shared/ui/base";

import { useSafeState } from "ahooks";
import useDocsData from "./hooks/useDocsData";
import useShare from "@/features/sharing/store/useShare";
import useApis from "@/features/requests/store/useApis";

import type { EditorRecord as ApiDetailsData } from "@onapi/domain/requests/record";



import SharePanel from "./components/SharePanel";

const SharePage = () => {
  const [searchValue, setSearchValue] = useSafeState("");

  const shareData = useShare((state) => state.shareData);
  const apiOriginDetailsList = useApis((store) => store.apiOriginDetailsList);
  const { filteredShareList } = useDocsData({
    searchIncludesField: ["name", "url"],
    dataSource: apiOriginDetailsList,
    treeDataFilterParams: {
      value: searchValue,
    },
    shareData,
  });

  

  

  

  return (
    <div className={styles.container}>
      <Flex justify="space-between" className={styles.flex}>
        <Typography.Text
          style={{
            fontSize: 16,
            fontWeight: 600,
            color: "var(--font-title-color)",
          }}
        >
          Share List
        </Typography.Text>
        <Input
          prefix={<AppIcon icon="search" />}
          placeholder={"Search by keywords"}
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          style={{ width: "240px" }}
        />
      </Flex>
      <SharePanel
        searchValue={searchValue}
        shareList={filteredShareList}
        activeTab={""}
        menuType={"share"}
      />
    </div>
  );
};

export default SharePage;
