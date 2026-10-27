import { useRef, useState, type KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { Popover } from "@base-ui/react/popover";

import AppIcon from "@/shared/ui/AppIcon";
import DropContent from "./DropContent";
import styles from "./AiDescription.module.css";

interface Props {
  onChange?: (val: string) => void;
  filterKey?: string;
}

const AiDescription = ({ onChange, filterKey }: Props) => {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const { t } = useTranslation();
  const dismissOnEscape = (event: KeyboardEvent) => {
    if (event.key !== "Escape" || !open) {
      return;
    }
    // Handle this before a description's tooltip consumes Escape.
    event.preventDefault();
    event.stopPropagation();
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        ref={triggerRef}
        onKeyDownCapture={dismissOnEscape}
        className={styles.trigger}
        aria-label={t("settings.description.title")}
      >
        <AppIcon icon="sparkles" aria-hidden="true" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className={styles.positioner}
          side="bottom"
          align="end"
          sideOffset={4}
        >
          <Popover.Popup
            className={styles.popup}
            onKeyDownCapture={dismissOnEscape}
          >
            <DropContent
              handleSelect={() => setOpen(false)}
              onChange={onChange}
              filterKey={filterKey}
            />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default AiDescription;
