import { getSubstring } from "@onapi/http-model/request-utils";
import { snowflakeId } from "@onapi/http-model/utils/data-tools";
import { has } from "lodash";
import {
  completionApis,
  completionEnv,
  completionSamples,
  completionServers,
} from "@onapi/api-converter/formats/native-export";

export const apiConverFormat = (json: any, project_id: string) => {
  const {
    name: projectName = "",
    intro: projectIntro = "",
    global,
    models,
    apis,
    samples,
  } = json || {};
  const { envs, servers } = global || {};
  const serversMap = servers?.reduce(
    (pre: { [key: string]: string }, item: any) => {
      if (["1", "2"].includes(item?.server_id)) {
        pre[item?.server_id] = item?.server_id;
      } else {
        pre[item?.server_id] = snowflakeId();
      }
      return pre;
    },
    {},
  );
  const envMap: { [k: string]: string } = {};
  const modelsMap = models?.reduce(
    (pre: { [key: string]: string }, e: any) => {
      if (e?.model_id && !has(pre, e?.model_id)) {
        pre[e?.model_id] = snowflakeId();
      }
      if (e?.parentId && !has(pre, e?.parentId)) {
        pre[e?.parentId] = snowflakeId();
      }
      return pre;
    },
    { "0": "0" } as { [key: string]: string },
  );
  const apiMap = apis?.reduce(
    (pre: { [key: string]: string }, e: any) => {
      if (e?.id && !has(pre, e?.id)) {
        pre[e?.id] = snowflakeId();
      }
      if (e?.parentId && !has(pre, e?.parentId)) {
        pre[e?.parentId] = snowflakeId();
      }
      return pre;
    },
    { "0": "0" } as { [key: string]: string },
  );
  const sampleMap = samples?.reduce(
    (pre: { [key: string]: string }, e: any) => {
      if (e?.sample_id && !has(pre, e?.sample_id)) {
        pre[e?.sample_id] = snowflakeId();
      }
      if (e?.parentId && !has(pre, e?.parentId)) {
        pre[e?.parentId] = snowflakeId();
      }
      return pre;
    },
    { "0": "0" },
  );

  try {
    // Do not change the order
    const res = {
      project_id,
      name: getSubstring(projectName, 64),
      intro: getSubstring(projectIntro, 1024),
      global: {
        envs: completionEnv(envs, envMap, serversMap),
        servers: completionServers(servers, serversMap),
      },
      apis: completionApis(apis, apiMap, modelsMap, serversMap, project_id),
      samples: completionSamples(
        samples,
        apiMap,
        sampleMap,
        modelsMap,
        project_id,
      ),
    };

    return res;
  } catch (err) {
    return {};
  }
};
