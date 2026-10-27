import { useTranslation } from "react-i18next";

import { Flex, Input, Upload, message } from "@/shared/ui/base";

import Button from "@/shared/ui/Button";

const PrivateCom = (props: any) => {
  const { t } = useTranslation();
  const customRequest = (e: any) => {
    if (e?.file && e?.file?.type === "application/x-x509-ca-cert") {
      const reader = new FileReader();
      reader.onload = function () {
        props?.onChange(reader?.result);
      };
      reader.readAsText(e?.file);
    } else {
      message.info(t("supplement.upload_ok_file"));
    }
  };
  return (
    <Flex gap={6} vertical>
      <Input.TextArea
        value={props?.value || ""}
        onChange={(e) => props?.onChange(e?.target?.value)}
        autoSize={{ minRows: 4, maxRows: 6 }}
      />
      <Upload
        customRequest={customRequest}
        showUploadList={false}
        accept=".pem,.crt,.cer"
      >
        <Button size="small" type="primary">
          Select File
        </Button>
      </Upload>
    </Flex>
  );
};

export default PrivateCom;
