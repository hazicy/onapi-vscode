import styles from "./ValueInput.module.css";
import { Input } from "@/shared/ui/base";

interface Props {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

const lineHeight = 36;

const Index = (props: Props) => {
  const { value, onChange, disabled } = props;

  const handlerInput = (e: any) => {
    const tar = e.target as HTMLTextAreaElement,
      scrollHeight = tar?.scrollHeight;

    if (scrollHeight <= lineHeight || tar.value.length === 0) {
      tar.style.height = lineHeight + "px";
    } else {
      tar.style.height = scrollHeight + "px";
    }
  };

  const handlerBlur = (e: any) => {
    const tar = e.target as HTMLTextAreaElement;
    tar.style.height = 36 + "px";
  };

  return (
    <div className={styles.container}>
      <div className={styles.valueInputTextarea}>
        <Input.TextArea
          disabled={disabled}
          autoSize={false}
          style={{
            position: "absolute",
            top: 0,
            height: "36px !important",
            lineHeight: "24px",
          }}
          placeholder={""}
          value={value || ""}
          onInput={handlerInput}
          onFocus={handlerInput}
          onBlur={handlerBlur}
          onChange={(e) => onChange?.(e.target.value)}
          onKeyDown={(e) => {
            const keyCode = e.keyCode || e.which;
            if (keyCode === 38 || keyCode === 40 || keyCode === 13) {
              e.preventDefault();
            }
          }}
          inputClassName={styles.input}
        />
      </div>
    </div>
  );
};

export default Index;
