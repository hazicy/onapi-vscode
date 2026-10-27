import styles from "./Arrow.module.css";
import AppIcon from "@/shared/ui/AppIcon";
import useTheme from "@/shared/hooks/useTheme";

const Arrow = ({
  activeKey,
  show,
}: {
  activeKey: string | undefined;
  show: boolean;
}) => {
  const { themeToken } = useTheme();
  return (
    <div className={styles.container}>
      {show && (
        <AppIcon
          style={{ fontSize: themeToken.fontSize, color: themeToken.iconColor }}
          icon="chevron-down"
          rotate={activeKey ? 0 : -90}
        />
      )}
    </div>
  );
};

export default Arrow;
