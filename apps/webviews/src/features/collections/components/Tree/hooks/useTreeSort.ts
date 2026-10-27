import type { CollectionTreeNode } from "@/features/collections/components/Tree/types";
import { useParams } from "react-router-dom";

import { TreeProps } from "@/shared/ui/base";
import { DataNode } from "@/shared/ui/base";

import { produce } from "immer";
import { assign, concat, forEach, includes, isEqual, last } from "lodash-es";

import {
  DEFAULT_NO_DRAG_INCLUDES_KEYS,
  DROP_POSITION_ENUM,
} from "../constants";

interface Props {
  allowDrop?: TreeProps<CollectionTreeNode>["allowDrop"];
  nodeDraggableKeys?: string[];
  onMoveApis?: (data: any) => void;
  primaryIdKeyName: string;
}

const useTreeSort = (props: Props) => {
  const {
    primaryIdKeyName,
    allowDrop,
    nodeDraggableKeys = [],
    onMoveApis,
  } = props;

  const { projectId } = useParams();

  const nodeDraggable = (node: DataNode) => {
    return !includes(
      concat([], DEFAULT_NO_DRAG_INCLUDES_KEYS, nodeDraggableKeys),
      node.key,
    );
  };

  const genNewData = <
    T extends Record<string, any>,
    U extends Record<typeof primaryIdKeyName, any>,
  >(
    detailsData: { [x: string]: T },
    list: U[],
  ) => {
    return produce(detailsData, (draft) => {
      forEach(list, (item) => {
        const key = item[primaryIdKeyName];

        if (draft[key]) {
          draft[key] = {
            ...draft[key],
            ...(item as unknown as T),
          };
        }
      });
    });
  };

  const onDrop: TreeProps<CollectionTreeNode>["onDrop"] = (info) => {
    const dropKey = String(info.node.key);
    const dragKey = String(info.dragNode.key);

    const dropTitleProps = info.node.data;
    if (!dropTitleProps) {
      return;
    }
    const dropParentId = dropTitleProps?.parentId;

    const dropPos = info.node.pos.split("-");
    const dropPosition = info.dropPosition - Number(last(dropPos));

    const positionTargetId = {
      [`after_${primaryIdKeyName}`]: "0",
      [`before_${primaryIdKeyName}`]: "0",
    };

    const moveParams = {
      project_id: String(projectId),
      parentId: dropParentId,
      [`${primaryIdKeyName}s`]: [dragKey],
    };

    if (isEqual(dropPosition, DROP_POSITION_ENUM.TOP)) {
      positionTargetId[`after_${primaryIdKeyName}`] = dropKey;
    }
    if (isEqual(dropPosition, DROP_POSITION_ENUM.BOTTOM)) {
      positionTargetId[`before_${primaryIdKeyName}`] = dropKey;
    }
    if (isEqual(dropPosition, DROP_POSITION_ENUM.INSIDE)) {
      moveParams.parentId = dropKey;
    }

    onMoveApis?.(assign({}, moveParams, positionTargetId));
  };

  return {
    allowDrop,
    draggable: { icon: false, nodeDraggable: nodeDraggable },
    onDrop,
    genNewData,
  };
};

export default useTreeSort;
