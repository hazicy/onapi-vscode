import { FC, FunctionComponent, memo } from "react";

import { useMemoizedFn } from "ahooks";

import { SuspenseContent } from "@/shared/components";

import { useApis } from "@/app/store";
import { ApiDetailsData, ApisData } from "@onapi/http-model/requests/types/api";

interface Props {
  apisData: ApiDetailsData;
  // onApisDataChange:(val:ApiDetailsData)=>void;
  contentType?: string;
  activeContentType?: string | number;
  element: FunctionComponent<{
    apisData: ApisData;
    onApisDataChange: (param: ApiDetailsData) => void;
  }>;
}

const ContentItemWrap: FC<Props> = memo((props) => {
  const { apisData } = props;

  const onApisDataChange = useMemoizedFn((data: ApiDetailsData) => {
    useApis.getState().updateApisActiveData(data);
  });

  return (
    <SuspenseContent skeletonProps={{ paragraph: { rows: 6 } }}>
      <props.element
        key={apisData?.id}
        apisData={apisData}
        onApisDataChange={onApisDataChange}
      />
    </SuspenseContent>
  );
});

export default ContentItemWrap;
