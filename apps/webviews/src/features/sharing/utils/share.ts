import useShare from "@/features/sharing/store/useShare";
import { copyStringToClipboard } from "../../../shared/utils/common";

// Copy share API link to clipboard
export const copyApiDocsUrlToClipboard = (
  id: string,
  onSuccess?: () => void,
) => {
  const { docBaseUrl } = useShare.getState();
  copyStringToClipboard(`${docBaseUrl}?share_id=${id}`, onSuccess);
};

export const getApiDocsUrlById = (id: string) => {
  const { docBaseUrl } = useShare.getState();
  return `${docBaseUrl}?share_id=${id}`;
};
