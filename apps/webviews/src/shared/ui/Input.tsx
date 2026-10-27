import { Input as BaseInput, InputProps } from "@/shared/ui/base";

import { MAX_INPUT_LENGTH } from "@/shared/constants/form";

const Input = (props: InputProps) => {
  return <BaseInput maxLength={MAX_INPUT_LENGTH} {...props} />;
};

export default Input;
