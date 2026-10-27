import { bufferToRaw } from "@onapi/domain/utils/response-tools";
import { isString } from "lodash";

export const parseStreamToRaw: (
  stream: ArrayBuffer | undefined,
  mimeType: object,
  encode?: string,
) => string = (stream, mimeType, encode = "utf8") => {
  const decoded = bufferToRaw(stream, mimeType);
  const { buffer } = decoded;

  let rawBody = decoded.raw;
  const rawEncode = isString(encode) ? encode : "utf8";

  try {
    rawBody = new TextDecoder(rawEncode).decode(buffer);
  } catch (error) {}

  return rawBody;
};

export const parseStreamToBody: (
  stream: ArrayBuffer,
  mimeType: object,
  encode?: string,
) => {
  rawBody: string;
  base64Body: string;
} = (stream, mimeType, encode = "utf8") => {
  const decoded = bufferToRaw(stream, mimeType);
  let rawBody = decoded.raw;

  try {
    if (rawBody.indexOf("�") > -1) {
      rawBody = new TextDecoder("gbk").decode(decoded.buffer);
    } else {
      rawBody = new TextDecoder(encode).decode(decoded.buffer);
    }
  } catch (error) {}

  const base64Body = decoded.base64;

  return {
    rawBody,
    base64Body,
  };
};
