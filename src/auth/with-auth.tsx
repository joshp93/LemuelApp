import {
  Redirect,
  useLocalSearchParams,
  useNavigation,
  usePathname,
} from "expo-router";
import type { ComponentType } from "react";
import { type AuthUser, useAuth } from "./auth-context";

/**
 * Props injected by the `withAuth` HOC into the wrapped component.
 * Extend your component's props interface with this to access the
 * authenticated user object.
 *
 * @example
 * ```tsx
 * interface MyPageProps extends WithAuthProps {
 *   someOtherProp: string;
 * }
 *
 * function MyPage({ user, someOtherProp }: MyPageProps) { ... }
 *
 * export default withAuth(MyPage);
 * ```
 */
export interface WithAuthProps {
  /** The currently authenticated user — guaranteed non-null when the component renders. */
  user: AuthUser;
}

/**
 * Builds a query string from route params that are NOT consumed by route template
 * segments. These are "extra" params (like `date`) that don't correspond to any
 * `[paramName]` segment in the route path and must be preserved as query
 * parameters so they survive the authentication redirect round-trip.
 *
 * @param params - All local search params from the route (e.g. `{ uuid, ref, date }`).
 * @param routeTemplate - The route's path template (e.g. `/notes/users/[uuid]/[ref]`),
 *                        or `null` if unavailable.
 * @returns A query string like `?date=2026-08-27` or an empty string if no extra params.
 */
function buildExtraQueryString(
  params: Record<string, unknown>,
  routeTemplate: string | null,
): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== "string") continue;
    if (key === "uuid") continue;
    if (routeTemplate?.includes(`[${key}]`)) continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  }
  return parts.length > 0 ? `?${parts.join("&")}` : "";
}

/**
 * Builds the redirect path to pass as a query param during unauthenticated redirects.
 *
 * When a `uuid` local search param is present, its value is replaced with the
 * template `{{uuid}}` so that the final redirect URL can be resolved after login
 * with the authenticated user's actual id.
 *
 * Falls back to the resolved pathname from `usePathname()` when no uuid is present.
 *
 * @returns A path string suitable for use as a `redirect` query parameter.
 */
function useRedirectPath(): string {
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const navigation = useNavigation();
  const uuid = params.uuid;

  if (typeof uuid !== "string") {
    return pathname;
  }

  const state = navigation.getState();
  const route = state?.routes?.[state.index ?? 0];
  const routeTemplate = route ? `/${route.name}` : null;

  let result: string;

  if (uuid && pathname.includes(uuid)) {
    result = pathname.replace(uuid, "{{uuid}}");
  } else if (route) {
    result = `/${route.name}`;
    const uuidInRouteName = result.includes("[uuid]");

    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && result.includes(`[${key}]`)) {
        result = result.replace(
          `[${key}]`,
          key === "uuid" ? "{{uuid}}" : value,
        );
      }
    }

    if (!uuidInRouteName) {
      const segments = result.split("/");
      const usersIdx = segments.indexOf("users");
      if (usersIdx !== -1 && usersIdx + 1 < segments.length) {
        segments.splice(usersIdx + 1, 0, "{{uuid}}");
        result = segments.join("/");
      }
    }
  } else {
    return pathname;
  }

  const extraQuery = buildExtraQueryString(params, routeTemplate);
  return result + extraQuery;
}

/**
 * Higher-order component that guards a route behind authentication.
 *
 * - While auth state is loading, renders `null` (splash-style fallthrough).
 * - If no authenticated user is found, redirects to `/email-entry` with
 *   the current pathname as a `redirect` query param. Dynamic `[uuid]`
 *   segments are replaced with `{{uuid}}` so the authenticated user's id
 *   can be substituted after login.
 * - Otherwise, renders the wrapped component with the `user` object injected as a prop.
 *
 * @param Component - The page component to wrap. Must accept `user` via `WithAuthProps`.
 * @returns A component that requires authentication to render.
 */
export function withAuth<P extends WithAuthProps>(
  Component: ComponentType<P>,
): ComponentType<Omit<P, keyof WithAuthProps>> {
  function AuthenticatedRoute(props: Omit<P, keyof WithAuthProps>) {
    const { user, loading } = useAuth();
    const redirectPath = useRedirectPath();

    if (loading) {
      return null;
    }

    if (!user) {
      return (
        <Redirect
          href={`/email-entry?redirect=${encodeURIComponent(redirectPath)}`}
        />
      );
    }

    return <Component {...(props as P)} user={user} />;
  }

  return AuthenticatedRoute;
}
