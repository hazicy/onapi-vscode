import { useMemo } from "react";

import i18next from "i18next";
import { size } from "lodash";

import {
  compare,
  formatApis,
  formatGraphql,
  formatSocketIo,
  formatWebSocket,
  formatEnv,
} from "./utils";

const useFormat = (props: any) => {
  const { oldData, newData, targetType } = props;

  const apis = useMemo(() => {
    if (!oldData || !newData || targetType !== "api") {
      return {};
    }
    const {
      base_info: old_base_info,
      description: old_description,
      cookie: old_cookie,
      header: old_header,
      query: old_query,
      restful: old_restful,
      body: old_body,
      auth: old_auth,
      pre_tasks: old_pre_tasks,
      post_tasks: old_post_tasks,
      response: old_response,
    } = formatApis(oldData);

    const {
      base_info: new_base_info,
      description: new_description,
      header: new_header,
      query: new_query,
      restful: new_restful,
      cookie: new_cookie,
      body: new_body,
      auth: new_auth,
      pre_tasks: new_pre_tasks,
      post_tasks: new_post_tasks,
      response: new_response,
    } = formatApis(newData);
    // This block adds tag and attr only when they are not initial values start
    const old_base_info_temp: any = {
      [`[${i18next.t("supplement.name")}]name`]:
        old_base_info[`[${i18next.t("supplement.name")}]name`],
      "[Method]method": old_base_info["[Method]method"],
      "[URL]url": old_base_info["[URL]url"],
      [`[${i18next.t("supplement.status")}]mark`]:
        old_base_info[`[${i18next.t("supplement.status")}]mark`],
    };
    const new_base_info_temp: any = {
      [`[${i18next.t("supplement.name")}]name`]:
        new_base_info[`[${i18next.t("supplement.name")}]name`],
      "[Method]method": new_base_info["[Method]method"],
      "[URL]url": new_base_info["[URL]url"],
      [`[${i18next.t("supplement.status")}]mark`]:
        new_base_info[`[${i18next.t("supplement.status")}]mark`],
    };

    if (
      (old_base_info[`[${i18next.t("supplement.tag")}]tag`] &&
        size(old_base_info[`[${i18next.t("supplement.tag")}]tag`]) > 0) ||
      (new_base_info[`[${i18next.t("supplement.tag")}]tag`] &&
        size(new_base_info[`[${i18next.t("supplement.tag")}]tag`]) > 0)
    ) {
      old_base_info_temp[`[${i18next.t("supplement.tag")}]tag`] =
        old_base_info[`[${i18next.t("supplement.tag")}]tag`];
      new_base_info_temp[`[${i18next.t("supplement.tag")}]tag`] =
        new_base_info[`[${i18next.t("supplement.tag")}]tag`];
    }
    if (
      (old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`] &&
        size(
          Object.keys(
            old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`],
          ),
        ) > 0) ||
      (new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`] &&
        size(
          Object.keys(
            new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`],
          ),
        ) > 0)
    ) {
      old_base_info_temp[`[${i18next.t("supplement.attr")}]attribute_info`] =
        old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`];
      new_base_info_temp[`[${i18next.t("supplement.attr")}]attribute_info`] =
        new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`];
    }

    // This block adds tag and attr only when they are not initial values end
    return {
      base_info: compare(old_base_info_temp, new_base_info_temp, "base_info"),
      description: compare(old_description, new_description, "description"),
      cookie: compare(old_cookie, new_cookie, "cookie"),
      header: compare(old_header, new_header, "header"),
      query: compare(old_query, new_query, "query"),
      restful: compare(old_restful, new_restful, "restful"),
      body: compare(old_body, new_body, "body"),
      auth: compare(old_auth, new_auth, "auth"),
      pre_tasks: compare(old_pre_tasks, new_pre_tasks, "pre_tasks"),
      post_tasks: compare(old_post_tasks, new_post_tasks, "post_tasks"),
      response: compare(old_response, new_response, "response"),
    };
  }, [oldData, newData, targetType]);
  const websocket = useMemo(() => {
    if (!oldData || !newData || targetType !== "websocket") {
      return {};
    }
    const {
      base_info: old_base_info,
      description: old_description,
      header: old_header,
      query: old_query,
      message: old_message,
    } = formatWebSocket(oldData);

    const {
      base_info: new_base_info,
      description: new_description,
      header: new_header,
      query: new_query,
      message: new_message,
    } = formatWebSocket(newData);
    // This block adds tag and attr only when they are not initial values start
    const old_base_info_temp: any = {
      [`[${i18next.t("supplement.name")}]name`]:
        old_base_info[`[${i18next.t("supplement.name")}]name`],
      "[Method]method": old_base_info["[Method]method"],
      "[URL]url": old_base_info["[URL]url"],
      [`[${i18next.t("supplement.status")}]mark`]:
        old_base_info[`[${i18next.t("supplement.status")}]mark`],
    };
    const new_base_info_temp: any = {
      [`[${i18next.t("supplement.name")}]name`]:
        new_base_info[`[${i18next.t("supplement.name")}]name`],
      "[Method]method": new_base_info["[Method]method"],
      "[URL]url": new_base_info["[URL]url"],
      [`[${i18next.t("supplement.status")}]mark`]:
        new_base_info[`[${i18next.t("supplement.status")}]mark`],
    };

    if (
      (old_base_info[`[${i18next.t("supplement.tag")}]tag`] &&
        size(old_base_info[`[${i18next.t("supplement.tag")}]tag`]) > 0) ||
      (new_base_info[`[${i18next.t("supplement.tag")}]tag`] &&
        size(new_base_info[`[${i18next.t("supplement.tag")}]tag`]) > 0)
    ) {
      old_base_info_temp[`[${i18next.t("supplement.tag")}]tag`] =
        old_base_info[`[${i18next.t("supplement.tag")}]tag`];
      new_base_info_temp[`[${i18next.t("supplement.tag")}]tag`] =
        new_base_info[`[${i18next.t("supplement.tag")}]tag`];
    }
    if (
      (old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`] &&
        size(
          Object.keys(
            old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`],
          ),
        ) > 0) ||
      (new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`] &&
        size(
          Object.keys(
            new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`],
          ),
        ) > 0)
    ) {
      old_base_info_temp[`[${i18next.t("supplement.attr")}]attribute_info`] =
        old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`];
      new_base_info_temp[`[${i18next.t("supplement.attr")}]attribute_info`] =
        new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`];
    }
    // This block adds tag and attr only when they are not initial values end
    return {
      base_info: compare(old_base_info_temp, new_base_info_temp, "base_info"),
      description: compare(old_description, new_description, "description"),
      header: compare(old_header, new_header, "header"),
      query: compare(old_query, new_query, "query"),
      message: compare(old_message, new_message, "message"),
    };
  }, [oldData, newData, targetType]);
  const socketio = useMemo(() => {
    if (!oldData || !newData || targetType !== "socketio") {
      return {};
    }
    const {
      base_info: old_base_info,
      description: old_description,
      header: old_header,
      query: old_query,
      message: old_message,
      event: old_event,
    } = formatSocketIo(oldData);

    const {
      base_info: new_base_info,
      description: new_description,
      header: new_header,
      query: new_query,
      message: new_message,
      event: new_event,
    } = formatSocketIo(newData);
    // This block adds tag and attr only when they are not initial values start
    const old_base_info_temp: any = {
      [`[${i18next.t("supplement.name")}]name`]:
        old_base_info[`[${i18next.t("supplement.name")}]name`],
      "[Method]method": old_base_info["[Method]method"],
      "[URL]url": old_base_info["[URL]url"],
      [`[${i18next.t("supplement.status")}]mark`]:
        old_base_info[`[${i18next.t("supplement.status")}]mark`],
    };
    const new_base_info_temp: any = {
      [`[${i18next.t("supplement.name")}]name`]:
        new_base_info[`[${i18next.t("supplement.name")}]name`],
      "[Method]method": new_base_info["[Method]method"],
      "[URL]url": new_base_info["[URL]url"],
      [`[${i18next.t("supplement.status")}]mark`]:
        new_base_info[`[${i18next.t("supplement.status")}]mark`],
    };

    if (
      (old_base_info[`[${i18next.t("supplement.tag")}]tag`] &&
        size(old_base_info[`[${i18next.t("supplement.tag")}]tag`]) > 0) ||
      (new_base_info[`[${i18next.t("supplement.tag")}]tag`] &&
        size(new_base_info[`[${i18next.t("supplement.tag")}]tag`]) > 0)
    ) {
      old_base_info_temp[`[${i18next.t("supplement.tag")}]tag`] =
        old_base_info[`[${i18next.t("supplement.tag")}]tag`];
      new_base_info_temp[`[${i18next.t("supplement.tag")}]tag`] =
        new_base_info[`[${i18next.t("supplement.tag")}]tag`];
    }
    if (
      (old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`] &&
        size(
          Object.keys(
            old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`],
          ),
        ) > 0) ||
      (new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`] &&
        size(
          Object.keys(
            new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`],
          ),
        ) > 0)
    ) {
      old_base_info_temp[`[${i18next.t("supplement.attr")}]attribute_info`] =
        old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`];
      new_base_info_temp[`[${i18next.t("supplement.attr")}]attribute_info`] =
        new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`];
    }
    // This block adds tag and attr only when they are not initial values end
    return {
      base_info: compare(old_base_info_temp, new_base_info_temp, "base_info"),
      description: compare(old_description, new_description, "description"),
      header: compare(old_header, new_header, "header"),
      query: compare(old_query, new_query, "query"),
      event: compare(old_event, new_event, "event"),
      message: compare(old_message, new_message, "message"),
    };
  }, [oldData, newData, targetType]);
  const graphql = useMemo(() => {
    if (!oldData || !newData || targetType !== "graphql") {
      return {};
    }
    const {
      base_info: old_base_info,
      description: old_description,
      cookie: old_cookie,
      header: old_header,
      query: old_query,
      auth: old_auth,
      pre_tasks: old_pre_tasks,
      post_tasks: old_post_tasks,
    } = formatGraphql(oldData);

    const {
      base_info: new_base_info,
      description: new_description,
      header: new_header,
      cookie: new_cookie,
      query: new_query,
      auth: new_auth,
      pre_tasks: new_pre_tasks,
      post_tasks: new_post_tasks,
    } = formatGraphql(newData);
    // This block adds tag and attr only when they are not initial values start
    const old_base_info_temp: any = {
      [`[${i18next.t("supplement.name")}]name`]:
        old_base_info[`[${i18next.t("supplement.name")}]name`],
      "[Method]method": old_base_info["[Method]method"],
      "[URL]url": old_base_info["[URL]url"],
      [`[${i18next.t("supplement.status")}]mark`]:
        old_base_info[`[${i18next.t("supplement.status")}]mark`],
    };
    const new_base_info_temp: any = {
      [`[${i18next.t("supplement.name")}]name`]:
        new_base_info[`[${i18next.t("supplement.name")}]name`],
      "[Method]method": new_base_info["[Method]method"],
      "[URL]url": new_base_info["[URL]url"],
      [`[${i18next.t("supplement.status")}]mark`]:
        new_base_info[`[${i18next.t("supplement.status")}]mark`],
    };

    if (
      (old_base_info[`[${i18next.t("supplement.tag")}]tag`] &&
        size(old_base_info[`[${i18next.t("supplement.tag")}]tag`]) > 0) ||
      (new_base_info[`[${i18next.t("supplement.tag")}]tag`] &&
        size(new_base_info[`[${i18next.t("supplement.tag")}]tag`]) > 0)
    ) {
      old_base_info_temp[`[${i18next.t("supplement.tag")}]tag`] =
        old_base_info[`[${i18next.t("supplement.tag")}]tag`];
      new_base_info_temp[`[${i18next.t("supplement.tag")}]tag`] =
        new_base_info[`[${i18next.t("supplement.tag")}]tag`];
    }
    if (
      (old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`] &&
        size(
          Object.keys(
            old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`],
          ),
        ) > 0) ||
      (new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`] &&
        size(
          Object.keys(
            new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`],
          ),
        ) > 0)
    ) {
      old_base_info_temp[`[${i18next.t("supplement.attr")}]attribute_info`] =
        old_base_info[`[${i18next.t("supplement.attr")}]attribute_info`];
      new_base_info_temp[`[${i18next.t("supplement.attr")}]attribute_info`] =
        new_base_info[`[${i18next.t("supplement.attr")}]attribute_info`];
    }

    // This block adds tag and attr only when they are not initial values end
    return {
      base_info: compare(old_base_info_temp, new_base_info_temp, "base_info"),
      description: compare(old_description, new_description, "description"),
      cookie: compare(old_cookie, new_cookie, "cookie"),
      header: compare(old_header, new_header, "header"),
      query: compare(old_query, new_query, "query"),
      auth: compare(old_auth, new_auth, "auth"),
      pre_tasks: compare(old_pre_tasks, new_pre_tasks, "pre_tasks"),
      post_tasks: compare(old_post_tasks, new_post_tasks, "post_tasks"),
    };
  }, [oldData, newData, targetType]);

  const envs = useMemo(() => {
    if (!oldData || !newData || targetType !== "env") {
      return {};
    }
    const {
      base_info: old_base_info,
      server_list: old_server_list,
      env_var_list: old_env_var_list,
    } = formatEnv(oldData);

    const {
      base_info: new_base_info,
      server_list: new_server_list,
      env_var_list: new_env_var_list,
    } = formatEnv(newData);
    // This block adds tag and attr only when they are not initial values start
    const old_base_info_temp: any = {
      [`[Environment Name]name`]: old_base_info[`[Environment Name]name`],
    };
    const new_base_info_temp: any = {
      [`[Environment Name]name`]: new_base_info[`[Environment Name]name`],
    };

    // This block adds tag and attr only when they are not initial values end
    return {
      base_info: compare(old_base_info_temp, new_base_info_temp, "base_info"),
      server_list: compare(old_server_list, new_server_list, "server_list"),
      env_var_list: compare(old_env_var_list, new_env_var_list, "env_var_list"),
    };
  }, [oldData, newData, targetType]);

  return {
    apis,
    websocket,
    socketio,
    graphql,
    envs,
  };
};
export default useFormat;
