import { useTranslation } from "react-i18next";
import { Button, Flex, Radio, Space, Typography } from "@/shared/ui/base";
import { PushApiData } from "../type";

type PushRightProps = {
  handleFix: any;
  pushApiData: Partial<PushApiData>;
  updatePushApiData: (key: string, value: any) => void;
  handlePushCancel: () => void;
};

const ApiConflict = (props: PushRightProps) => {
  const { pushApiData, updatePushApiData, handleFix, handlePushCancel } = props;
  const { t } = useTranslation();

  return (
    <>
      <Flex
        style={{ padding: 8, background: "var(--search-bg-color)" }}
        align="center"
      >
        <Typography.Text>
          <Typography.Text style={{ color: "#FF583E", marginRight: 4 }}>
            {pushApiData?.conflictItems?.length || 0}
          </Typography.Text>
          merge conflicts have been identified in the APIs and Folders. How
          would you like to resolve them?
        </Typography.Text>
      </Flex>
      <Radio.Group
        onChange={(e) => {
          updatePushApiData("conflictType", e.target.value);
        }}
        value={pushApiData?.conflictType}
      >
        <Space direction="vertical">
          <Radio value={"local"}>Apply Local Data</Radio>
          <Radio value={"cloud"}>Use Cloud Data</Radio>
        </Space>
      </Radio.Group>
      <Flex justify="end" gap={12}>
        <Button onClick={handlePushCancel}>{"Cancel"}</Button>
        <Button type="primary" onClick={handleFix}>
          Fix {pushApiData?.conflictCheckedKeys?.length || 0} Conflicts
        </Button>
      </Flex>
    </>
  );
};
export default ApiConflict;
