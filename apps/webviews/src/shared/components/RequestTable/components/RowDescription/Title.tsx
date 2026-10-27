import { FC, memo } from "react";
import { useTranslation } from "react-i18next";

import { Flex } from "@/shared/ui/base";

import { isEqual } from "lodash";

import { RequestTableProps } from "../../types";

interface Props {
  onAiModal: () => void;
  tabType?: RequestTableProps["tabType"];
  setOpen: (open: boolean) => void;
}

const RowDescriptionTitle: FC<Props> = memo(({ tabType }) => {
  const { t } = useTranslation();

  if (isEqual(tabType, "event")) {
    return t("ws.request.description");
  }

  return (
    <Flex align="center" justify="space-between" style={{ minWidth: 170 }}>
      <span>{t("common.request_table.param_desc")}</span>
      <span style={{ height: 26, width: 50 }}></span>
    </Flex>
  );
});

export default RowDescriptionTitle;
