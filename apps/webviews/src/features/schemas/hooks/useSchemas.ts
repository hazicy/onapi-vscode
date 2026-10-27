import useProjectSetting from "@/features/project/store/useProjectSetting";
import { EditFormat } from "@/shared/utils/editFormat";
import { parseModelToJsonSchema } from "@/features/schemas/utils/data-model";
import { useMemoizedFn } from "ahooks";
import { message } from "@/shared/ui/base";
import { cloneDeep, isObject } from "lodash";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { mockInfo, mockList, mockInnerList } = useProjectSetting.getState();
  const { t } = useTranslation();
  const getProxyMockRulesList = () => {
    const mockConfig = mockInfo || {};
    const mock_rule_switch = mockConfig?.mock_rule_switch === 1 ? 1 : -1;

    let result = mockList;
    if (mock_rule_switch === 1) {
      result = result.concat(mockInnerList);
    }

    return result?.map((e) => ({
      ...e,
      type: e?.field_type,
      mock: e?.mock_rule_content,
    }));
  };

  const handleViewSchemaText = useMemoizedFn(async (dataModel) => {
    const schema = await parseModelToJsonSchema(dataModel, [], {});
    const schemaData = cloneDeep(schema);
    if (!isObject(schemaData)) {
      return;
    }
    const mock_rules = getProxyMockRulesList();
    try {
      const { default: MockSchema } =
        await import("@onapi/http-model/mock/schema");
      const mockData = await new (MockSchema as any)({ app: "onapi" }).mock(
        schemaData,
        mock_rules,
      );

      if (isObject(mockData)) {
        const beautifyText = (await EditFormat(JSON.stringify(mockData))).value;
        return beautifyText;
      } else {
        return mockData;
      }
    } catch (error) {
      message.error(t("supplement.parse_err"));
      return "";
    }
  });

  return { getProxyMockRulesList, handleViewSchemaText };
};

export default Index;
