import { FC } from "react";

import { Upload as BaseUpload, UploadProps } from "@/shared/ui/base";
import {
  APIPOST_MACHINE,
  APIPOST_PLATFORM,
  APIPOST_TERMINAL,
  APIPOST_VERSION,
} from "@onapi/domain/auth/constants/user";

type Props = UploadProps;

const defaultHeaders = {
  [APIPOST_MACHINE]: "",
  [APIPOST_TERMINAL]: "vscode",
  [APIPOST_VERSION]: "1.0.0",
  [APIPOST_PLATFORM]: "",
};
const defaultData = { business: 2 };

const Upload: FC<Props> = ({
  action = "/api/upload",
  name = "file",
  headers = defaultHeaders,
  data = defaultData,
  ...props
}) => (
  <BaseUpload
    action={action}
    name={name}
    headers={headers}
    data={data}
    {...props}
  />
);

export default Upload;
