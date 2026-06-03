import { VoltraAndroid } from "voltra";
import { Proverb } from "../models/proverb";
import { COLORS } from "../constants/theme";

export interface ProverbWidgetProps {
  proverb: Proverb | null;
}

export const ProverbWidget = ({ proverb }: ProverbWidgetProps) => (
  <VoltraAndroid.Box
    deepLinkUrl="lemuel://"
    style={{
      padding: 16,
      backgroundColor: COLORS.lightBackground,
      borderRadius: 16,
      width: "100%",
      height: "100%",
      justifyContent: "center",
    }}
  >
    {proverb ? (
      <VoltraAndroid.Column
        verticalAlignment="center-vertically"
        horizontalAlignment="start"
      >
        <VoltraAndroid.Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#333333",
            fontFamily: "nunito_400regular",
          }}
        >
          {proverb.ref}
        </VoltraAndroid.Text>
        <VoltraAndroid.Text
          style={{
            fontSize: 18,
            color: "#1a1a1a",
            marginTop: 12,
            fontFamily: "nunito_400regular",
          }}
        >
          {proverb.proverb}
        </VoltraAndroid.Text>
        {proverb.citation && (
          <VoltraAndroid.Text
            style={{
              fontSize: 10,
              color: "#666666",
              marginTop: 15,
              textAlign: "left",
              fontFamily: "nunito_400regular",
            }}
          >
            {proverb.citation}
          </VoltraAndroid.Text>
        )}
      </VoltraAndroid.Column>
    ) : (
      <VoltraAndroid.Column
        verticalAlignment="center-vertically"
        horizontalAlignment="center-horizontally"
      >
        <VoltraAndroid.Text
          style={{
            fontSize: 16,
            fontWeight: "bold",
            color: "#333333",
            textAlign: "center",
            fontFamily: "nunito_400regular",
          }}
        >
          Please open the Lemuel app once to activate the widget.
        </VoltraAndroid.Text>
      </VoltraAndroid.Column>
    )}
  </VoltraAndroid.Box>
);
