import uploadStyles from "./Upload.module.css";
import { useEffect, useRef, useState } from "react";
import cx from "classnames";
import type { RcFile, UploadFile, UploadProps } from "./types";

const IGNORE = Symbol("ignore-file");
export function acceptsFile(file: File, accept?: string) {
  if (!accept) {
    return true;
  }
  return accept.split(",").some((entry) => {
    const rule = entry.trim().toLowerCase();
    if (!rule) {
      return false;
    }
    if (rule.startsWith(".")) {
      return file.name.toLowerCase().endsWith(rule);
    }
    if (!file.type) {
      return true;
    }
    return rule.endsWith("/*")
      ? file.type.toLowerCase().startsWith(rule.slice(0, -1))
      : file.type.toLowerCase() === rule;
  });
}
function FilePicker({
  itemClassName,

  fileList,
  defaultFileList = [],
  onChange,
  beforeUpload,
  onRemove,
  maxCount,
  showUploadList = true,
  className,
  children,
  iconRender,
  accept,
  multiple,
  disabled,
  customRequest,
  onDrop,
  style,
  ...props
}: UploadProps) {
  const [internal, setInternal] = useState<UploadFile[]>(defaultFileList);
  const files = fileList ?? internal;
  const filesRef = useRef(files);
  filesRef.current = files;
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(true);
  const canceled = useRef(new Set<string>());
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const update = (file: UploadFile) => {
    if (!mounted.current || canceled.current.has(file.uid)) {
      return;
    }
    let list = [
      ...filesRef.current.filter((item) => item.uid !== file.uid),
      file,
    ];
    if (maxCount && list.length > maxCount) {
      list
        .slice(0, -maxCount)
        .forEach((item) => canceled.current.add(item.uid));
      list = list.slice(-maxCount);
    }
    filesRef.current = list;
    setInternal(list);
    onChange?.({ file, fileList: list });
  };
  const choose = async (selected: File[]) => {
    if (disabled) {
      return;
    }
    const list = (multiple ? selected : selected.slice(0, 1))
      .filter((file) => acceptsFile(file, accept))
      .map(
        (file) => Object.assign(file, { uid: crypto.randomUUID() }) as RcFile,
      );
    for (const file of list) {
      try {
        const result = await beforeUpload?.(file, list);
        if (result === IGNORE) {
          continue;
        }
        const original = {
          uid: file.uid,
          name: file.name,
          size: file.size,
          type: file.type,
          originFileObj: file,
        };
        if (result === false) {
          update(original);
          continue;
        }
        const processed = result instanceof Blob ? result : file;
        if (!customRequest) {
          update({ ...original, status: "done" });
          continue;
        }
        update({ ...original, status: "uploading" });
        await customRequest({
          file: processed,
          filename: props.name ?? "file",
          onSuccess: (response: unknown) =>
            update({ ...original, status: "done", response }),
          onError: (error: Error, response?: unknown) =>
            update({ ...original, status: "error", response }),
          onProgress: (event: { percent?: number }) =>
            update({
              ...original,
              status: "uploading",
              percent: event.percent,
            }),
        });
      } catch (error) {
        update({
          uid: file.uid,
          name: file.name,
          originFileObj: file,
          status: "error",
          response: error,
        });
      }
    }
  };
  return (
    <div className={cx(uploadStyles.upload, className)} style={style}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={!!disabled}
        aria-label={props["aria-label"] ?? "Choose file"}
        onClick={(event) => {
          if (!disabled && event.target !== input.current) {
            input.current?.click();
          }
        }}
        onKeyDown={(event) => {
          if (
            !disabled &&
            event.target === event.currentTarget &&
            ["Enter", " "].includes(event.key)
          ) {
            event.preventDefault();
            input.current?.click();
          }
        }}
        onDragOver={(event) => {
          if (!disabled && event.dataTransfer.types.includes("Files")) {
            event.preventDefault();
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (!disabled) {
            onDrop?.(event);
            void choose(Array.from(event.dataTransfer.files));
          }
        }}
      >
        <input
          ref={input}
          type="file"
          hidden
          disabled={disabled}
          accept={accept}
          multiple={multiple}
          onChange={(event) => {
            const selected = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            void choose(selected);
          }}
        />
        {children}
      </div>
      {showUploadList &&
        files.map((file) => (
          <div key={file.uid} className={itemClassName}>
            {iconRender?.(file)}
            {file.name}
            <button
              type="button"
              aria-label={`Remove ${file.name}`}
              disabled={disabled}
              onClick={async () => {
                if ((await onRemove?.(file)) === false) {
                  return;
                }
                canceled.current.add(file.uid);
                const next = filesRef.current.filter(
                  (item) => item.uid !== file.uid,
                );
                filesRef.current = next;
                setInternal(next);
                onChange?.({
                  file: { ...file, status: "removed" },
                  fileList: next,
                });
              }}
            >
              ×
            </button>
          </div>
        ))}
    </div>
  );
}
export const Upload = Object.assign(FilePicker, {
  Dragger: ({ children, ...props }: UploadProps) => (
    <FilePicker {...props}>
      <div className={uploadStyles.dropzone}>{children}</div>
    </FilePicker>
  ),
  LIST_IGNORE: IGNORE,
});
