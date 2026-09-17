import { VoltraAndroid } from "@use-voltra/android-client";
import { Proverb } from "../models/proverb";
import { COLORS } from "../constants/theme";

export interface ProverbWidgetProps {
  proverb: Proverb | null;
}

export const ProverbWidget = ({ proverb }: ProverbWidgetProps) => (
  <VoltraAndroid.Box deepLinkUrl="lemuel://">
    {proverb ? (
      <VoltraAndroid.Column
        deepLinkUrl="lemuel://"
        style={{
          padding: 16,
          backgroundColor: COLORS.lightBackground,
          borderRadius: 16,
          width: "100%",
          height: "100%",
        }}
      >
        <VoltraAndroid.LazyColumn
          deepLinkUrl="lemuel://"
          horizontalAlignment="start"
          style={{ width: "100%", height: "100%" }}
        >
          <VoltraAndroid.Text
            deepLinkUrl="lemuel://"
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: "#333333",
              fontFamily: "nunito_400regular",
              paddingBottom: 12,
            }}
          >
            {proverb.ref}
          </VoltraAndroid.Text>
          <VoltraAndroid.Text
            deepLinkUrl="lemuel://"
            style={{
              fontSize: 18,
              color: "#1a1a1a",
              fontFamily: "nunito_400regular",
              paddingBottom: 12,
            }}
          >
            {proverb.proverb}
          </VoltraAndroid.Text>
          {proverb.citation && (
            <VoltraAndroid.Text
              deepLinkUrl="lemuel://"
              style={{
                fontSize: 10,
                color: "#666666",
                textAlign: "left",
                fontFamily: "nunito_400regular",
              }}
            >
              {proverb.citation}
            </VoltraAndroid.Text>
          )}
        </VoltraAndroid.LazyColumn>
      </VoltraAndroid.Column>
    ) : (
      <VoltraAndroid.Column
        deepLinkUrl="lemuel://"
        verticalAlignment="center-vertically"
        horizontalAlignment="center-horizontally"
        style={{
          padding: 16,
          backgroundColor: COLORS.lightBackground,
          borderRadius: 16,
          width: "100%",
          height: "100%",
        }}
      >
        <VoltraAndroid.Text
          deepLinkUrl="lemuel://"
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