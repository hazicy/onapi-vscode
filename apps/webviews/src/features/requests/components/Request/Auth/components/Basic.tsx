import { AuthField } from "../AuthField";
import { useTranslation } from "react-i18next";

import VarInput from "@/features/variables/components/VarInput";
import { AUTH_ENUM } from "@onapi/http-model/requests/constants/auth";

const Basic = () => {
  const { t } = useTranslation();
  return (
    <>
      <AuthField label="Username" name={[AUTH_ENUM.BASIC, "username"]}>
        <VarInput
          multiline
          hasBorder
          placeholder={t("common.auth.username_tip")}
        />
      </AuthField>
      <AuthField label="Password" name={[AUTH_ENUM.BASIC, "password"]}>
        <VarInput multiline hasBorder placeholder={t("common.auth.pwd_tip")} />
      </AuthField>
    </>
  );
};

export default Basic;
