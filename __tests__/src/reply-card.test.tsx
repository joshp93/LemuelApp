import { fireEvent, render, waitFor } from "@testing-library/react-native";
import ReplyCard from "../../src/components/reply-card";
import type { ReplyEntity } from "../../src/models/reactions-and-replies";

const REPLY: ReplyEntity = {
  pk: "author-1",
  sk: "reply#2026-06-02T09:00:00.000Z",
  content: "the original reply",
  authorUuid: "author-1",
  displayName: "Joshua",
  createdAt: "2026-06-02T09:00:00.000Z",
};

function renderCard(
  overrides: Partial<{
    isOwn: boolean;
    onDelete: () => void;
    onSaveEdit: (content: string) => Promise<void>;
  }> = {},
) {
  const onSaveEdit = jest.fn().mockResolvedValue(undefined);

  const rendered = render(
    <ReplyCard
      reply={REPLY}
      isOwn={overrides.isOwn ?? true}
      onDelete={overrides.onDelete}
      onSaveEdit={overrides.onSaveEdit ?? onSaveEdit}
    />,
  );

  return { ...rendered, onSaveEdit };
}

/** Opens the reply's menu and picks one of its options. */
function chooseOption(
  getByTestId: (id: string) => unknown,
  getByText: (text: string) => unknown,
  label: string,
): void {
  fireEvent.press(getByTestId("reply-options") as never);
  fireEvent.press(getByText(label) as never);
}

describe("ReplyCard", () => {
  it("shows the author, the reply and how long ago it was", () => {
    const { getByText } = renderCard();

    expect(getByText("Joshua")).toBeTruthy();
    expect(getByText("the original reply")).toBeTruthy();
  });

  it("hides the edit control on somebody else's reply", () => {
    const { queryByTestId } = renderCard({ isOwn: false });

    expect(queryByTestId("reply-options")).toBeNull();
  });

  it("opens the editor on the reply it already holds", () => {
    const { getByTestId, getByText } = renderCard();

    chooseOption(getByTestId, getByText, "Edit");

    expect(getByTestId("reply-edit-input").props.value).toBe(
      "the original reply",
    );
  });

  it("reports an edit and closes the editor without waiting", async () => {
    const onSaveEdit = jest.fn().mockReturnValue(new Promise(() => {}));
    const { getByTestId, getByText, queryByTestId } = renderCard({
      onSaveEdit,
    });

    chooseOption(getByTestId, getByText, "Edit");
    fireEvent.changeText(getByTestId("reply-edit-input"), "  the new reply  ");
    fireEvent.press(getByTestId("reply-save"));

    expect(onSaveEdit).toHaveBeenCalledWith("the new reply");
    await waitFor(() => {
      expect(queryByTestId("reply-edit-input")).toBeNull();
    });
  });

  it("puts the original reply back when the edit is cancelled", () => {
    const { getByTestId, getByText } = renderCard();

    chooseOption(getByTestId, getByText, "Edit");
    fireEvent.changeText(getByTestId("reply-edit-input"), "something else");
    fireEvent.press(getByTestId("reply-cancel"));
    chooseOption(getByTestId, getByText, "Edit");

    expect(getByTestId("reply-edit-input").props.value).toBe(
      "the original reply",
    );
  });

  it("sends nothing when the edited reply is blank", () => {
    const { getByTestId, getByText } = renderCard();

    chooseOption(getByTestId, getByText, "Edit");
    fireEvent.changeText(getByTestId("reply-edit-input"), "   ");
    fireEvent.press(getByTestId("reply-save"));

    expect(getByTestId("reply-edit-input")).toBeTruthy();
  });
});
