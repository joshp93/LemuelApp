import { useEffect } from "react";
import type { TextInput } from "react-native";
import {
  KeyboardAvoidingView,
  type KeyboardAvoidingViewProps,
} from "react-native-keyboard-controller";

export type LemuelKeyboardAvoidingViewProps = KeyboardAvoidingViewProps & {
  navigationSafeAutoFocus?: React.RefObject<TextInput | null>;
};

/**
 * Wraps `KeyboardAvoidingView` from `react-native-keyboard-controller`.
 *
 * When `navigationSafeAutoFocus` is provided, focuses the input on mount.
 * This is more reliable than `autoFocus` which can fire before the input
 * is ready during navigation transitions.
 *
 * @example
 * ```tsx
 * const inputRef = useRef<TextInput>(null);
 *
 * <LemuelKeyboardAvoidingView
 *   behavior="padding"
 *   navigationSafeAutoFocus={inputRef}
 * >
 *   <TextInput ref={inputRef} />
 * </LemuelKeyboardAvoidingView>
 * ```
 */
export function LemuelKeyboardAvoidingView({
  navigationSafeAutoFocus,
  children,
  ...props
}: LemuelKeyboardAvoidingViewProps) {
  useEffect(() => {
    setTimeout(() => {
      navigationSafeAutoFocus?.current?.focus();
    }, 100);
  }, []);

  return <KeyboardAvoidingView {...props}>{children}</KeyboardAvoidingView>;
}
