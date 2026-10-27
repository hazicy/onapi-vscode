import styles from "./Main.module.css";
import { useMemo } from "react";

import { SegmentedTabs } from "@/shared/components";

import {
  Checkbox,
  Flex,
  message,
  UploadProps,
  InputNumber,
  Skeleton,
  Tooltip,
} from "@/shared/ui/base";
import { Button, AppIcon, Upload } from "@/shared/ui";
import {
  EventItem,
  TestingDetailData,
  TestingSendingData,
} from "@onapi/http-model/testing/types/index";
import { useMemoizedFn, useSafeState } from "ahooks";
import { Settings } from "@onapi/http-model/testing/types/common";
import { useTranslation } from "react-i18next";
import { openUrl } from "@/shared/utils/open";
import { STATUS_CODE } from "@onapi/http-model/constants/common";
import EnvDropdown from "@/features/environment/components/EnvDropdown";
import { produce } from "immer";
import { ChangeFuncType } from "@onapi/http-model/types/common";
import useTesting from "@/features/testing/store/useTesting";
import { str2testData } from "@/shared/utils/common";
import TestingResult from "./TestingResult";
import TestingList from "./TestingList/TestingList";
import All from "./TestingList/All/All";
import { forEach, isArray } from "lodash";
import classNames from "classnames";

type MainProps = {
  testingSendingData: Partial<TestingSendingData>;
  testingConfig: Settings;
  eventList: EventItem[];
  eventAllCount: number;
  is_report?: Boolean;
};

const MAX_SIZE = 5 * 1024 * 1024;

