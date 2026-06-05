import { updateAndroidWidget } from "@use-voltra/android-client";
import React from "react";
import { remoteLog } from "../api/remote-logger";
import type { Proverb } from "../models/proverb";
import { ProverbWidget } from "./proverb-widget";

const widgetContent = (proverb: Proverb | null) =>
  React.createElement(ProverbWidget, { proverb });

export const updateProverbWidget = async (proverb: Proverb | null) => {
  remoteLog("debug", "[ProverbWidget] Updating widget", {
    proverb,
  });
  await updateAndroidWidget("proverb_widget", [
    { size: { width: 250, height: 250 }, content: widgetContent(proverb) },
  ]);
  remoteLog("debug", "[ProverbWidget] Finished updating widget");
};

export { ProverbWidget };
