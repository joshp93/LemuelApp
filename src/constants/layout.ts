import { Platform, type ViewStyle } from "react-native";

/**
 * Maximum width of a page's content column on wide viewports.
 */
export const MAX_CONTENT_WIDTH = 1024;

/**
 * Inset between page content and the edge of its column, applied by every
 * page and matched by the header so that header controls line up with the
 * content below.
 */
export const CONTENT_INSET = 16;

/**
 * Style that caps and centres a page's content column.
 *
 * Applied to a page's scroll content rather than its scroll container, so
 * the scroll bar stays at the edge of the viewport. Native viewports are
 * narrower than {@link MAX_CONTENT_WIDTH}, so the content fills the screen.
 */
export const CONTENT_COLUMN: ViewStyle =
  Platform.select<ViewStyle>({
    web: {
      width: "100%",
      maxWidth: MAX_CONTENT_WIDTH,
      alignSelf: "center",
    },
    default: {},
  }) ?? {};
