import { AuthField } from "../AuthField";
import { useTranslation } from "react-i18next";

import VarInput from "@/features/variables/components/VarInput/VarInput";
import { AUTH_ENUM } from "@onapi/domain/requests/constants/auth";

const Bearer = () => {
  const { t } = useTranslation();
  return (
    <>
      <AuthField label="Token" name={[AUTH_ENUM.BEARER, "key"]}>
        <VarInput
          multiline
          maxLength={10240}
          hasBorder
          placeholder={t("common.auth.token_tip")}
        />
      </AuthField>
    </>
  );
};

export default Bearer;
