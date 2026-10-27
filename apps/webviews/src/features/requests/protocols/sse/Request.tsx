import type {
  HttpEditorProps,
  HttpEditorRecord,
} from "@onapi/domain/requests/record";
import styles from "./Request.module.css";
import { memo, ReactNode } from "react";

import { useMemoizedFn } from "ahooks";

import context from "@/shared/components/RawEditor/visualizationContext";
import RequestPanel from "@/features/requests/editor/Request/Request";

import { DirectionType } from "@onapi/domain/types/common";

import type { HttpRequest } from "@onapi/domain";

const Request = memo(
  (
    props: HttpEditorProps & {
      tabOptions?: any;
      direction: DirectionType;
      tabBarExtraContent?: ReactNode;
      onRequestDataChange: (requestData: HttpRequest) => void;
    },
  ) => {
    const {
      tabBarExtraContent,
      direction,
      tabOptions = {},
      apisData,
      onApisDataChange,
      onRequestDataChange,
    } = props;
    const { Provider } = context;

    const handleOnChange = useMemoizedFn(
      (data: HttpEditorRecord["request"]) => {
        onRequestDataChange(data);
      },
    );

    return (
      <div data-direction={direction} className={styles.container}>
        <Provider
          value={{
            isDebugArea: true,
          }}
        >
          <RequestPanel
            apiData={apisData}
            onItemChange={onApisDataChange}
            tabOptions={tabOptions}
            tabBarExtraContent={tabBarExtraContent}
            includesTabs={[
              "Headers",
              "Params",
              "Path",
              "Body",
              "Auth",
              "Cookie",
              "preRequest",
            ]}
            id={apisData?.id}
            requestData={apisData.request}
            onRequestDataChange={handleOnChange}
          />
        </Provider>
      </div>
    );
  },
);

export default Request;
