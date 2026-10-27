import { createContext } from "react";

type Props = {
  showError: boolean;
  errorMsg: string;
};

const Context = createContext<Props>({
  showError: false,
  errorMsg: "",
});

export default Context;