const Main = ({
  testingSendingData,
  testingConfig,
  eventList,
  is_report,
  eventAllCount,
}: MainProps) => {
  const { t } = useTranslation();

  const updateTestingConfig = useTesting((store) => store?.updateTestingConfig);
  const updateEventList = useTesting((store) => store?.updateEventList);

  const [tabValue, setTabValue] = useSafeState<string | number>("functional");
  const sendingOrOver = useMemo(() => {
    return (
      testingSendingData.sendStatus === "sendOver" ||
      testingSendingData.sendStatus === "sending" ||
      Boolean(is_report)
    );
  }, [testingSendingData.sendStatus]);

  const handleSettingChange: ChangeFuncType<TestingDetailData["settings"]> = (
    key,
    value,
  ) => {
    const newTestingData = produce(testingConfig, (draft) => {
      draft[key] = value;
    });
    updateTestingConfig(newTestingData);
  };

  const handleSettingTestDataChange = (obj: {
    file_name: string;
    iteration_data: any[];
  }) => {
    const newTestingData = produce(testingConfig, (draft) => {
      draft.iteration_data = obj.iteration_data;
      draft.file_name = obj.file_name;
    });
    updateTestingConfig(newTestingData);
  };

  const handleRemoveFile = () => {
    handleSettingTestDataChange?.({ file_name: "", iteration_data: [] });
  };

  const csvToJson = useMemoizedFn(async (text) => {
    try {
      const jsonData = await str2testData(text);
      if (!isArray(jsonData)) {
        message.error(t("supplement.csv_imp_json"));
        return;
      }
      return jsonData;
    } catch (e) {}
  });

  const customRequest: UploadProps["customRequest"] = async (option: any) => {
    // If web version and file size exceeds 5MB, prohibit upload
    if (option?.file?.size > MAX_SIZE) {
      message.error(t("supplement.upload_file_large"));
      return;
    }

    if (option?.file) {
      const reader = new FileReader();
      reader.onload = async function () {
        const dataArr = await csvToJson(reader?.result);
        if (isArray(dataArr)) {
          let value = "";
          value = option?.file?.name;
          const newRowData = {
            file_name: option?.file?.name,
            iteration_data: dataArr,
          };

          handleSettingTestDataChange?.(newRowData);
          option.onSuccess(null);
        }
      };
      reader.readAsText(option?.file);
    }
  };

  const TESTING_CONFIG_TAB_LIST = [
    {
      label: t("common.functional"),
      value: "functional",
      children: (
        <div className={styles.functional}>
          <Flex gap={16}>
            <Flex flex={1} vertical gap={6}>
              <label>{t("cicd.loop_count")}</label>
              <InputNumber
                disabled={sendingOrOver}
                min={1}
                value={testingConfig?.execute_count || 1}
                onChange={(value) =>
                  handleSettingChange("execute_count", value || 1)
                }
                className={styles.inputNumber}
              />
            </Flex>
            <Flex flex={1} vertical gap={6}>
              <label>
                {t("test.steps_page.test_condition_modal.interval")}
              </label>
              <InputNumber
                disabled={sendingOrOver}
                min={0}
                addonAfter={t(
                  "test.steps_page.test_condition_modal.interval_time",
                )}
                value={testingConfig.interval_time}
                onChange={(value) =>
                  handleSettingChange("interval_time", value || 0)
                }
                className={styles.inputNumber}
              />
            </Flex>
            <Flex flex={1} vertical gap={6}>
              <Flex gap={4}>
                {t("test.test_data")}{" "}
                <Tooltip
                  title={
                    <>
                      {t("test_data.create_drawer.tips")}{" "}
                      <span
                        style={{
                          color: "var(--color-primary)",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          openUrl(
                            "https://www.echoapi.com/wiki/docs/vscode/tests",
                          );
                        }}
                      >
                        {t("test_data.create_drawer.example")}
                      </span>{" "}
                    </>
                  }
                >
                  <AppIcon icon="circle-help" className={styles.icon} />
                </Tooltip>
              </Flex>
              <>
                {testingConfig?.file_name ? (
                  <div
                    className={classNames(styles.fileNameWrap, {
                      [styles.disabled]: sendingOrOver,
                    })}
                  >
                    <Tooltip title={testingConfig?.file_name}>
                      <span className={styles.name}>
                        {testingConfig?.file_name}
                      </span>
                    </Tooltip>
                    {!sendingOrOver && (
                      <AppIcon
                        icon="trash-2"
                        onClick={handleRemoveFile}
                        className={styles.icon}
                      />
                    )}
                  </div>
                ) : (
                  <Upload
                    disabled={sendingOrOver}
                    customRequest={customRequest}
                    className={classNames(styles.uploadWrapper, {
                      [styles.disabled]: sendingOrOver,
                    })}
                    accept="text/plain,text/csv,application/json"
                  >
                    <Button
                      disabled={sendingOrOver}
                      icon={
                        <AppIcon icon="chevrons-up" className={styles.icon} />
                      }
                      type="text"
                      className={styles.button}
                    >
                      <span style={{ opacity: 0.6 }}>
                        {t("common.request_table.upload")}
                      </span>
                    </Button>
                  </Upload>
                )}
              </>
            </Flex>
            <Flex flex={1} vertical gap={6}>
              <label>{t("supplement.environment")}</label>
              <Flex style={{ minWidth: 168, height: 32 }}>
                <EnvDropdown
                  style={{
                    borderRadius: "4px",
                    border: "1px solid var(--color-table-border)",
                  }}
                  // disabled={sendingOrOver}
                  value={testingConfig.env_id}
                  onEnvClick={({ key }) => {
                    if (sendingOrOver) {
                      return;
                    }
                    handleSettingChange("env_id", key);
                  }}
                />
              </Flex>
            </Flex>
          </Flex>
          <Flex vertical gap={6}>
            <label>{t("common.advanced_settings")}</label>
            <Flex gap={40}>
              <Checkbox
                disabled={sendingOrOver}
                checked={testingConfig.ignore_error === STATUS_CODE.ENABLE}
                onChange={(e) => {
                  const val = e.target.checked;
                  handleSettingChange(
                    "ignore_error",
                    val ? STATUS_CODE.ENABLE : STATUS_CODE.DISABLE,
                  );
                }}
              >
                <Flex
                  className={styles.switchName}
                  gap={8}
                  align="center"
                  onClick={() => {
                    openUrl("http://wiki.echoapi.com/docs/test/edit");
                  }}
                >
                  {t("test.steps_page.test_condition_modal.error")}
                </Flex>
              </Checkbox>
              <Checkbox
                disabled={sendingOrOver}
                checked={testingConfig.enable_sandbox === STATUS_CODE.ENABLE}
                onChange={(e) => {
                  const val = e.target.checked;
                  handleSettingChange(
                    "enable_sandbox",
                    val ? STATUS_CODE.ENABLE : STATUS_CODE.DISABLE,
                  );
                }}
              >
                <Flex
                  className={styles.switchName}
                  gap={8}
                  align="center"
                  onClick={() => {
                    openUrl("http://wiki.echoapi.com/docs/test/edit");
                  }}
                >
                  {t("test.steps_page.test_condition_modal.sandbox")}
                  <Tooltip title={t("common.test_variable_tips")}>
                    <AppIcon icon="circle-help" className={styles.icon} />
                  </Tooltip>
                </Flex>
              </Checkbox>
            </Flex>
          </Flex>
        </div>
      ),
    },
  ];
  const onSelectAll = () => {
    const newEventList = produce(eventList, (draft: any) => {
      let enabled = STATUS_CODE.DISABLE;
      if (isArray(draft) && draft.length > 0) {
        enabled =
          draft[0]?.enabled === STATUS_CODE.ENABLE
            ? STATUS_CODE.DISABLE
            : STATUS_CODE.ENABLE;
        for (let index = 0; index < draft.length; index++) {
          draft[index].enabled = enabled;
        }
      }
    });
    updateEventList(newEventList);
  };

  const onRefresh = () => {
    // Refresh event list
    window?.vscode.postMessage({
      action: "refreshEventList",
    });
    message.success(t("common.refresh_success"));
  };
  const testingListLoading = useMemo(() => {
    if (
      isArray(testingSendingData.requestList) &&
      testingSendingData.requestList.length <= 0 &&
      ["sendOver", "sending"].includes(testingSendingData?.sendStatus || "")
    ) {
      return true;
    }
    return false;
  }, [testingSendingData.requestList, testingSendingData?.sendStatus]);

  return (
    <div className={styles.container}>
      <div className={styles.testingConfig}>
        <SegmentedTabs
          options={TESTING_CONFIG_TAB_LIST}
          value={tabValue}
          onChange={(val) => {
            setTabValue(val);
          }}
          contentClassName={styles.segmentedTabsContent}
        />
      </div>

      <TestingResult
        testingConfig={testingConfig}
        testingSendingData={testingSendingData}
        eventAllCount={eventAllCount}
      />
      {["sendOver", "sending"].includes(
        testingSendingData?.sendStatus || "",
      ) ? (
        <Skeleton active loading={testingListLoading}>
          <div className={styles.resultList}>
            <TestingList
              testingConfig={testingConfig}
              eventAllCount={eventAllCount}
              list={testingSendingData.requestList || []}
            />
          </div>
        </Skeleton>
      ) : (
        <>
          <Flex className={styles.eventBtns} justify="flex-end">
            <Button type="text" onClick={onRefresh} className={styles.button}>
              {t("base.refresh")}
            </Button>
            <Button
              className={classNames(styles.selectAll, styles.button)}
              type="text"
              onClick={onSelectAll}
            >
              {t("common.deselect_all")}
            </Button>
          </Flex>
          <All
            value={eventList || []}
            onChange={(index, val) => {
              const newEventList = produce(eventList, (draft: any) => {
                forEach(val, (value, key) => {
                  draft[index][key] = value;
                });
              });
              updateEventList(newEventList);
            }}
          />
        </>
      )}
    </div>
  );
};

export default Main;
