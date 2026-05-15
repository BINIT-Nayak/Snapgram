import { Component, ErrorInfo, ReactNode } from "react";
import { useLocation } from "react-router-dom";

import ErrorState from "./ErrorState";

type ErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

class ErrorBoundaryInner extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidUpdate(previousProps: ErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-center h-screen w-full p-5">
          <ErrorState
            message="Something broke while loading this page."
            onRetry={() => window.location.reload()}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

const AppErrorBoundary = ({ children }: { children: ReactNode }) => {
  const location = useLocation();

  return (
    <ErrorBoundaryInner resetKey={location.pathname}>
      {children}
    </ErrorBoundaryInner>
  );
};

export default AppErrorBoundary;
