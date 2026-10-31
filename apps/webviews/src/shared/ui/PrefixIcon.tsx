import styles from "./PrefixIcon.module.css";
import { FC, memo, useMemo } from "react";

import clsx from "clsx";

import AppIcon from "@/shared/ui/AppIcon";
import { REQUEST_METHOD_MAP } from "@onapi/domain/requests/constants/index";
import { API_METHODS } from "@onapi/domain/constants/common";

import { isString } from "lodash-es";

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
        doc: { icon: "MD", className: styles.doc },
        folder: { icon: "", className: "" },
        websocket: {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 4h-5v5l4 4l5 -5z" />
              <path d="M15 20h5v-5l-4 -4l-5 5z" />
              <path d="M9 9l6 6" />
            </svg>
          ),
          className: styles.ws,
        },
        socketio: {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
              <path d="M11 11h1l3 -4l-4 4" />
              <path d="M12 13h1l-4 4l3 -4" />
            </svg>
          ),
          className: styles.socketio,
        },
        grpc: { icon: "GRPC", className: styles.grpc },
        graphql: {
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 600 600"
              fill="none"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                fillRule="evenodd"
                d="M351.3 68.8 474.6 140q5.3-5.6 12.2-9.6a53.6 53.6 0 1 1 39.2 98.4v142.5a53.6 53.6 0 0 1 33.7 78.7 53.6 53.6 0 0 1-86.3 8.9l-122.6 70.8a53.5 53.5 0 1 1-102.1 1.7l-123.4-71.2a53.5 53.5 0 1 1-51.3-89V228.9a53.6 53.6 0 1 1 51.3-88.9l123.4-71.2A53.6 53.6 0 0 1 300 0a53.4 53.4 0 0 1 51.3 68.8m-12.9 22L462.1 162a53.4 53.4 0 0 0 38.5 66.5v142.7l-2.1.6L337 92zm-75.3 1.4L101.5 371.9l-2-.6V228.6a53 53 0 0 0 38.4-66.6l123.6-71.4zm51.8 12.6 161.5 279.7a53 53 0 0 0-15 26.1H138.6a54 54 0 0 0-15-26L285 104.9a54 54 0 0 0 29.8 0m24.6 405.7 123-71-1-3.4h-323l-.5 2 123.5 71.3a53.3 53.3 0 0 1 78 1.1"
                clipRule="evenodd"
              />
            </svg>
          ),
          className: styles.gql,
        },
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

      if (type === "api") {
        const normalizedMethod = method?.trim().toUpperCase() || "";
        const isDefaultMethod = API_METHODS.includes(normalizedMethod);
        typeMap.api = {
          icon: isDefaultMethod ? REQUEST_METHOD_MAP[normalizedMethod] : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="1em"
              height="1em"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path stroke="none" d="M0 0h24v24H0z" fill="none" />
              <path d="M4 13h5" />
              <path d="M12 16v-8h3a2 2 0 0 1 2 2v1a2 2 0 0 1 -2 2h-3" />
              <path d="M20 8v8" />
              <path d="M9 16v-5.5a2.5 2.5 0 0 0 -5 0v5.5" />
            </svg>
          ),
          className: isDefaultMethod
            ? styles[normalizedMethod.toLowerCase()]
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
            className={clsx(
              styles.container,
              computed?.className,
              wrapClassName,
            )}
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
