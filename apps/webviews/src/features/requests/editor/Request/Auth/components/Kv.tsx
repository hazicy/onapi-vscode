import { AuthField } from "../AuthField";
import { useTranslation } from "react-i18next";

import { Input, Select } from "@/shared/ui/base";

import { map } from "lodash-es";

import VarInput from "@/features/variables/components/VarInput/VarInput";
import {
  AUTH_APIKEY_LOCATION,
  AUTH_ENUM,
} from "@onapi/domain/requests/constants/auth";

const Kv = () => {
  const { t } = useTranslation();
  const options = map(AUTH_APIKEY_LOCATION, ({ value, label }) => ({
    value,
    label,
  }));
  return (
    <>
      <AuthField label="Key" name={[AUTH_ENUM.KV, "key"]}>
        <Input.TextArea autoSize placeholder={t("common.auth.key_tip")} />
      </AuthField>
      <AuthField label="Value" name={[AUTH_ENUM.KV, "value"]}>
        <VarInput
          multiline
          hasBorder
          placeholder={t("common.auth.value_tip")}
        />
      </AuthField>
      <AuthField label={t("common.auth.add_to")} name={[AUTH_ENUM.KV, "in"]}>
        <Select options={options} />
      </AuthField>
    </>
  );
};

export default Kv;
