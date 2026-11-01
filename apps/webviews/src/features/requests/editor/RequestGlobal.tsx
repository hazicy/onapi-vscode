import { httpEventSchema } from "@onapi/domain/requests/record";
import RequestTabs from "@/features/requests/components/RequestTabs";
import { HttpParameterTable } from "@/shared/components/RequestTable/RequestTable";
import RequestAuth from "./Request/Auth/Auth";
import RequestScripts from "./Request/RequestScripts";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import styles from "./RequestGlobal.module.css";
import type { FolderEditorRecord } from "@onapi/domain/requests/record";

type CollectionSettings = {
  auth?: FolderEditorRecord["auth"];
  event?: unknown[];
  variable?: FolderEditorRecord["variable"];
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
    <RequestTabs
      defaultActiveKey={
        defaultTabKey === "preRequest" || defaultTabKey === "postResponse"
          ? "Scripts"
          : defaultTabKey === "Auth"
            ? "Auth"
            : "Params"
      }

      items={[
        {
          key: "Params",
          label: t("global_setting.public_config.variables"),
          children: (
            <HttpParameterTable
              tabType="query"
              dataSource={(item.variable || []).map((variable) => ({
                ...variable,
                value:
                  typeof variable.value === "string"
                    ? variable.value
                    : variable.value === null || variable.value === undefined
                      ? ""
                      : JSON.stringify(variable.value),
              }))}
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
