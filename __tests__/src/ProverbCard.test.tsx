import { render } from "@testing-library/react-native";
import { ProverbCard } from "../../src/components/proverb-card";
import type { Proverb } from "../../src/models/proverb";

describe("ProverbCard", () => {
  const mockProverb: Proverb = {
    ref: "Proverbs 3:5",
    proverb: "Trust in the LORD with all your heart",
  };

  it("should render the proverb text", () => {
    const { getByText } = render(<ProverbCard proverb={mockProverb} />);

    expect(getByText("Trust in the LORD with all your heart")).toBeTruthy();
  });

  it("should render with custom fontSize", () => {
    const { getByText } = render(
      <ProverbCard proverb={mockProverb} fontSize={32} />,
    );

    const textElement = getByText("Trust in the LORD with all your heart");
    expect(textElement).toBeTruthy();
  });

  it("should accept additional style props", () => {
    const { getByText } = render(
      <ProverbCard proverb={mockProverb} style={{ backgroundColor: "red" }} />,
    );

    expect(getByText("Trust in the LORD with all your heart")).toBeTruthy();
  });

  it("should render citation when provided", () => {
    const proverbWithCitation: Proverb = {
      ...mockProverb,
      citation: "King James Version (KJV)",
    };

    const { getByText } = render(<ProverbCard proverb={proverbWithCitation} />);

    expect(getByText("King James Version (KJV)")).toBeTruthy();
  });

  it("should not render citation when not provided", () => {
    const { queryByText } = render(<ProverbCard proverb={mockProverb} />);

    expect(queryByText("King James Version (KJV)")).toBeNull();
  });
});
