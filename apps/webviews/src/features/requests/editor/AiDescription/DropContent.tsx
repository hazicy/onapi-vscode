import { Tooltip } from "@base-ui/react/tooltip";
import { isArray, isString, trim } from "lodash";

import useProjectSetting from "@/features/project/store/useProjectSetting";
import useUserConfig from "@/features/auth/store/useUserConfig";

import styles from "./AiDescription.module.css";

interface Props {
  onChange?: (description: string) => void;
  filterKey?: string;
  handleSelect: () => void;
}

const DropContent = ({ onChange, filterKey, handleSelect }: Props) => {
  const { descriptionList, innerDescriptionList } = useProjectSetting();
  const includeBuiltIn = useUserConfig(
    (state) => state.currentProject?.is_describe_library === 1,
  );
  const descriptions = [
    ...(isArray(descriptionList) ? descriptionList : []),
    ...(includeBuiltIn && isArray(innerDescriptionList)
      ? innerDescriptionList
      : []),
  ];
  const key = isString(filterKey) ? trim(filterKey) : "";

  return (
    <Tooltip.Provider delay={500}>
      <div className={styles.list}>
        {descriptions.map((item) => {
          if (
            !isString(item?.key) ||
            !item.key.length ||
            !isString(item?.description) ||
            !item.description.length ||
            (key && key !== trim(item.key))
          ) {
            return null;
          }
          return (
            <Tooltip.Root key={item.id || item.key}>
              <Tooltip.Trigger
                className={styles.item}
                aria-label={item.description}
                onClick={() => {
                  handleSelect();
                  onChange?.(item.description);
                }}
              >
                {item.description}
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner
                  className={styles.tooltipPositioner}
                  side="top"
                  align="start"
                  sideOffset={4}
                >
                  <Tooltip.Popup className={styles.tooltip}>
                    {item.description}
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          );
        })}
      </div>
    </Tooltip.Provider>
  );
};

export default DropContent;
