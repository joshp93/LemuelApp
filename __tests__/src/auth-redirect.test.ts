import {
  buildRedirectResetAction,
  extractExtraQueryParams,
  extractRouteParamsFromPath,
  splitRedirectUrl,
} from "../../src/utils/auth-redirect";

describe("splitRedirectUrl", () => {
  it("splits a URL with a query string", () => {
    expect(
      splitRedirectUrl("/notes/users/{{uuid}}/Pro 3:5?date=2026-09-17"),
    ).toEqual({
      pathPart: "/notes/users/{{uuid}}/Pro 3:5",
      queryPart: "date=2026-09-17",
    });
  });

  it("returns a null query part when there is no query string", () => {
    expect(splitRedirectUrl("/settings")).toEqual({
      pathPart: "/settings",
      queryPart: null,
    });
  });
});

describe("extractRouteParamsFromPath", () => {
  it("maps bracketed template segments by position", () => {
    expect(
      extractRouteParamsFromPath(
        "notes/users/abc-123/Pro 3:5",
        "notes/users/[uuid]/[ref]",
        "resolved-user-id",
      ),
    ).toEqual({ uuid: "resolved-user-id", ref: "Pro 3:5" });
  });

  it("substitutes the authenticated user id for uuid", () => {
    expect(
      extractRouteParamsFromPath(
        "notes/users/{{uuid}}/Pro 3:5",
        "notes/users/[uuid]/[ref]",
        "abc-123",
      ),
    ).toEqual({ uuid: "abc-123", ref: "Pro 3:5" });
  });

  it("returns an empty object when the template has no dynamic segments", () => {
    expect(
      extractRouteParamsFromPath("settings", "settings", "abc-123"),
    ).toEqual({});
  });
});

describe("extractExtraQueryParams", () => {
  it("keeps query params not consumed by the route template", () => {
    expect(
      extractExtraQueryParams("date=2026-09-17&foo=bar", "notes/[uuid]/[ref]"),
    ).toEqual({ date: "2026-09-17", foo: "bar" });
  });

  it("drops query params whose names match template params", () => {
    expect(
      extractExtraQueryParams("uuid=abc&date=2026-09-17", "notes/[uuid]"),
    ).toEqual({ date: "2026-09-17" });
  });

  it("returns an empty object when there is no query part", () => {
    expect(extractExtraQueryParams(null, "notes/[uuid]")).toEqual({});
  });

  it("decodes URL-encoded values", () => {
    expect(extractExtraQueryParams("ref=Pro%203%3A5", "notes")).toEqual({
      ref: "Pro 3:5",
    });
  });
});

describe("buildRedirectResetAction", () => {
  it("builds a RESET action with resolved path and query params", () => {
    const action = buildRedirectResetAction(
      "notes/users/[uuid]/[ref]",
      "/notes/users/{{uuid}}/Pro 3:5?date=2026-09-17",
      "abc-123",
    );

    expect(action).toMatchObject({
      type: "RESET",
      payload: {
        index: 0,
        routes: [
          {
            name: "notes/users/[uuid]/[ref]",
            params: { uuid: "abc-123", ref: "Pro 3:5", date: "2026-09-17" },
          },
        ],
      },
    });
  });

  it("omits params when the redirect has none", () => {
    const action = buildRedirectResetAction("index", "/", "abc-123");

    expect(action).toMatchObject({
      type: "RESET",
      payload: { index: 0, routes: [{ name: "index" }] },
    });
  });
});
