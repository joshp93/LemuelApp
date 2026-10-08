import { act, renderHook, waitFor } from "@testing-library/react-native";
import { remoteLog } from "../../src/api/remote-logger";
import { useSerializedSave } from "../../src/hooks/useSerializedSave";

/** A promise whose resolution the test controls. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

const mockRemoteLog = remoteLog as jest.MockedFunction<typeof remoteLog>;

describe("useSerializedSave", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("runs a single task", async () => {
    const { result } = renderHook(() => useSerializedSave());
    const task = jest.fn(async () => {});

    act(() => {
      result.current(task);
    });

    await waitFor(() => {
      expect(task).toHaveBeenCalledTimes(1);
    });
  });

  it("holds a later task until the running one finishes", async () => {
    const { result } = renderHook(() => useSerializedSave());
    const gate = deferred();
    const order: string[] = [];

    act(() => {
      result.current(async () => {
        await gate.promise;
        order.push("first");
      });
      result.current(async () => {
        order.push("second");
      });
    });

    expect(order).toEqual([]);

    await act(async () => {
      gate.resolve();
      await gate.promise;
    });

    await waitFor(() => {
      expect(order).toEqual(["first", "second"]);
    });
  });

  it("coalesces changes made while a save is in flight so the newest wins", async () => {
    const { result } = renderHook(() => useSerializedSave());
    const gate = deferred();
    const order: string[] = [];

    act(() => {
      result.current(async () => {
        await gate.promise;
        order.push("running");
      });
      result.current(async () => {
        order.push("stale");
      });
      result.current(async () => {
        order.push("latest");
      });
    });

    await act(async () => {
      gate.resolve();
      await gate.promise;
    });

    await waitFor(() => {
      expect(order).toEqual(["running", "latest"]);
    });
  });

  it("logs a failed task and continues with the next one", async () => {
    const { result } = renderHook(() => useSerializedSave());
    const failing = jest.fn(async () => {
      throw new Error("storage offline");
    });
    const following = jest.fn(async () => {});

    act(() => {
      result.current(failing);
      result.current(following);
    });

    await waitFor(() => {
      expect(following).toHaveBeenCalledTimes(1);
    });
    expect(mockRemoteLog).toHaveBeenCalledWith(
      "error",
      expect.stringContaining("Failed to save"),
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });

  it("accepts a new task once the queue has drained", async () => {
    const { result } = renderHook(() => useSerializedSave());
    const first = jest.fn(async () => {});
    const second = jest.fn(async () => {});

    act(() => {
      result.current(first);
    });
    await waitFor(() => {
      expect(first).toHaveBeenCalledTimes(1);
    });

    act(() => {
      result.current(second);
    });

    await waitFor(() => {
      expect(second).toHaveBeenCalledTimes(1);
    });
  });
});
