import { md5 } from "@noble/hashes/legacy.js";
import { sha1 } from "@noble/hashes/legacy.js";
import { sha224, sha256 } from "@noble/hashes/sha2.js";
import { sha384, sha512 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

// Synchronous expression pipes, without Node crypto's browser polyfills.
const digest = (hash: (value: Uint8Array) => Uint8Array) => (value: unknown) =>
  bytesToHex(hash(utf8ToBytes(String(value))));
export const MD5 = digest(md5);
export const SHA1 = digest(sha1);
export const SHA224 = digest(sha224);
export const SHA256 = digest(sha256);
export const SHA384 = digest(sha384);
export const SHA512 = digest(sha512);
