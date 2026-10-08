import { act, renderHook, waitFor } from "@testing-library/react-native";
import { useCallback } from "react";
import { useAutoSave } from "../../src/hooks/useAutoSave";

describe("useAutoSave", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("does not save while the snapshot is still loading", async () => {
    const persist = jest.fn(async (_value: number) => {});

    const { rerender } = renderHook(
      ({ value, ready }: { value: number; ready: boolean }) =>
        useAutoSave(
          useCallback(() => persist(value), [value]),
          ready,
        ),
      { initialProps: { value: 1, ready: false } },
    );

    rerender({ value: 2, ready: false });

    await act(async () => {});
    expect(persist).not.toHaveBeenCalled();
  });

  it("does not write the freshly loaded snapshot back to storage", async () => {
    const persist = jest.fn(async (_value: number) => {});

    const { rerender } = renderHook(
      ({ value, ready }: { value: number; ready: boolean }) =>
        useAutoSave(
          useCallback(() => persist(value), [value]),
          ready,
        ),
      { initialProps: { value: 1, ready: false } },
    );

    rerender({ value: 1, ready: true });

    await act(async () => {});
    expect(persist).not.toHaveBeenCalled();
  });

  it("saves once a setting changes after the initial load", async () => {
    const persist = jest.fn(async (_value: number) => {});

    const { rerender } = renderHook(
      ({ value, ready }: { value: number; ready: boolean }) =>
        useAutoSave(
          useCallback(() => persist(value), [value]),
          ready,
        ),
      { initialProps: { value: 1, ready: false } },
    );

    rerender({ value: 1, ready: true });
    rerender({ value: 2, ready: true });

    await waitFor(() => {
      expect(persist).toHaveBeenCalledWith(2);
    });
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it("saves each change made after the initial load", async () => {
    const persist = jest.fn(async (_value: number) => {});

    const { rerender } = renderHook(
      ({ value, ready }: { value: number; ready: boolean }) =>
        useAutoSave(
          useCallback(() => persist(value), [value]),
          ready,
        ),
      { initialProps: { value: 1, ready: true } },
    );

    rerender({ value: 2, ready: true });
    await waitFor(() => expect(persist).toHaveBeenCalledWith(2));

    rerender({ value: 3, ready: true });
    await waitFor(() => expect(persist).toHaveBeenCalledWith(3));
    expect(persist).toHaveBeenCalledTimes(2);
  });

  it("does not save again when nothing changed", async () => {
    const persist = jest.fn(async (_value: number) => {});

    const { rerender } = renderHook(
      ({ value, ready }: { value: number; ready: boolean }) =>
        useAutoSave(
          useCallback(() => persist(value), [value]),
          ready,
        ),
      { initialProps: { value: 1, ready: true } },
    );

    rerender({ value: 1, ready: true });

    await act(async () => {});
    expect(persist).not.toHaveBeenCalled();
  });
});
