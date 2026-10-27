import { createContext } from "react";

type Props = {
  envId?: string;
  fileValue?: "path" | "base64";
};

const Context = createContext<Props>({
  envId: "",
});

export default Context;
