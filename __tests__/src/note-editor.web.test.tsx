import { render } from "@testing-library/react-native";
import type { ReactElement } from "react";
import WebNoteEditor from "../../src/components/note-editor.web";

const baseProps = {
  editorContent: "<p>Trust in the LORD</p>",
  onChange: jest.fn(),
  onDelete: jest.fn(),
  deleting: false,
};

/** Stand-in for the contentEditable div, which has no real DOM node here. */
function makeEditorNode() {
  return { innerHTML: "", focus: jest.fn() };
}

function renderEditor(contentLoaded: boolean) {
  const editorNode = makeEditorNode();
  const result = render(
    <WebNoteEditor {...baseProps} contentLoaded={contentLoaded} />,
    {
      createNodeMock: (element: ReactElement) =>
        element.type === "div" ? editorNode : null,
    },
  );
  return { ...result, editorNode };
}

describe("NoteEditor (web)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hides the editing surface until the content is ready", () => {
    const { getByTestId, queryByLabelText } = renderEditor(false);

    expect(getByTestId("lemuel-loading")).toBeTruthy();
    expect(queryByLabelText("Bold")).toBeNull();
  });

  it("reveals the editing surface once the content is ready", () => {
    const { getByLabelText, queryByTestId } = renderEditor(true);

    expect(queryByTestId("lemuel-loading")).toBeNull();
    expect(getByLabelText("Bold")).toBeTruthy();
  });

  it("initialises the editor with the loaded note content", () => {
    const { editorNode } = renderEditor(true);

    expect(editorNode.innerHTML).toBe("<p>Trust in the LORD</p>");
  });

  it("leaves the editor empty while the content is still loading", () => {
    const { editorNode } = renderEditor(false);

    expect(editorNode.innerHTML).toBe("");
  });
});
