import type { SchemaTreeNode } from "@/features/requests/utils/graphql/types";
import styles from "../GraphQLQuery.module.css";
import React, { Key, useEffect, useMemo, useRef, useState } from "react";

import { Tree } from "@/shared/ui/base";
import { DataNode } from "@/shared/ui/base";
import { TreeProps } from "@/shared/ui/base";

import { t } from "i18next";

import { AppIcon, Input } from "@/shared/ui";
import { getChildTree } from "@/features/requests/utils/graphql/schema2tree";

import TitleRender from "./TitleRender";

const { DirectoryTree } = Tree;
const toTreeNode = (node: SchemaTreeNode): DataNode => ({
  ...node,
  key: node.key || node.name,
  children: node.children?.map(toTreeNode),
});

const SchemaTree = (
  props: TreeProps & { setTreeData: React.Dispatch<any>; querySchema: any },
) => {
  const titleRender = (node: DataNode): React.ReactNode => (
    <TitleRender {...node} />
  );
  const { treeData, setTreeData, querySchema } = props || {};
  const [value, setValue] = useState<string>("");
  const [expandedKeys, setExpandedKeys] = useState<Key[]>(["Query"]);
  const [treeHeight, setTreeHeight] = useState(320);

  const treeRef = useRef<any>(null);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setTreeHeight(entry.contentRect.height);
      }
    });

    if (treeRef.current) {
      resizeObserver.observe(treeRef.current);
    }

    // Cleanup function
    return () => {
      if (treeRef.current) {
        resizeObserver.disconnect();
      }
    };
  }, []);

  const filterTree = (data: any) =>
    data
      ?.map((item: { name: string; children: any }) => {
        if (item?.name.toLowerCase().includes(value.toLowerCase())) {
          return {
            ...item,
            children: item.children ? filterTree(item.children) : [],
          };
        } else if (item.children) {
          const newChildren = filterTree(item.children).filter(Boolean);
          if (newChildren.length > 0) {
            return {
              ...item,
              children: newChildren,
            };
          }
        }
        return null;
      })
      .filter(Boolean);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setValue(value);
  };

  const filterTreeData = useMemo(() => {
    return filterTree(treeData);
  }, [value, treeData]);

  const updateTreeData = (
    list: DataNode[],
    key: React.Key,
    children: DataNode[],
  ): DataNode[] =>
    list.map((node) => {
      if (node.key === key) {
        return {
          ...node,
          children,
        };
      }
      if (node.children) {
        return {
          ...node,
          children: updateTreeData(node.children, key, children),
        };
      }
      return node;
    });

  const onLoadData = (item: any) =>
    new Promise<void>((resolve) => {
      if (!item?.children) {
        resolve();
        return;
      }
      setTreeData((origin: any) =>
        updateTreeData(
          origin,
          item?.key,
          (getChildTree(item, querySchema) || []).map(toTreeNode),
        ),
      );
      resolve();
    });

  return (
    <div className={styles.schemaTree}>
      <div className={styles.search}>
        <Input
          placeholder={t("graphql.search_placeholder")}
          prefix={<AppIcon icon="search" />}
          value={value}
          onChange={onChange}
          inputClassName={styles.input}
          affixClassName={styles.inputAffixWrapper}
        />
      </div>
      <div className={styles.schemaTree} ref={treeRef}>
        <DirectoryTree
          height={treeHeight}
          {...props}
          fieldNames={{
            key: "key",
            title: "name",
            children: "children",
          }}
          blockNode
          expandedKeys={expandedKeys}
          onExpand={(e) => setExpandedKeys(e)}
          showLine
          switcherIcon={<AppIcon icon="chevron-down" />}
          treeData={filterTreeData}
          titleRender={titleRender}
          loadData={onLoadData}
          showIcon={false}
        />
      </div>
    </div>
  );
};

export default SchemaTree;
