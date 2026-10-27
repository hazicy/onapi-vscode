export type CustomFunctions = Record<string, unknown>;
export function encryptString(value: string): string;
export function decryptString(value: string): string;
export function getFakerObject(): Array<{
  module: string;
  function: string;
  description?: string | Record<string, string>;
  params: Record<string, unknown>;
  suffix?: string;
}>;
export function mockExp(
  value: string,
  variables?: Record<string, unknown>,
  language?: string,
  customFunctions?: CustomFunctions,
): any;
export function parseExp(
  value: string,
  variables?: Record<string, unknown>,
  language?: string,
  customFunctions?: CustomFunctions,
): {
  dist: { type: string; expression: unknown; value: any };
  functions: Array<{
    function: string;
    paras: unknown;
    tmpValue: unknown;
    isSuccess: boolean;
  }>;
};
export default mockExp;
