import { Component, ErrorInfo, ReactNode } from "react";
import i18next from "i18next";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    //@ts-expect-error Check if window.errorReport exists before calling
    if (window?.errorReport) {
      //@ts-expect-error Ignore error
      window.errorReport(null, error);
    }
    // When an error occurs, set hasError to true
    return { hasError: true };
  }

  public componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    //error: Error, errorInfo: ErrorInfo
    // You can send error info to logging service here
  }

  public render() {
    if (this.state.hasError) {
      return <div role="alert">{i18next.t("common.failed")}</div>;
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
