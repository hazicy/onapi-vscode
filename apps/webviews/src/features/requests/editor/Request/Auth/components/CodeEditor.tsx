import "../style.css";
import styles from "../Auth.module.css";
import CodeEditor from "@/shared/components/CodeEditor/CodeEditor";

const AuthCodeEditor = (props: any) => {
  return (
    <div className={styles.code}>
      <CodeEditor
        language="json"
        height="100%"
        value={props?.value || ""}
        onChange={props?.onChange}
      />
    </div>
  );
};

export default AuthCodeEditor;
