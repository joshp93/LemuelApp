import { fireEvent, render } from "@testing-library/react-native";

import { ProverbReferenceHeaderText } from "../../src/components/proverb-reference-header-text";

function fireLayout(r: ReturnType<typeof render>, width: number) {
  fireEvent(r.getByTestId("header-root"), "onLayout", {
    nativeEvent: {
      layout: { width, height: 50, x: 0, y: 0 },
    },
  });
}

function fireMeasurement(
  r: ReturnType<typeof render>,
  widths: [number, number, number],
) {
  fireEvent(r.getByTestId("measurement-text"), "onTextLayout", {
    nativeEvent: {
      lines: widths.map((w) => ({ width: w, height: 22, x: 0, y: 0 })),
    },
  });
}

describe("ProverbReferenceHeaderText", () => {
  const baseProps = {
    selectedVersion: null,
  };

  it("shows 'Daily Proverb' when loading", () => {
    const { getByTestId } = render(
      <ProverbReferenceHeaderText {...baseProps} loading />,
    );
    expect(getByTestId("header-title").props.children).toBe("Daily Proverb");
  });

  it("shows 'Daily Proverb' when error", () => {
    const { getByTestId } = render(
      <ProverbReferenceHeaderText {...baseProps} error={new Error()} />,
    );
    expect(getByTestId("header-title").props.children).toBe("Daily Proverb");
  });

  it("shows 'Daily Proverb' when proverbRef is undefined", () => {
    const { getByTestId } = render(
      <ProverbReferenceHeaderText {...baseProps} />,
    );
    expect(getByTestId("header-title").props.children).toBe("Daily Proverb");
  });

  it("shows full proverbRef when no measurement taken yet", () => {
    const { getByTestId } = render(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Proverbs 3:5"
      />,
    );
    expect(getByTestId("header-title").props.children).toBe("Proverbs 3:5");
  });

  it("uses full reference when all variants fit", () => {
    const r = render(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Proverbs 3:5"
      />,
    );
    fireLayout(r, 300);
    fireMeasurement(r, [150, 100, 50]);

    expect(r.getByTestId("header-title").props.children).toBe("Proverbs 3:5");
  });

  it("uses abbreviated 'Prov' when full reference does not fit", () => {
    const r = render(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Proverbs 3:5"
      />,
    );
    fireLayout(r, 120);
    fireMeasurement(r, [150, 100, 50]);

    expect(r.getByTestId("header-title").props.children).toBe("Prov 3:5");
  });

  it("uses ref-only when neither full nor abbreviated fits", () => {
    const r = render(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Proverbs 3:5"
      />,
    );
    fireLayout(r, 70);
    fireMeasurement(r, [150, 100, 50]);

    expect(r.getByTestId("header-title").props.children).toBe("3:5");
  });

  it("uses ref-only as fallback when even the shortest variant overflows", () => {
    const r = render(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Proverbs 3:5"
      />,
    );
    fireLayout(r, 20);
    fireMeasurement(r, [150, 100, 50]);

    expect(r.getByTestId("header-title").props.children).toBe("3:5");
  });

  it("accounts for version dropdown width when deciding overflow", () => {
    const r = render(
      <ProverbReferenceHeaderText
        proverbRef="Proverbs 3:5"
        selectedVersion="KJV"
        availableVersions={["KJV", "NIV"]}
        onVersionChange={jest.fn()}
      />,
    );
    fireLayout(r, 180);
    fireMeasurement(r, [150, 130, 100]);

    // 150 (full) + 72 (dropdown) > 180 => doesn't fit
    // 130 (abbreviated) + 72 (dropdown) > 180 => doesn't fit
    // 100 (ref-only) + 72 (dropdown) <= 180 => fits
    expect(r.getByTestId("header-title").props.children).toBe("3:5");
  });

  it("renders version dropdown when versions and selection exist", () => {
    const r = render(
      <ProverbReferenceHeaderText
        proverbRef="Proverbs 3:5"
        selectedVersion="KJV"
        availableVersions={["KJV", "NIV"]}
        onVersionChange={jest.fn()}
      />,
    );
    fireLayout(r, 300);
    fireMeasurement(r, [150, 100, 50]);

    expect(r.getByText("KJV")).toBeTruthy();
  });

  it("does not render version dropdown when no versions", () => {
    const r = render(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Proverbs 3:5"
      />,
    );
    fireLayout(r, 300);
    fireMeasurement(r, [150, 100, 50]);

    expect(r.queryByText("KJV")).toBeNull();
  });

  it("shows reference as-is when not a 'Proverbs' reference", () => {
    const r = render(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Psalm 23:1"
      />,
    );
    fireLayout(r, 300);
    fireMeasurement(r, [150, 150, 150]);

    expect(r.getByTestId("header-title").props.children).toBe("Psalm 23:1");
  });

  it("shows full ref after proverbRef changes", () => {
    const r = render(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Proverbs 3:5"
      />,
    );
    fireLayout(r, 120);
    fireMeasurement(r, [150, 100, 50]);

    expect(r.getByTestId("header-title").props.children).toBe("Prov 3:5");

    r.rerender(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Proverbs 10:5"
      />,
    );
    expect(r.getByTestId("header-title").props.children).toBe(
      "Proverbs 10:5",
    );
  });

  it("renders without crashing when no style prop is given", () => {
    const { getByTestId } = render(
      <ProverbReferenceHeaderText
        {...baseProps}
        proverbRef="Proverbs 3:5"
      />,
    );
    expect(getByTestId("header-title")).toBeTruthy();
  });
});
