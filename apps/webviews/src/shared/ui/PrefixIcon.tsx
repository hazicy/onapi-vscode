import styles from "./PrefixIcon.module.css";
import { FC, memo, useMemo } from "react";

import cn from "classnames";

import AppIcon from "@/shared/ui/AppIcon";
import { REQUEST_METHOD_MAP } from "@onapi/http-model/requests/constants/index";

import { isString } from "lodash";

interface Props {
  type: string;
  method?: string;
  wrapClassName?: string;
  style?: React.CSSProperties;
}

const PrefixIcon: FC<Props> = memo(
  ({ type, method, wrapClassName = "", style = {} }) => {
    const computed = useMemo(() => {
      const typeMap: {
        [key: string]: { icon: string | React.ReactNode; className: string };
      } = {
        sse: { icon: "SSE", className: styles.sse },
        doc: { icon: "MD", className: styles.doc },
        folder: { icon: "", className: "" },
        websocket: { icon: "WS", className: styles.ws },
        socketio: { icon: "IO", className: "" },
        grpc: { icon: "GRPC", className: styles.grpc },
        graphql: { icon: "GQL", className: styles.gql },
        socket_method: { icon: "TCP", className: "" },
        socket: {
          icon: <AppIcon icon="cable" />,
          className: styles.socket,
        },
        note: { icon: <AppIcon icon="sticky-note" />, className: styles.notes },
        testing: {
          icon: <AppIcon icon="flask-conical" />,
          className: styles.testing,
        },
        kit: {
          icon: <AppIcon icon="test-tubes" />,
          className: styles.kit,
        },
        model: {
          icon: <AppIcon icon="shapes" />,
          className: styles.dataModel,
        },
        sample: {
          icon: <AppIcon icon="file-code" />,
          className: styles.apiSample,
        },
      };

      if (method) {
        typeMap.api = {
          icon: REQUEST_METHOD_MAP?.[method] || method,
          className: REQUEST_METHOD_MAP?.[method]
            ? styles[method.toLowerCase()]
            : styles.DEFAULT,
        };
      }

      return typeMap[type];
    }, [type, method]);

    const renderIcon = (icon: any) => {
      if (isString(icon) && icon.length > 4) {
        return icon.substring(0, 4);
      }
      return icon;
    };

    return (
      <>
        {(computed?.icon && (
          <div
            style={style}
            className={cn(styles.container, computed?.className, wrapClassName)}
          >
            {renderIcon(computed?.icon)}
          </div>
        )) ||
          null}
      </>
    );
  },
);

export default PrefixIcon;
