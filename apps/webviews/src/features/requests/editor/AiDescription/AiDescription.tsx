import { useState } from "react";
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
  const { t } = useTranslation();

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
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
          <Popover.Popup className={styles.popup}>
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
