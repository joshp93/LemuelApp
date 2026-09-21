import { reloadAndroidWidgets, updateAndroidWidget, VoltraAndroid } from "@use-voltra/android-client";
import React from "react";
import { remoteLog } from "../api/remote-logger";
import { COLORS } from "../constants/theme";
import type { Proverb } from "../models/proverb";

/** Default deep-link URL for the Voltra widget to open the app. */
const DEEP_LINK_URL = "lemuel://";

/** Default prose font family used in the widget text. */
const FONT_FAMILY = "nunito_400regular";

/** Shared theme values used by the widget component. */
const WIDGET_STYLES = {
  padding: 16,
  backgroundColor: COLORS.lightBackground,
  borderRadius: 16,
} as const;

/**
 * Triggers an immediate reload of all proverb widgets on the home screen.
 * Called on every app launch so the widget reflects the current proverb
 * without waiting for the next WorkManager interval (60 min).
 */
export const initializeWidget = async (): Promise<void> => {
  remoteLog("debug", "[Widget] Triggering immediate widget reload");
  await reloadAndroidWidgets(["proverb_widget"]);
  remoteLog("debug", "[Widget] Widget reload complete");
};

/** Props for the {@link ProverbWidgetComponent}. */
interface ProverbWidgetProps {
  proverb: Proverb | null;
}

/**
 * Voltra widget component that renders a daily proverb or a loading/empty
 * state when no proverb is available.
 */
const ProverbWidgetComponent = ({ proverb }: ProverbWidgetProps) => (
  <VoltraAndroid.Box deepLinkUrl={DEEP_LINK_URL}>
    {proverb ? (
      <WidgetContent proverb={proverb} />
    ) : (
      <WidgetPlaceholder />
    )}
  </VoltraAndroid.Box>
);

/** Renders the proverb reference, text, and citation. */
const WidgetContent = ({ proverb }: { proverb: Proverb }) => (
  <VoltraAndroid.Column
    deepLinkUrl={DEEP_LINK_URL}
    style={{
      ...WIDGET_STYLES,
      width: "100%",
      height: "100%",
    }}
  >
    <VoltraAndroid.LazyColumn
      deepLinkUrl={DEEP_LINK_URL}
      horizontalAlignment="start"
      style={{ width: "100%", height: "100%" }}
    >
      <VoltraAndroid.Text
        deepLinkUrl={DEEP_LINK_URL}
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: "#333333",
          fontFamily: FONT_FAMILY,
          paddingBottom: 12,
        }}
      >
        {proverb.ref}
      </VoltraAndroid.Text>
      <VoltraAndroid.Text
        deepLinkUrl={DEEP_LINK_URL}
        style={{
          fontSize: 18,
          color: "#1a1a1a",
          fontFamily: FONT_FAMILY,
          paddingBottom: 12,
        }}
      >
        {proverb.proverb}
      </VoltraAndroid.Text>
      {proverb.citation && (
        <VoltraAndroid.Text
          deepLinkUrl={DEEP_LINK_URL}
          style={{
            fontSize: 10,
            color: "#666666",
            textAlign: "left",
            fontFamily: FONT_FAMILY,
          }}
        >
          {proverb.citation}
        </VoltraAndroid.Text>
      )}
    </VoltraAndroid.LazyColumn>
  </VoltraAndroid.Column>
);

/** Renders the initial prompt shown before the first server fetch succeeds. */
const WidgetPlaceholder = () => (
  <VoltraAndroid.Column
    deepLinkUrl={DEEP_LINK_URL}
    verticalAlignment="center-vertically"
    horizontalAlignment="center-horizontally"
    style={{
      ...WIDGET_STYLES,
      width: "100%",
      height: "100%",
    }}
  >
    <VoltraAndroid.Text
      deepLinkUrl={DEEP_LINK_URL}
      style={{
        fontSize: 16,
        fontWeight: "bold",
        color: "#333333",
        textAlign: "center",
        fontFamily: FONT_FAMILY,
      }}
    >
      Please open the Lemuel app once to activate the widget.
    </VoltraAndroid.Text>
  </VoltraAndroid.Column>
);

export { ProverbWidgetComponent as ProverbWidget };
export type { ProverbWidgetProps };

/** Creates a React element tree for widget content at a fixed size. */
const widgetContent = (proverb: Proverb | null) =>
  React.createElement(ProverbWidgetComponent, { proverb });

/**
 * Updates the proverb widget on the Android home screen with new content.
 * This pushes updated RemoteViews to the AppWidgetManager for the
 * configured widget size (250x250dp).
 * @param proverb - The proverb to display, or null to show the placeholder.
 */
export const updateProverbWidget = async (proverb: Proverb | null) => {
  remoteLog("debug", "[ProverbWidget] Updating widget", { proverb });
  await updateAndroidWidget("proverb_widget", [
    { size: { width: 250, height: 250 }, content: widgetContent(proverb) },
  ]);
  remoteLog("debug", "[ProverbWidget] Finished updating widget");
};