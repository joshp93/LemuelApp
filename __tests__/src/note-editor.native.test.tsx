/* eslint-disable @typescript-eslint/no-require-imports */
import { render } from "@testing-library/react-native";
import NoteEditor from "../../src/components/note-editor.native";

jest.mock("react-native-pell-rich-editor", () => {
  const React = require("react");
  const { Text, View } = require("react-native");
  return {
    __esModule: true,
    actions: {
      setBold: "setBold",
      setItalic: "setItalic",
      setUnderline: "setUnderline",
      insertBulletsList: "insertBulletsList",
      insertOrderedList: "insertOrderedList",
    },
    RichEditor: React.forwardRef(({ initialContentHTML }: any) =>
      React.createElement(Text, { testID: "rich-editor" }, initialContentHTML),
    ),
    RichToolbar: () => React.createElement(View, { testID: "rich-toolbar" }),
  };
});

const baseProps = {
  editorContent: "<p>Trust in the LORD</p>",
  onChange: jest.fn(),
  onDelete: jest.fn(),
  deleting: false,
};

describe("NoteEditor (native)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hides the editing surface until the content is ready", () => {
    const { getByTestId, queryByTestId } = render(
      <NoteEditor {...baseProps} contentLoaded={false} />,
    );

    expect(getByTestId("lemuel-loading")).toBeTruthy();
    expect(queryByTestId("rich-editor")).toBeNull();
    expect(queryByTestId("rich-toolbar")).toBeNull();
  });

  it("reveals the editing surface once the content is ready", () => {
    const { getByTestId, queryByTestId } = render(
      <NoteEditor {...baseProps} contentLoaded />,
    );

    expect(queryByTestId("lemuel-loading")).toBeNull();
    expect(getByTestId("rich-editor")).toBeTruthy();
    expect(getByTestId("rich-toolbar")).toBeTruthy();
  });

  it("opens the editor with the loaded note content", () => {
    const { getByTestId } = render(<NoteEditor {...baseProps} contentLoaded />);

    expect(getByTestId("rich-editor").props.children).toBe(
      "<p>Trust in the LORD</p>",
    );
  });
});
