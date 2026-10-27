import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { Input, message } from "@/shared/ui/base";

import { Modal } from "@/shared/ui/Modal";

interface Props {
  open: boolean;
  type: "add" | "modify";
  onCancel: () => void;
  onConfirm: (v: string) => void;
  value: string;
}

const Index = (props: Props) => {
  const { t } = useTranslation();
  const { open, type, value, onCancel, onConfirm } = props;
  const [serverName, setServerName] = useState("");

  useEffect(() => {
    if (type === "add") {
      setServerName("");
    } else {
      setServerName(value);
    }
  }, [type, value, open]);

  useEffect(() => {
    if (!open) {
      setServerName("");
    }
  }, [open]);

  const handleOk = () => {
    if (serverName?.trim()?.length === 0) {
      message.error(t("supplement.service_not_empty"));
      return;
    }
    onConfirm(serverName);
  };

  return (
    <Modal
      centered
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      title={
        type === "add"
          ? t("global_setting.environment_detail.add_server")
          : t("global_setting.environment_detail.edit_name")
      }
    >
      <Input
        placeholder={t("global_setting.environment_detail.input_tip")}
        value={serverName}
        maxLength={128}
        onChange={(e) => setServerName(e.target.value)}
      />
    </Modal>
  );
};

export default Index;
