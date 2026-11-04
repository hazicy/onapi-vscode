import { useTranslation } from "react-i18next";
import type { SerializedCookie as Cookie } from "@onapi/domain";
import { useEffect, useState } from "react";
import { Flex, Input, Checkbox, message } from "@/shared/ui/base";
import Table from "@/shared/components/BasicTable/BasicTable";
import Button from "@/shared/ui/Button";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { saveProjectConfig } from "@/features/requests/events/env";
import styles from "./CookieManage.module.css";

const emptyCookie = (): Cookie => ({
  key: "",
  value: "",
  domain: "",
  path: "/",
});

export default function CookieManage() {
  const { t } = useTranslation();
  const jar = useProjectConfig(
    (state) => state.http!.options.requester?.cookieJar,
  );
  const [cookies, setCookies] = useState<Cookie[]>(jar?.cookies || []);
  useEffect(() => setCookies(jar?.cookies || []), [jar]);
  const update = (index: number, key: string, value: unknown) =>
    setCookies((previous) => {
      const next = [...previous];
      next[index] = { ...(next[index] || emptyCookie()), [key]: value };
      return next;
    });
  const columns = [
    ...["key", "value", "domain", "path", "expires"].map((key) => ({
      title: t(
        (
          {
            key: "ui.name",
            value: "ui.value",
            domain: "ui.cookie_domain",
            path: "ui.cookie_path",
            expires: "ui.cookie_expires",
          } as Record<string, string>
        )[key],
      ),
      dataIndex: key,
      render: (value: string, _row: Cookie, index: number) => (
        <Input
          value={value || ""}
          onChange={(event) => update(index, key, event.target.value)}
        />
      ),
    })),
    ...["secure", "httpOnly"].map((key) => ({
      title: key,
      dataIndex: key,
      width: 90,
      render: (value: boolean, _row: Cookie, index: number) => (
        <Checkbox
          checked={!!value}
          onChange={(event) => update(index, key, event.target.checked)}
        />
      ),
    })),
    {
      title: "",
      dataIndex: "delete",
      width: 70,
      render: (_value: unknown, _row: Cookie, index: number) => (
        <Button
          onClick={() =>
            setCookies((previous) =>
              previous.filter((_cookie, i) => i !== index),
            )
          }
        >
          {t("ui.delete")}
        </Button>
      ),
    },
  ];
  const save = () => {
    const values = cookies.filter((cookie) => cookie.key);
    if (
      values.some(
        (cookie) =>
          !cookie.domain ||
          !cookie.path ||
          (cookie.expires &&
            cookie.expires !== "Infinity" &&
            !Number.isFinite(Date.parse(cookie.expires))),
      )
    ) {
      message.error(t("ui.cookie_validation"));
      return;
    }
    const state = useProjectConfig.getState();
    const http = {
      ...state.http!,
      options: {
        ...state.http!.options,
        requester: {
          ...state.http!.options.requester,
          cookieJar: {
            ...jar,
            cookies: values.map((cookie) => ({
              ...cookie,
              expires: cookie.expires || "Infinity",
            })),
          },
        },
      },
    };
    state.updateProjectConfig({ http } as any);
    saveProjectConfig("http", http);
    message.success(t("interaction.cookiesSaved"));
  };
  return (
    <div className={styles.container}>
      <Flex vertical gap={15}>
        <span>Cookies</span>
        <Table
          rowKey={(_cookie, index) => String(index)}
          dataSource={[...cookies, emptyCookie()]}
          columns={columns}
        />
        <Flex justify="flex-end">
          <Button type="primary" onClick={save}>
            {t("ui.save")}
          </Button>
        </Flex>
      </Flex>
    </div>
  );
}
