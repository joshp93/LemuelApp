import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

const SCREENSHOT_ASPECT_RATIO = 810 / 1440;

interface OnboardingScreenshotProps {
  source: ImageSourcePropType;
  /** Share of the screen height the screenshot may use. */
  heightRatio?: number;
  /** Upper bound for the screenshot height, in pixels. */
  maxHeight?: number;
}

/**
 * Displays a framed reference screenshot at its native aspect ratio.
 *
 * @param props - The image source and its height constraints.
 * @returns The sized screenshot.
 */
export function OnboardingScreenshot({
  source,
  heightRatio = 0.36,
  maxHeight = 340,
}: OnboardingScreenshotProps) {
  const { height } = useWindowDimensions();
  const imageHeight = Math.min(maxHeight, Math.max(200, height * heightRatio));

  return (
    <Image
      accessible={false}
      resizeMode="contain"
      source={source}
      style={[
        styles.image,
        {
          width: imageHeight * SCREENSHOT_ASPECT_RATIO,
          height: imageHeight,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    alignSelf: "center",
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#333333",
  },
});
