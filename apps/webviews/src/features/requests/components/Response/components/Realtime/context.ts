import { createContext } from "react";

import { DirectionType } from "@onapi/http-model/types/common";

type Props = {
  direction: DirectionType | "";
};

const Context = createContext<Props>({
  direction: "",
});

export default Context;
