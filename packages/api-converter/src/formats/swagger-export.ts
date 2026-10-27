import i18next from "i18next";
import { cloneDeep, isArray } from "lodash";
import { DEFAULT_AUTH } from "@onapi/domain/requests/constants/auth";
import { snowflakeId } from "@onapi/domain/utils/data-tools";
import { getSubstring } from "@onapi/domain/request-utils";
import { genUrlByQuery } from "@onapi/domain/request-utils";
import {
  DEFAULT_API_RESPONSE,
  ERROR_RESPONSE,
  SUCCESS_RESPONSE,
} from "@onapi/domain/requests/constants/response";

const appendSwaggerApis = (
  res: any,
  apis: any,
  parentId: string = "0",
  project_id: string,
) => {
  if (isArray(apis) && apis.length) {
    apis.forEach(
      ({
        name,
        kind,
        tags,
        url,
        method,
        description,
        response,
        request,
        children,
        mark_id,
      }) => {
        const targetItem: any = {
          kind,
          description,
          mark_id: mark_id || "1",
          request: {
            auth: cloneDeep(request?.auth || DEFAULT_AUTH),
            pre_tasks: [],
            post_tasks: [],
            header: {
              parameter: request?.header?.parameter || [],
            },
            query: {
              parameter: request?.query?.parameter || [],
            },
            cookie: {
              parameter: request?.cookie?.parameter || [],
            },
            restful: {
              parameter: request?.restful?.parameter || [],
            },
          },
          ai_expect_enable: -1,
          is_check_result: 1,
          is_socket: 1,
          is_locked: -1,
          is_force: -1,
          attribute_info: {},
          protocol: "http/1.1",
          ai_expect: {
            list: [],
            none_math_expect_id: "1",
          },
          project_id,
          id: snowflakeId(),
          parentId,
          sort: 0,
          version: 0,
          server_id: "0",
          status: 1,
        };
        if (kind === "api") {
          targetItem["name"] =
            getSubstring(name, 255) || i18next.t("supplement.new_api");
          targetItem["tags"] = tags || [];
          targetItem["url"] = url || "";
          targetItem["method"] = method || "";
          targetItem["request"] = {
            ...targetItem["request"],
            body: {
              mode: request?.body?.mode || "none",
              parameter: request?.body?.parameter || [],
              raw: request?.body?.raw || "",
              raw_parameter: request?.body?.raw_parameter || [],
              raw_schema: request?.body?.raw_schema || { type: "object" },
              content_type: request?.body?.content_type,
              binary: request?.body?.binary || null,
            },
          };
          const completedResponse = cloneDeep({
            ...DEFAULT_API_RESPONSE,
            ...response,
          });
          const examples = completedResponse.example || [];
          const exampleIds = new Set(
            examples.map(
              (example: { example_id: string }) => example?.example_id,
            ),
          );
          if (!exampleIds.has("2")) {
            examples.unshift(cloneDeep(ERROR_RESPONSE));
          }
          if (!exampleIds.has("1")) {
            examples.unshift(cloneDeep(SUCCESS_RESPONSE));
          }
          completedResponse.example = examples;
          targetItem.response = completedResponse;
          // Regenerate URL from query parameters
          if (
            targetItem.url &&
            isArray(targetItem?.request?.query?.parameter)
          ) {
            const newUrl = genUrlByQuery(
              targetItem.url,
              targetItem?.request?.query?.parameter,
            );
            targetItem.url = newUrl;
          }
          res.apis.push(targetItem);
          if (isArray(children) && children.length) {
            appendSwaggerApis(res, children, targetItem.id, project_id);
          }
        } else if (kind === "folder") {
          targetItem["name"] =
            getSubstring(name, 255) || i18next.t("supplement.new_folder");
          targetItem["request"] = {
            ...targetItem["request"],
            body: {
              parameter: request?.body?.parameter || [],
            },
          };
          res.apis.push(targetItem);
          if (isArray(children) && children.length) {
            appendSwaggerApis(res, children, targetItem.id, project_id);
          }
        }
      },
    );
  }
};

export const completionSwaggerEnv = (res: any, env: any[]) => {
  res["global"]["envs"] = env?.map(({ name, env_var_list, url }: any) => ({
    env_id: snowflakeId(),
    name,
    is_private: -1,
    env_var_list: env_var_list || {},
    server_list: url
      ? [
          {
            name: i18next.t("supplement.default_server"),
            server_id: "1",
            uri: url,
          },
        ]
      : undefined,
  }));
};

export const completionSwaggerApis = (
  res: any,
  apis: any,
  project_id: string,
) => {
  res["apis"] = [];
  appendSwaggerApis(res, apis, res?.config?.folder, project_id);
};
