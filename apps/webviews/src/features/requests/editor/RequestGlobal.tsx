import { httpEventSchema } from "@onapi/domain/requests/record";
import LineTabs from "@/shared/components/LineTabs/LineTabs";
import { HttpParameterTable } from "@/shared/components/RequestTable/RequestTable";
import RequestAuth from "./Request/Auth/Auth";
import RequestScripts from "./Request/RequestScripts";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import tabStyles from "@/shared/components/LineTabs/LineTabs.module.css";
import styles from "./RequestGlobal.module.css";
import type {
  ItemGroupDefinition,
  VariableDefinition,
} from "postman-collection";

type CollectionSettings = ItemGroupDefinition & {
  variable?: VariableDefinition[];
};
export default function RequestGlobal<T extends CollectionSettings>({
  item,
  onItemChange: change,
  defaultTabKey,
}: {
  item: T;
  onItemChange: (item: T) => void;
  defaultTabKey?: string;
}) {
  const { t } = useTranslation();
  const [listen, setListen] = useState(
    defaultTabKey === "postResponse" ? "test" : "prerequest",
  );
  return (
    <LineTabs
      defaultActiveKey={
        defaultTabKey === "preRequest" || defaultTabKey === "postResponse"
          ? "Scripts"
          : defaultTabKey === "Auth"
            ? "Auth"
            : "Params"
      }
      tabListClassName={tabStyles.selectionList}
      items={[
        {
          key: "Params",
          label: t("global_setting.public_config.variables"),
          children: (
            <HttpParameterTable
              tabType="query"
              dataSource={item.variable || []}
              onChange={(variable) => change({ ...item, variable })}
            />
          ),
        },
        {
          key: "Auth",
          label: t("global_setting.public_config.auth"),
          children: (
            <RequestAuth
              value={item.auth}
              onChange={(_, auth) => change({ ...item, auth })}
            />
          ),
        },
        {
          key: "Scripts",
          label: t("global_setting.public_config.scripts"),
          children: (
            <div className={styles.scripts}>
              <div
                className={styles.scriptSwitch}
                role="group"
                aria-label={t("global_setting.public_config.scripts")}
              >
                {["prerequest", "test"].map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={listen === value}
                    onClick={() => setListen(value)}
                  >
                    {t(
                      `global_setting.public_config.${value === "test" ? "post_response" : "pre_request"}`,
                    )}
                  </button>
                ))}
              </div>
              <RequestScripts
                key={listen}
                listen={listen}
                events={httpEventSchema.array().parse(item.event || [])}
                onChange={(event) => change({ ...item, event })}
              />
            </div>
          ),
        },
      ]}
    />
  );
}
