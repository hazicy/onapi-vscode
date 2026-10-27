import styles from "./ApisTypeTag.module.css";
import { Tag as Tag2 } from "@/shared/ui/base";
import classNames from "classnames";

import React from "react";

import { TagProps } from "@/shared/ui/base";

import { APIS_TARGET_TYPE_ENUM } from "@onapi/domain/requests/constants/index";

import { ApiTypeMethod } from "@onapi/domain/requests/types/base";

type Props = TagProps & {
  targetType: APIS_TARGET_TYPE_ENUM;
  method: ApiTypeMethod;
};

/** Tag containing apis kind and api method */
const ApisTypeTag: React.FC<Props> = ({
  targetType,
  method,
  ...resetProps
}) => {
  return (
    <Tag2
      style={{ fontWeight: 700 }}
      bordered={false}
      {...resetProps}
      className={classNames(styles.container, resetProps.className)}
    >
      {method}
    </Tag2>
  );
};

export default ApisTypeTag;
