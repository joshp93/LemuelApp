const VoltraAndroid = require("voltra").VoltraAndroid;
const React = require("react");

const content = /* @__PURE__ */ React.createElement(VoltraAndroid.Box, {
  deepLinkUrl: "lemuel://",
  style: {
    padding: 16,
    backgroundColor: "#FDFBF7",
    borderRadius: 16,
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
}, /* @__PURE__ */ React.createElement(VoltraAndroid.Column, {
  verticalAlignment: "center-vertically",
  horizontalAlignment: "center-horizontally",
}, /* @__PURE__ */ React.createElement(VoltraAndroid.Text, {
  style: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333333",
    textAlign: "center",
    fontFamily: "nunito_400regular",
  },
}, "Lemuel"), /* @__PURE__ */ React.createElement(VoltraAndroid.Text, {
  style: {
    fontSize: 12,
    color: "#666666",
    textAlign: "center",
    marginTop: 8,
    fontFamily: "nunito_400regular",
  },
}, "Loading your daily proverb...")));

module.exports = [
  { size: { width: 250, height: 250 }, content },
  { size: { width: 300, height: 200 }, content },
  { size: { width: 200, height: 200 }, content },
];