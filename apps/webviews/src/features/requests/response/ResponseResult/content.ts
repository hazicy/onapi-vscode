/** Content shared by socket messages and response previews, without HTTP metadata. */
export type ResponseContent = {
  bytes?: ArrayBuffer;
  format?: string;
  mime?: string;
  display?: string;
  size?: number;
};
