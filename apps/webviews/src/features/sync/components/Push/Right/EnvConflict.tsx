import { useTranslation } from "react-i18next";
import { Button, Flex, Radio, Space, Typography } from "@/shared/ui/base";
import { PushEnvData } from "../type";

type PushRightProps = {
  handleFix: any;
  pushEnvData: Partial<PushEnvData>;
  updatePushEnvData: (key: string, value: any) => void;
  handlePushCancel: () => void;
};

const EnvConflict = (props: PushRightProps) => {
  const { handleFix, pushEnvData, updatePushEnvData, handlePushCancel } = props;
  const { t } = useTranslation();

  return (
    <>
      <Flex
        style={{ padding: 8, background: "var(--search-bg-color)" }}
        align="center"
      >
        <Typography.Text>
          <Typography.Text style={{ color: "#FF583E", marginRight: 4 }}>
            {pushEnvData?.conflictItems?.length || 0}
          </Typography.Text>
          merge conflicts have been identified in the Environment. How would you
          like to resolve them?
        </Typography.Text>
      </Flex>
      <Radio.Group
        onChange={(e) => {
          updatePushEnvData("conflictType", e.target.value);
        }}
        value={pushEnvData?.conflictType}
      >
        <Space direction="vertical">
          <Radio value={"local"}>Apply Local Data</Radio>
          <Radio value={"cloud"}>Use Cloud Data</Radio>
          <Radio value={"mergeLocal"}>
            Merge data, use local data for conflicting fields
          </Radio>
          <Radio value={"mergeCloud"}>
            Merge data and use cloud data for conflicting fields
          </Radio>
        </Space>
      </Radio.Group>
      <Flex justify="end" gap={12}>
        <Button onClick={handlePushCancel}>{"Cancel"}</Button>
        <Button type="primary" onClick={handleFix}>
          Fix {pushEnvData?.conflictCheckedKeys?.length || 0} Conflicts
        </Button>
      </Flex>
    </>
  );
};
export default EnvConflict;
