import { Redirect } from "expo-router";
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
 * Higher-order component that guards a route behind authentication.
 *
 * - While auth state is loading, renders `null` (splash-style fallthrough).
 * - If no authenticated user is found, redirects to `/email-entry`.
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

    if (loading) {
      return null;
    }

    if (!user) {
      return <Redirect href="/email-entry" />;
    }

    return <Component {...(props as P)} user={user} />;
  }

  return AuthenticatedRoute;
}
