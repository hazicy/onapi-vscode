import styles from "./Request.module.css";
import { memo, ReactNode } from "react";

import { useMemoizedFn } from "ahooks";
import { produce } from "immer";

import GraphQLQuery from "@/features/requests/components/GraphQLQuery";

import context from "@/shared/components/RawEditor/visualizationContext";
import RequestPanel from "@/features/requests/components/Request";
import {
  ApiComponentType,
  GraphQLChangeFuncType,
  GraphQLDetailsData,
} from "@onapi/http-model/requests/types/graphql";
import { DirectionType } from "@onapi/http-model/types/common";

const Request = memo(
  (
    props: ApiComponentType & {
      direction: DirectionType;
      tabBarExtraContent?: ReactNode;
    },
  ) => {
    const { direction, apisData, onApisDataChange, tabBarExtraContent } = props;
    const { Provider } = context;

    const handleOnChange: GraphQLChangeFuncType<GraphQLDetailsData> =
      useMemoizedFn(
        <K extends keyof GraphQLDetailsData>(
          key: K,
          data: GraphQLDetailsData[K],
          search_id?: string,
        ) => {
          const newData = {
            ...apisData,
            [key]: data,
            ...(search_id ? { search_id } : {}),
          };

          onApisDataChange(newData);
        },
      );

    const extra = [
      {
        key: "cusQuery",
        label: "Query",
        children: (
          <GraphQLQuery
            id={apisData?.id}
            requestData={apisData.request}
            apiData={apisData}
            onChange={handleOnChange}
          />
        ),
      },
    ];

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
            extra={extra}
            includesTabs={[
              "cusQuery",
              "Headers",
              "Auth",
              "Cookie",
              "preRequest",
              "postResponse",
            ]}
            id={apisData?.id}
            requestData={apisData.request}
            onRequestDataChange={(v) => handleOnChange("request", v)}
            tabBarExtraContent={tabBarExtraContent}
          />
        </Provider>
      </div>
    );
  },
);

export default Request;
