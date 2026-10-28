/**
 * The set of authentication tokens provided by Cognito.
 *
 * Shared by the native and web token stores so both variants expose the same
 * shape.
 */
export interface AuthTokens {
  idToken: string;
  accessToken: string;
  refreshToken: string;
}
