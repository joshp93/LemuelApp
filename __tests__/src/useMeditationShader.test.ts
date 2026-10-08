import { renderHook, waitFor } from "@testing-library/react-native";
import { useMeditationShader } from "../../src/hooks/useMeditationShader";
import { getEnabledMeditationShaders } from "../../src/settings/meditation-preferences";
import { DEFAULT_SHADER_ID } from "../../src/utils/meditation-shaders";

jest.mock("../../src/settings/meditation-preferences", () => ({
  getEnabledMeditationShaders: jest.fn(),
}));

const mockGetEnabledMeditationShaders =
  getEnabledMeditationShaders as jest.MockedFunction<
    typeof getEnabledMeditationShaders
  >;

describe("useMeditationShader", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("is null until preferences resolve, so no shader is painted first", () => {
    mockGetEnabledMeditationShaders.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useMeditationShader());

    expect(result.current).toBeNull();
  });

  it("resolves to an enabled shader", async () => {
    mockGetEnabledMeditationShaders.mockResolvedValue(["gas-giant"]);

    const { result } = renderHook(() => useMeditationShader());

    await waitFor(() => {
      expect(result.current?.id).toBe("gas-giant");
    });
  });

  it("picks at random from the enabled set", async () => {
    mockGetEnabledMeditationShaders.mockResolvedValue([
      "star-field",
      "gas-giant",
      "sine-mountains",
    ]);
    jest.spyOn(Math, "random").mockReturnValue(0.99);

    const { result } = renderHook(() => useMeditationShader());

    await waitFor(() => {
      expect(result.current?.id).toBe("sine-mountains");
    });
  });

  it("falls back to the default when the enabled set is empty", async () => {
    mockGetEnabledMeditationShaders.mockResolvedValue([]);

    const { result } = renderHook(() => useMeditationShader());

    await waitFor(() => {
      expect(result.current?.id).toBe(DEFAULT_SHADER_ID);
    });
  });

  it("exposes shader source that can be built for a tier", async () => {
    mockGetEnabledMeditationShaders.mockResolvedValue(["gas-giant"]);

    const { result } = renderHook(() => useMeditationShader());

    await waitFor(() => {
      expect(result.current?.id).toBe("gas-giant");
    });
    expect(result.current?.makeSkSL("high")).toContain("half4 main(vec2 xy) {");
  });
});
