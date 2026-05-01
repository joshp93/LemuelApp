import React from 'react';
import { updateAndroidWidget } from "@use-voltra/android-client";
import { ProverbWidget } from "./proverb-widget";

const widgetContent = (proverb: { ref: string; proverb: string } | null) => 
  React.createElement(ProverbWidget, { proverb });

export const updateProverbWidget = async (proverb: { ref: string; proverb: string } | null) => {
  await updateAndroidWidget("proverb_widget", [
    { size: { width: 250, height: 250 }, content: widgetContent(proverb) },
  ]);
};

export { ProverbWidget };