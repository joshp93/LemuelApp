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

  if (uuid && pathname.includes(uuid)) {
    return pathname.replace(uuid, "{{uuid}}");
  }

  const state = navigation.getState();
  const route = state?.routes?.[state.index ?? 0];
  if (!route) return pathname;

  let result = `/${route.name}`;
  const uuidInRouteName = result.includes("[uuid]");

  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string" && result.includes(`[${key}]`)) {
      result = result.replace(`[${key}]`, key === "uuid" ? "{{uuid}}" : value);
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

  return result;
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
