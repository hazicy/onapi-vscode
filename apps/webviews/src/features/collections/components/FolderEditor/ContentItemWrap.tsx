import {
  folderEditorRecordSchema,
  type FolderEditorRecord,
} from "@onapi/domain/requests/record";
import { FC, FunctionComponent, memo } from "react";

import { useMemoizedFn } from "ahooks";

import { SuspenseContent } from "@/shared/components";

import useRequestWorkspaceStore from "@/features/requests/store/useRequestWorkspaceStore";

interface Props {
  apisData: FolderEditorRecord;
  contentType?: string;
  activeContentType?: string | number;
  element: FunctionComponent<{
    apisData: FolderEditorRecord;
    onApisDataChange: (param: FolderEditorRecord) => void;
  }>;
}

const ContentItemWrap: FC<Props> = memo((props) => {
  const { apisData } = props;

  const onApisDataChange = useMemoizedFn((data: FolderEditorRecord) => {
    useRequestWorkspaceStore
      .getState()
      .setActiveRequest(folderEditorRecordSchema.parse(data));
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
