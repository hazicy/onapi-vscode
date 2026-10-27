/** Fail immediately if a test leaves its declared execution path. */
export const unexpectedCall = () => {
  throw new Error("Unexpected call to an unexercised test dependency");
};
