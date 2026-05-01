import { VoltraAndroid } from "voltra";
import { Proverb } from "../models/proverb";

export interface ProverbWidgetProps {
  proverb: Proverb | null;
}

export const ProverbWidget = ({ proverb }: ProverbWidgetProps) => (
  <VoltraAndroid.Box
    deepLinkUrl="proverbfortheday://"
    style={{
      padding: 16,
      backgroundColor: "#E6F4FE",
      borderRadius: 16,
      width: "100%",
      height: "100%",
    }}
  >
    <VoltraAndroid.Column
      verticalAlignment="center-vertically"
      horizontalAlignment="center-horizontally"
    >
      <VoltraAndroid.Text
        style={{
          fontSize: 14,
          fontWeight: "bold",
          color: "#333333",
        }}
      >
        Proverb of the Day
      </VoltraAndroid.Text>
      <VoltraAndroid.Text
        style={{
          fontSize: 18,
          fontFamily: "serif",
          color: "#1a1a1a",
          textAlign: "center",
          marginTop: 8,
        }}
      >
        {proverb?.proverb ?? "Loading..."}
      </VoltraAndroid.Text>
      {proverb && (
        <VoltraAndroid.Text
          style={{
            fontSize: 12,
            color: "#666666",
            marginTop: 8,
          }}
        >
          {proverb.ref}
        </VoltraAndroid.Text>
      )}
    </VoltraAndroid.Column>
  </VoltraAndroid.Box>
);
