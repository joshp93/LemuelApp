import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import ReplyInput from "../../src/components/reply-input";

function renderInput(onSubmit: (content: string) => Promise<void>) {
  const rendered = render(<ReplyInput onSubmit={onSubmit} />);
  const input = rendered.getByPlaceholderText("Write a reply...");

  return { ...rendered, input };
}

describe("ReplyInput", () => {
  it("clears the box as soon as the reply is submitted", () => {
    const onSubmit = jest.fn().mockReturnValue(new Promise(() => {}));
    const { input } = renderInput(onSubmit);

    fireEvent.changeText(input, "a new reply");
    fireEvent(input, "submitEditing");

    expect(onSubmit).toHaveBeenCalledWith("a new reply");
    expect(input.props.value).toBe("");
  });

  it("puts the reply back when it could not be sent", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("offline"));
    const { input } = renderInput(onSubmit);

    fireEvent.changeText(input, "a new reply");
    fireEvent(input, "submitEditing");

    await waitFor(() => {
      expect(input.props.value).toBe("a new reply");
    });
  });

  it("does not overwrite what has been typed since", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error("offline"));
    const { input } = renderInput(onSubmit);

    fireEvent.changeText(input, "a new reply");
    fireEvent(input, "submitEditing");
    fireEvent.changeText(input, "the next one");

    await act(async () => {});

    expect(input.props.value).toBe("the next one");
  });

  it("sends nothing when the box is empty", () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { input } = renderInput(onSubmit);

    fireEvent.changeText(input, "   ");
    fireEvent(input, "submitEditing");

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
