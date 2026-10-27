import {
  InputNumber as BaseInputNumber,
  InputNumberProps,
} from "@/shared/ui/base";

import {
  MAX_INPUT_NUMBER_LENGTH,
  MIN_INPUT_NUMBER_LENGTH,
} from "@/shared/constants/form";

const InputNumber = (props: InputNumberProps) => {
  return (
    <BaseInputNumber
      max={MAX_INPUT_NUMBER_LENGTH}
      min={MIN_INPUT_NUMBER_LENGTH}
      {...props}
    />
  );
};

export default InputNumber;
