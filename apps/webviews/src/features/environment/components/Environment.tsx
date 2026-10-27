import styles from "./Environment.module.css";
import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/base";
import { AppIcon } from "@/shared/ui";
import { useTranslation } from "react-i18next";

import { ENV_LOCAL_ITEM, ENV_MANAGE_ENUM } from "@onapi/domain/environment";
import CookieManage from "./CookieManage/CookieManage";
import EnvManage from "./EnvManage/EnvManage";
import ParamsManage from "./ParamsManage";
import VariableManage from "./VariableManage";
import { head } from "lodash-es";
import Menus from "./Menus";
import useProjectConfig from "@/features/project/store/useProjectConfig";
import { snowflakeId } from "@onapi/domain/utils/data-tools";

interface Props {
  open: boolean;
}
const Environment = (props: Props) => {
  const { open } = props;
  const { t } = useTranslation();
  const [selectedKeys, setSelectedKeys] = useState<any[]>([]);
  const serverList = useProjectConfig((state) => state.serverList);
  const {
    http,
    envSettingKeys,
    globalParamsTabKey,
    establish,
    updateHttpEnvironments,
    updateEnvOpen,
    updateEstablish,
    updateEnvSettingKeys,
  } = useProjectConfig();

  const envList = http!.environments;

  useEffect(() => {
    if (open) {
      // setSelectedKeys([ENV_MANAGE_ENUM.cookie]);
      envMenusInit();
    } else {
      updateHttpEnvironments(envList?.filter((e) => !e.isLocal));
      updateEnvSettingKeys("");
    }
  }, [open, envSettingKeys]);

  const envMenusInit = async () => {
    try {
      if (envSettingKeys) {
        if (
          [
            ENV_MANAGE_ENUM.cookie,
            ENV_MANAGE_ENUM.globalParm,
            ENV_MANAGE_ENUM.globalVariable,
          ].includes(envSettingKeys as ENV_MANAGE_ENUM) ||
          envList.some((e) => e.id === envSettingKeys)
        ) {
          setSelectedKeys([envSettingKeys]);
        } else {
          setSelectedKeys([ENV_MANAGE_ENUM.cookie]);
        }
      } else {
        setSelectedKeys([ENV_MANAGE_ENUM.cookie]);
      }
      if (establish) {
        envCreate();
      }
    } catch (err) {
      // updateHttpEnvironments([]);
    }
  };
  useEffect(() => {
    if (establish) {
      envCreate();
    }
  }, [establish]);
  const envCreate = async () => {
    updateEstablish(false);
    try {
      if (envList?.some((e) => e.isLocal)) {
        return;
      }
      const info = {
        name: "New environment",
        values: [],
        isLocal: true,
        id: snowflakeId(),
      };
      setSelectedKeys([info.id]);
      updateHttpEnvironments([...envList, info]);
    } catch (err) {
      // err
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftMenu}>
        <div className={styles.envMenuTop}>
          <Menus
            selectedKeys={selectedKeys}
            setSelectedKeys={setSelectedKeys}
          />
        </div>
        <Button
          className={styles.envMenuNew}
          onClick={envCreate}
          type="dashed"
          icon={<AppIcon icon="plus" className={styles.icon} />}
        >
          {t("global_setting.create")}
        </Button>
      </div>

      <div className={styles.render}>
        {head(selectedKeys) === ENV_MANAGE_ENUM.cookie && <CookieManage />}
        {head(selectedKeys) === ENV_MANAGE_ENUM.globalParm && (
          <ParamsManage defaultTabKey={globalParamsTabKey} />
        )}
        {head(selectedKeys) === ENV_MANAGE_ENUM.globalVariable && (
          <VariableManage />
        )}
        {![
          ENV_MANAGE_ENUM.cookie,
          ENV_MANAGE_ENUM.globalParm,
          ENV_MANAGE_ENUM.globalVariable,
        ].includes(head(selectedKeys)) && (
          <EnvManage
            changeKey={setSelectedKeys}
            editEnvId={head(selectedKeys)}
            envMenus={envList}
          />
        )}
      </div>
    </div>
  );
};

export default Environment;
