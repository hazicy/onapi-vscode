import styles from "../JsonSchemaTable.module.css";
import React, {
  MouseEventHandler,
  memo,
  useEffect,
  useRef,
  useState,
} from "react";

import cn from "classnames";

interface Props {
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  onUpdateWidth: (newWidth: number) => void;
  refTable: any;
}

const SplitBar: React.FC<Props> = (props) => {
  const {
    width = 0,
    minWidth = 200,
    maxWidth = 550,
    onUpdateWidth = () => undefined,
    refTable,
  } = props;

  const [scaling, setScaling] = useState(false);
  const [layoutWidth, setLayoutWidth] = useState(width);
  const [barHeight, setBarHeight] = useState(30);

  const refScaleData = useRef({
    enable: false,
    startX: width,
  });

  useEffect(() => {
    setLayoutWidth(width);
  }, [width]);

  const refSplit: any = useRef(null);

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = (ev) => {
    if (refSplit?.current.contains(ev.target)) {
      const { pageX } = ev;
      refScaleData.current = {
        enable: true,
        startX: pageX,
      };
      setScaling(true);
    }
  };

  // Start adjusting component width and height
  const handleMouseMove = (ev: any) => {
    if (refScaleData.current.enable) {
      const { pageX } = ev;
      const scaledX = pageX - refScaleData.current.startX;
      const newWidth = layoutWidth + scaledX;
      if (newWidth > minWidth) {
        if (newWidth < maxWidth) {
          setLayoutWidth(newWidth);
        } else {
          setLayoutWidth(maxWidth);
        }
      } else {
        setLayoutWidth(minWidth);
      }
    }
  };

  const handleMouseUp = (ev: any) => {
    if (refScaleData.current.enable) {
      const { pageX } = ev;
      const scaledX = pageX - refScaleData.current.startX;
      const newWidth = layoutWidth + scaledX;
      if (newWidth > minWidth) {
        if (newWidth < maxWidth) {
          onUpdateWidth(newWidth);
        } else {
          onUpdateWidth(maxWidth);
        }
      } else {
        onUpdateWidth(minWidth);
      }
    }
    refScaleData.current = {
      enable: false,
      startX: 0,
    };
    setScaling(false);
  };

  useEffect(() => {
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [width]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect;
        setBarHeight(height);
      }
    });
    resizeObserver.observe(refTable.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [refTable]);

  return (
    <>
      <div
        ref={refSplit}
        onMouseDown={handleMouseDown}
        style={{
          left: layoutWidth,
          height: barHeight,
        }}
        className={cn({
          [styles.tdScale]: false,
          [styles.scaling]: scaling,
        })}
      />
    </>
  );
};

export default memo(SplitBar);
