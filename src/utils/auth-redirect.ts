import { CommonActions } from "expo-router/build/react-navigation";

/**
 * Splits a redirect URL into its path and query parts.
 *
 * @example
 * splitRedirectUrl("/notes/users/{{uuid}}/Pro 3:5?date=2026-09-17")
 * // => { pathPart: "/notes/users/{{uuid}}/Pro 3:5", queryPart: "date=2026-09-17" }
 *
 * @param redirectUrl - The URL to split.
 * @returns The path portion and the query string (without `?`), or null.
 */
export const splitRedirectUrl = (
  redirectUrl: string,
): { pathPart: string; queryPart: string | null } => {
  const idx = redirectUrl.indexOf("?");
  if (idx === -1) {
    return { pathPart: redirectUrl, queryPart: null };
  }
  return {
    pathPart: redirectUrl.slice(0, idx),
    queryPart: redirectUrl.slice(idx + 1),
  };
};

/**
 * Extracts dynamic route params from a resolved path by matching its segments
 * against a route template.
 *
 * Template segments in `[name]` brackets are matched by position against the
 * resolved path. The special `uuid` param is replaced with the authenticated
 * user's actual ID.
 *
 * @example
 * extractRouteParamsFromPath(
 *   "notes/users/abc-123/Pro 3:5",
 *   "notes/users/[uuid]/[ref]",
 *   "abc-123",
 * )
 * // => { uuid: "abc-123", ref: "Pro 3:5" }
 *
 * @param resolvedPath - The concrete path with placeholders replaced.
 * @param routeTemplate - The route template containing `[param]` segments.
 * @param authenticatedUserId - The signed-in user's ID, used for `uuid`.
 * @returns A map of dynamic route params.
 */
export const extractRouteParamsFromPath = (
  resolvedPath: string,
  routeTemplate: string,
  authenticatedUserId: string,
): Record<string, string> => {
  const resolvedSegments = resolvedPath.replace(/^\//, "").split("/");
  const templateSegments = routeTemplate.split("/");
  const params: Record<string, string> = {};

  for (let i = 0; i < templateSegments.length; i++) {
    const bracketMatch = templateSegments[i].match(/^\[(.+)\]$/);
    if (bracketMatch) {
      const paramName = bracketMatch[1];
      const segmentValue = resolvedSegments[i] ?? "";
      params[paramName] =
        paramName === "uuid" ? authenticatedUserId : segmentValue;
    }
  }

  return params;
};

/**
 * Extracts query string parameters that are NOT consumed by the route
 * template's dynamic segments.
 *
 * @example
 * extractExtraQueryParams("date=2026-09-17&foo=bar", "notes/users/[uuid]/[ref]")
 * // => { date: "2026-09-17", foo: "bar" }
 *
 * @param queryPart - The raw query string (without `?`), or null.
 * @param routeTemplate - The route template whose params to exclude.
 * @returns A map of the remaining query params.
 */
export const extractExtraQueryParams = (
  queryPart: string | null,
  routeTemplate: string,
): Record<string, string> => {
  if (!queryPart) return {};

  const params: Record<string, string> = {};
  const templateParamNames = new Set(
    routeTemplate
      .split("/")
      .map((s) => s.match(/^\[(.+)\]$/)?.[1])
      .filter(Boolean),
  );

  for (const pair of queryPart.split("&")) {
    const [k, v] = pair.split("=");
    if (k && v !== undefined && !templateParamNames.has(k)) {
      params[k] = decodeURIComponent(v);
    }
  }

  return params;
};

/**
 * Builds a navigation reset action that lands on `routeName` with params
 * parsed from a redirect URL.
 *
 * The redirect URL may contain `{{uuid}}` placeholders which are replaced
 * with the authenticated user's actual ID. Path segments are matched against
 * `routeName`'s template brackets to extract dynamic params. Any query-string
 * params not consumed by the route template are forwarded as extra params.
 *
 * @param routeName - The target route name.
 * @param redirectUrl - The redirect URL to resolve.
 * @param authenticatedUserId - The signed-in user's ID.
 * @returns A React Navigation reset action.
 */
export const buildRedirectResetAction = (
  routeName: string,
  redirectUrl: string,
  authenticatedUserId: string,
) => {
  const { pathPart, queryPart } = splitRedirectUrl(redirectUrl);
  const replacedPath = pathPart.replace("{{uuid}}", authenticatedUserId);
  const routeParams: Record<string, string> = {
    ...extractRouteParamsFromPath(replacedPath, routeName, authenticatedUserId),
    ...extractExtraQueryParams(queryPart, routeName),
  };
  const hasParams = Object.keys(routeParams).length > 0;
  const route = hasParams
    ? { name: routeName, params: routeParams }
    : { name: routeName };

  return CommonActions.reset({
    index: 0,
    routes: [route],
  });
};
