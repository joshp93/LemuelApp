import { fireEvent, render, waitFor } from "@testing-library/react-native";
import type { NoteEntity } from "../../src/api/notes";
import ProverbNoteCard from "../../src/components/proverb-note-card";

jest.mock("react-native-reanimated", () => {
  const { View } = require("react-native");
  const Reanimated = {
    View,
    Text: require("react-native").Text,
    Image: require("react-native").Image,
    ScrollView: require("react-native").ScrollView,
    FlatList: require("react-native").FlatList,
  };
  return {
    __esModule: true,
    default: {
      ...Reanimated,
      createAnimatedComponent: (comp: any) => comp,
    },
    ...Reanimated,
    createAnimatedComponent: (comp: any) => comp,
    useAnimatedStyle: () => ({}),
    useDerivedValue: (fn: any) => ({ value: fn() }),
    useSharedValue: (initial: any) => ({ value: initial }),
    useClock: () => ({ value: 0 }),
    useCanvasSize: () => ({ ref: { current: null } }),
    withTiming: (_toValue: any, _config?: any, callback?: any) => {
      callback?.(true);
      return _toValue;
    },
    withSpring: (toValue: any) => toValue,
    withDecay: () => 0,
    runOnJS: (fn: any) => fn,
    runOnUI: (fn: any) => fn,
    measure: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    interpolate: (_val: any, _input: any[], output: any[]) => output[0],
    Extrapolate: { CLAMP: "clamp" },
    Easing: { in: (e: any) => e, out: (e: any) => e, inOut: (e: any) => e },
    Transition: { Together: "Together", Out: "Out", In: "In" },
    processColor: (c: any) => c,
  };
});

jest.mock("react-native-render-html", () => {
  const { Text } = require("react-native");
  return ({ source }: { source: { html: string } }) => (
    <Text>{source.html}</Text>
  );
});

const LONG_NOTE_TEXT =
  "Discipline and correction are very important for us to grow and change as people, we don't like to hear it but we need to be open to it!";

function makeNote(html: string, overrides?: Partial<NoteEntity>): NoteEntity {
  return {
    pk: "1",
    sk: "Proverbs3:5",
    note: html,
    uuid: "user-1",
    ref: "Proverbs3:5",
    dateCreated: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ProverbNoteCard", () => {
  it("should render the note text", async () => {
    const note = makeNote(`<p>${LONG_NOTE_TEXT}</p>`);
    const { getAllByText } = render(
      <ProverbNoteCard note={note} contentWidth={350} />,
    );

    await waitFor(() => {
      const elements = getAllByText(/Discipline and correction/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("should expand and collapse when long note is pressed", async () => {
    const note = makeNote(`<p>${LONG_NOTE_TEXT}</p>`);
    const { getAllByText, toJSON } = render(
      <ProverbNoteCard note={note} contentWidth={350} />,
    );

    await waitFor(() => {
      const elements = getAllByText(/Discipline and correction/);
      expect(elements.length).toBeGreaterThanOrEqual(1);
    });

    const treeBefore = JSON.stringify(toJSON());
    expect(treeBefore).toContain("60");

    const allElements = getAllByText(/Discipline and correction/);
    fireEvent.press(allElements[allElements.length - 1]);

    const treeAfter = JSON.stringify(toJSON());
    expect(treeAfter).not.toContain("60");
  });

  it("should show author name with person icon when displayName is set", async () => {
    const note = makeNote(`<p>${LONG_NOTE_TEXT}</p>`, {
      displayName: "test-author",
    });
    const { getByText } = render(
      <ProverbNoteCard note={note} contentWidth={350} />,
    );

    expect(getByText("test-author - Thu Jan 01 2026")).toBeTruthy();
  });
});
