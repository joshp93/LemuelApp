import { Component, type ErrorInfo, type ReactNode } from "react";
import { View } from "react-native";
import { remoteLog } from "../api/remote-logger";
import { Text } from "./themed-text";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    remoteLog("error", "[ErrorBoundary] Caught rendering error", {
      error: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <View style={{ padding: 16 }}>
            <Text style={{ color: "#999" }}>Something went wrong</Text>
          </View>
        )
      );
    }
    return this.props.children;
  }
}
