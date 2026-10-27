import { FC } from "react";

import { Tooltip as BaseTooltip, TooltipProps } from "@/shared/ui/base";

type Props = TooltipProps;

const Tooltip: FC<Props> = ({ mouseEnterDelay = 0.5, ...props }) => {
  return <BaseTooltip mouseEnterDelay={mouseEnterDelay} {...props} />;
};

export default Tooltip;
