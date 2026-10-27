import { lazy, Suspense, useState } from "react";
import { Popover } from "@/shared/ui";
import type { Props } from "./VarInsertPopover";

const VarInsertPopover = lazy(() => import("./VarInsertPopover"));

export default function VarInsertPop(props: Props) {
  const [activated, setActivated] = useState(props.open);
  const trigger = (
    <Popover
      open={props.open}
      placement={props.placement}
      trigger="click"
      onOpenChange={(open) => {
        if (open) {
          setActivated(true);
        }
        props.setOpen(open);
      }}
    >
      {props.children}
    </Popover>
  );
  if (!activated && !props.open) {
    return trigger;
  }
  return (
    <Suspense fallback={trigger}>
      <VarInsertPopover {...props} />
    </Suspense>
  );
}
