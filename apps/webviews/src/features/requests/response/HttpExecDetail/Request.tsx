import { useTranslation } from "react-i18next";

import { isObject, size } from "lodash-es";

import BasicTable from "@/shared/components/BasicTable/BasicTable";
import LineTabs from "@/shared/components/LineTabs/LineTabs";
import NewJsonView from "@/shared/components/NewJsonView";
import Empty from "@/shared/ui/Empty";
import Tooltip from "@/shared/ui/Tooltip";
import { AnyObject } from "@onapi/domain/types/common";

import { HttpExecDetailProps } from "./HttpExecDetail";
import { formatObjectToArrayKeyValue } from "./utils";

type HeaderDataSource = {
  key: string;
  value: string;
};

type BodyDataSource = {
  key: string;
  value: string | string[];
};

const Request = ({ httpExecDetail }: HttpExecDetailProps) => {
  const { t } = useTranslation();
  const { request } = httpExecDetail || {};

  const headerList = formatObjectToArrayKeyValue(request.headers);

  const headerColumns = [
    {
      width: "50%",
      title: t("supplement.key_v"),
      ellipsis: true,
      dataIndex: "key",
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      width: "50%",
      title: t("supplement.value"),
      ellipsis: true,
      dataIndex: "value",
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
  ];

  const bodyColumns = [
    {
      width: "50%",
      title: t("supplement.key_v"),
      ellipsis: true,
      dataIndex: "key",
      render: (text: string) => (
        <Tooltip placement="topLeft" title={text}>
          {text}
        </Tooltip>
      ),
    },
    {
      width: "50%",
      title: t("supplement.value"),
      ellipsis: true,
      dataIndex: "value",
      render: (text: any) => {
        return isObject(text) ? (
          t("supplement.obj_not_view")
        ) : (
          <Tooltip placement="topLeft" title={text}>
            {text}
          </Tooltip>
        );
      },
    },
  ];

  const renderBody = () => {
    const mode = request?.mode;

    if (mode === "form-data" || mode === "urlencoded") {
      const list = formatObjectToArrayKeyValue(request?.body as AnyObject);

      return (
        <BasicTable<BodyDataSource>
          bordered
          showHeader={false}
          rowKey="key"
          dataSource={list}
          columns={bodyColumns}
        />
      );
    }

    if (mode === "binary") {
      return <Empty description={t("supplement.binary")} />;
    }

    if (mode === "none") {
      return <Empty description={t("supplement.req_no_content")} />;
    }

    return <NewJsonView value={request.body} />;
  };

  const renderHeader = () => {
    if (size(headerList) > 0) {
      return (
        <BasicTable<HeaderDataSource>
          scroll={{ y: 300 }}
          bordered
          showHeader={false}
          rowKey="key"
          dataSource={headerList}
          columns={headerColumns}
        />
      );
    }
    return <Empty description={t("supplement.no_data")} />;
  };

  const items = [
    {
      key: "1",
      label: t("supplement.header"),
      children: renderHeader(),
      countParams: {
        dataSource: headerList,
      },
    },
    {
      key: "2",
      label: t("supplement.body"),
      children: renderBody(),
    },
  ];
  return <LineTabs items={items} />;
};

export default Request;
