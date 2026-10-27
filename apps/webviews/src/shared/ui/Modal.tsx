import type { ModalFuncProps, ModalProps } from "@/shared/ui/base";
import { Flex, Modal } from "@/shared/ui/base";

import { map, size } from "lodash-es";

import Button, { ButtonProps } from "@/shared/ui/Button";
import useTheme from "@/shared/hooks/useTheme";
import useUiServices from "@/shared/state/ui-services";

const defaultProps = {
  centered: true, // default centered display
  keyboard: true, // default supporting keyboard esc close
  focusTriggerAfterClose: false, // default not auto focus
  maskClosable: false, // default clicking mask does not close
};

const CustomModal = (props: ModalProps) => {
  const { themeToken } = useTheme();

  const defaultStyles = {
    content: {
      padding: `${themeToken.padding}px ${themeToken.paddingMD}px`,
    },
    header: {
      marginBottom: themeToken.margin,
    },
    body: {},
  };

  const modalProps: ModalProps = {
    ...defaultProps,
    ...props,
    styles: {
      ...props.styles,
      content: {
        ...defaultStyles.content,
        ...props.styles?.content,
      },
      header: {
        ...defaultStyles.header,
        ...props.styles?.header,
      },
      body: {
        ...props.styles?.body,
      },
    },
  };
  return <Modal {...modalProps} />;
};

const promiseModalConfirm = (
  config: ModalFuncProps & {
    footerBtnList?: {
      text: string;
      action: string;
      buttonProps?: ButtonProps;
    }[];
  },
) => {
  const { footerBtnList, ...otherConfig } = config;
  const { modal } = useUiServices.getState();

  return new Promise((resolve) => {
    const finalConfig = { ...otherConfig };

    if (size(footerBtnList) > 0) {
      finalConfig.footer = () => (
        <Flex align="center" justify="flex-end">
          {map(footerBtnList, (item, index) => (
            <Button
              key={`${item.action}-${index}`}
              onClick={() => {
                resolve(item.action);
                modalInstance?.destroy();
              }}
              {...item?.buttonProps}
            >
              {item.text}
            </Button>
          ))}
        </Flex>
      );
    }

    const modalInstance = modal?.confirm(finalConfig);
  });
};

export { Modal, promiseModalConfirm };

export default CustomModal;
