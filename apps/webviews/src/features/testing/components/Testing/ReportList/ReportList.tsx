import styles from "./ReportList.module.css";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Divider, Flex, Popconfirm, message } from "@/shared/ui/base";

import { cloneDeep, isArray, size } from "lodash";

import Table from "@/shared/components/BasicTable/BasicTable";
import { ColumnsType } from "@/shared/components/BasicTable/types";
import Button from "@/shared/ui/Button";
import Empty from "@/shared/ui/Empty";
import Tooltip from "@/shared/ui/Tooltip";
import { TestingReportList } from "@onapi/http-model/testing/types/res/index";
import { formatTimeToDateTimeLong } from "@onapi/http-model/utils/time";

import Result from "./Result";

import useTesting from "@/features/testing/store/useTesting";
import { getPercent } from "../utils";
import { produce } from "immer";

const Report = () => {
  const { t } = useTranslation();
  const testingReportList = useTesting((store) => store?.testingReportList);
  const updateTestingReportList = useTesting(
    (store) => store?.updateTestingReportList,
  );
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [reportDetails, setReportDetails] = useState<TestingReportList>();

  const columns: ColumnsType<TestingReportList>[] = useMemo(() => {
    const renderItem = (value: string) => {
      return (
        <Tooltip placement="topLeft" title={value}>
          {value}
        </Tooltip>
      );
    };

    return [
      {
        width: 160,
        title: t("report_list.report_name"),
        dataIndex: "report_name",
        fixed: "left",
        ellipsis: true,
        render: (text, record) => (
          <Tooltip placement="topLeft" title={text}>
            <span
              style={{ cursor: "pointer" }}
              onClick={() => handleViewReport(record)}
            >
              {text}
            </span>
          </Tooltip>
        ),
      },
      {
        width: 100,
        title: t("report_list.environment"),
        ellipsis: true,
        dataIndex: "complete",
        render: (value) => renderItem(value.env_name),
      },
      {
        width: 100,
        title: t("report_list.pass_rate"),
        dataIndex: "complete",
        render: (value) =>
          renderItem(getPercent(value.http.success, value.http)),
      },
      {
        width: 100,
        title: t("report_list.assertion_rate"),
        dataIndex: "complete",
        render: (value) =>
          renderItem(getPercent(value.assert.success, value.assert)),
      },
      {
        width: 160,
        title: t("report_list.start_time"),
        dataIndex: "complete",
        render: (value) =>
          value ? renderItem(formatTimeToDateTimeLong(value.start_at)) : "",
      },
      {
        width: 160,
        title: t("report_list.end_time"),
        dataIndex: "complete",
        render: (value) =>
          value ? renderItem(formatTimeToDateTimeLong(value.end_at)) : "",
      },
      {
        width: 140,
        title: t("report_list.operation"),
        render: (_, record) => {
          return (
            <Flex align="center" className={styles.operate}>
              <Button
                type="link"
                size="small"
                onClick={() => handleViewReport(record)}
                className={styles.button}
              >
                {t("report_list.view")}
              </Button>
              <Divider type="vertical" className={styles.btnDivider} />
              <Popconfirm
                title={t("common.tips")}
                onConfirm={() => handleDeleteReport(record)}
              >
                <Button type="link" size="small" className={styles.button}>
                  {t("report_list.delete")}
                </Button>
              </Popconfirm>
            </Flex>
          );
        },
      },
    ];
  }, [testingReportList]);

  const handleViewReport = (record: TestingReportList) => {
    setReportDetails(record);
    setIsDrawerOpen(true);
  };

  const handleDeleteReport = (record: TestingReportList) => {
    const newTestingReportList = produce(testingReportList, (draft) => {
      const index = draft.findIndex((i) => i?.report_id === record.report_id);
      if (index !== -1) {
        draft.splice(index, 1);
      }
    });
    updateTestingReportList(newTestingReportList);

    // Save report list to vscode
    window?.vscode.postMessage({
      action: "saveFolderTestData",
      data: {
        reportList: newTestingReportList,
      },
    });
    message.success(t("supplement.del_success"));
  };

  const dataSource = useMemo(() => {
    if (isArray(testingReportList) && testingReportList.length > 0) {
      const newData = cloneDeep(testingReportList);
      return newData.sort(
        (a, b) => b?.complete?.start_at - a?.complete?.start_at,
      );
    }
    return [];
  }, [testingReportList]);

  return (
    <div className={styles.container}>
      {size(testingReportList) ? (
        <Table<TestingReportList>
          scroll={{ y: "calc(100vh - 280px" }}
          rowKey="report_id"
          dataSource={dataSource}
          columns={columns}
          pagination={{
            defaultCurrent: 1,
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t("common.count", { count: total }),
          }}
        />
      ) : (
        <Empty />
      )}

      {reportDetails && (
        <Result
          data={reportDetails}
          open={isDrawerOpen}
          onClose={() => {
            setReportDetails(undefined);
            setIsDrawerOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default Report;
