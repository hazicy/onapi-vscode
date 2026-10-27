import styles from "./Response.module.css";
import { useTranslation } from "react-i18next";

import { bufferToRaw } from "@onapi/http-model/utils/response-tools";
import dayjs from "dayjs";
import { isEmpty, size } from "lodash";

import Console from "@/features/requests/components/Console";
import LineTabs from "@/shared/components/LineTabs";
import Empty from "@/shared/ui/Empty";
import Tooltip from "@/shared/ui/Tooltip";
import { ApiSendResponseDataResponseArrCookiesItem } from "@onapi/http-model/requests/types/send";

import { HttpExecDetailProps } from "./index";
import BasicTable from "../../../../shared/components/BasicTable";
import NewJsonView from "../../../../shared/components/NewJsonView";
import { formatObjectToArrayKeyValue } from "./utils";

import { handleResponseConsole } from "@/features/requests/utils/apis";
import { InvalidUrl } from "./InvalidUrl";

type HeaderDataSource = {
  key: string;
  value: string;
};

const Response = ({ httpExecDetail }: HttpExecDetailProps) => {
  const { t } = useTranslation();
  if (!httpExecDetail?.response) {
    return <InvalidUrl url={httpExecDetail?.request?.url} />;
  }
  const { response, request } = httpExecDetail;

  const headerList = formatObjectToArrayKeyValue(response.headers);

  const renderItem = (text: string) => {
    return (
      <Tooltip placement="topLeft" title={text}>
        {text}
      </Tooltip>
    );
  };

  const headerColumns = [
    {
      width: "50%",
      title: t("supplement.key_v"),
      ellipsis: true,
      dataIndex: "key",
      render: (text: string) => renderItem(text),
    },
    {
      width: "50%",
      title: t("supplement.value"),
      ellipsis: true,
      dataIndex: "value",
      render: (text: string) => renderItem(text),
    },
  ];

  const cookieColumns = [
    {
      width: 100,
      title: "name",
      dataIndex: "key",
      render: (_: any, rowData: any) => renderItem(rowData.key || rowData.name),
    },
    {
      width: 100,
      title: "value",
      dataIndex: "value",
      render: (text: string) => renderItem(text),
    },
    {
      width: 100,
      title: "httpOnly",
      dataIndex: "httpOnly",
      render: (text: boolean) => renderItem(text ? "true" : "false"),
    },
    {
      width: 100,
      title: "domain",
      dataIndex: "domain",
      render: (text: string) => renderItem(text),
    },
    {
      width: 100,
      title: "expires",
      dataIndex: "expires",
      render: (text: string) =>
        renderItem(dayjs(text).format("YYYY-MM-DD HH:mm:ss")),
    },
    {
      width: 100,
      title: "path",
      dataIndex: "path",
      render: (text: string) => renderItem(text),
    },
    {
      width: 100,
      title: "secure",
      dataIndex: "secure",
      render: (text: boolean) => renderItem(text ? "true" : "false"),
    },
  ];

  const responseBody = () => {
    const { mime_type, stream, body } = response || {};
    if (response?.response_size / 1024 / 1024 > 5) {
      return (
        <div className={styles.empty}>
          <Empty
            description={t("supplement.file_big")}
            className={styles.empty}
          />
        </div>
      );
    }

    const { raw: rawBody, base64 } =
      (stream?.data && bufferToRaw(stream?.data || "", mime_type)) || {};

    const base64Body = base64;

    if (!rawBody && !base64Body) {
      return (
        <div className={styles.empty}>
          <Empty
            description={t("supplement.no_data")}
            className={styles.empty}
          />
        </div>
      );
    }

    return (
      <>
        {response?.fit_for_show === "Monaco" ? (
          <div style={{ height: 600, width: "100%" }}>
            <NewJsonView value={rawBody || ""} />
          </div>
        ) : response?.fit_for_show === "Image" ? (
          <div style={{ width: 300 }}>
            <img src={body || base64Body} style={{ maxWidth: "100%" }} />
          </div>
        ) : (
          <div className={styles.empty}>
            <Empty
              description={t("supplement.no_view")}
              className={styles.empty}
            />
          </div>
        )}
      </>
    );
  };

  const responseConsole = () => {
    const consoleList = handleResponseConsole(httpExecDetail.console);
    return <Console consoleList={consoleList} />;
  };

  const items = [
    {
      key: "1",
      label: t("supplement.res_body"),
      children:
        isEmpty(response) || response?.code === 0 ? (
          <div className={styles.empty}>
            <InvalidUrl url={request?.url} />
          </div>
        ) : (
          responseBody()
        ),
    },
    {
      key: "2",
      label: t("supplement.res_header"),
      children: size(headerList) ? (
        <BasicTable<HeaderDataSource>
          scroll={{ y: 300 }}
          bordered
          showHeader={false}
          rowKey="value"
          dataSource={headerList}
          columns={headerColumns}
        />
      ) : (
        <div className={styles.empty}>
          <Empty
            description={t("supplement.no_data")}
            className={styles.empty}
          />
        </div>
      ),
      countParams: {
        dataSource: headerList,
      },
    },
    {
      key: "3",
      label: t("supplement.res_cookie"),
      children: size(response.arr_cookies) ? (
        <BasicTable<ApiSendResponseDataResponseArrCookiesItem>
          scroll={{ x: size(response.arr_cookies) ? 300 : 0, y: 300 }}
          bordered
          rowKey="name"
          dataSource={response.arr_cookies || []}
          columns={cookieColumns}
        />
      ) : (
        <div className={styles.empty}>
          <Empty
            description={t("supplement.no_data")}
            className={styles.empty}
          />
        </div>
      ),
      countParams: {
        dataSource: response.arr_cookies || [],
      },
    },
    {
      key: "4",
      label: t("supplement.console"),
      children: responseConsole(),
    },
  ];
  return (
    <div className={styles.container}>
      <LineTabs items={items} panelClassName={styles.tabsTabpane} />
    </div>
  );
};

export default Response;
