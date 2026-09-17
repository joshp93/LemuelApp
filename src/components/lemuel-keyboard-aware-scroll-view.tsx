import { useEffect } from "react";
import type { TextInput } from "react-native";
import {
  KeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-controller";

export type LemuelKeyboardAwareScrollViewProps =
  KeyboardAwareScrollViewProps & {
    navigationSafeAutoFocus?: React.RefObject<TextInput | null>;
  };

/**
 * Wraps `KeyboardAwareScrollView` from `react-native-keyboard-controller`.
 *
 * When `navigationSafeAutoFocus` is provided, focuses the input on mount.
 * This is more reliable than `autoFocus` which can fire before the input
 * is ready during navigation transitions.
 *
 * @example
 * ```tsx
 * const inputRef = useRef<TextInput>(null);
 *
 * <LemuelKeyboardAwareScrollView
 *   navigationSafeAutoFocus={inputRef}
 * >
 *   <TextInput ref={inputRef} />
 * </LemuelKeyboardAwareScrollView>
 * ```
 */
export function LemuelKeyboardAwareScrollView({
  navigationSafeAutoFocus,
  children,
  ...props
}: LemuelKeyboardAwareScrollViewProps) {
  useEffect(() => {
    setTimeout(() => {
      navigationSafeAutoFocus?.current?.focus();
    }, 100);
  }, []);

  return (
    <KeyboardAwareScrollView {...props}>{children}</KeyboardAwareScrollView>
  );
}
