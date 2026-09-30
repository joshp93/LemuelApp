import { ActivityIndicator, StyleSheet, View } from "react-native";

/** Colour of the shared loading spinner. */
const SPINNER_COLOR = "#333";

type LemuelLoadingScreenProps = {
  /** Identifier used by tests to assert the loading state is showing. */
  testID?: string;
};

/**
 * Centred spinner shown in place of a page's content while it loads. Inherits
 * its background from the screen around it, so it can be dropped into any
 * container that has a height to fill.
 *
 * @param props - Component props.
 * @param props.testID - Defaults to `lemuel-loading`.
 */
export const LemuelLoadingScreen = ({
  testID = "lemuel-loading",
}: LemuelLoadingScreenProps) => (
  <View style={styles.container}>
    <ActivityIndicator size="large" color={SPINNER_COLOR} testID={testID} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
