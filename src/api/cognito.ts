import {
  ChallengeNameType,
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  GlobalSignOutCommand,
  InitiateAuthCommand,
  ResendConfirmationCodeCommand,
  RespondToAuthChallengeCommand,
  SignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { COGNITO_CONFIG } from "../../config/cognito";
import { remoteLog } from "./remote-logger";

const cognitoClient = new CognitoIdentityProviderClient({
  region: COGNITO_CONFIG.region,
});

const USER_POOL_ID = COGNITO_CONFIG.userPoolId;
const CLIENT_ID = COGNITO_CONFIG.clientId;

/**
 * Signs up a new user with the given email and password.
 * @param email The user's email address, used as their username.
 * @param password The user's chosen password.
 * @returns The result of the SignUpCommand from Cognito.
 */
export async function signUp(email: string, password: string) {
  const command = new SignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    Password: password,
    UserAttributes: [{ Name: "email", Value: email }],
  });
  return cognitoClient.send(command);
}

/**
 * Confirms the user's account with a verification code.
 * @param email The user's email address (username).
 * @param code The confirmation code sent to the user.
 * @returns The result of the ConfirmSignUpCommand from Cognito.
 */
export async function confirmSignUp(email: string, code: string) {
  const command = new ConfirmSignUpCommand({
    ClientId: CLIENT_ID,
    Username: email,
    ConfirmationCode: code,
  });
  return cognitoClient.send(command);
}

/**
 * Resends the confirmation code to the user's email.
 * Use this when a user needs a new verification code.
 * @param email The user's email address (username).
 * @returns The result of the ResendConfirmationCodeCommand from Cognito.
 */
export async function resendConfirmationCode(email: string) {
  const command = new ResendConfirmationCodeCommand({
    ClientId: CLIENT_ID,
    Username: email,
  });
  return cognitoClient.send(command);
}

/**
 * Initiates the sign-in process for a user.
 * This uses the USER_PASSWORD_AUTH flow with standard password authentication.
 * @param email The user's email address (username).
 * @param password The user's password.
 * @returns The result of the InitiateAuthCommand, containing auth tokens on success.
 */
export async function signIn(email: string, password: string) {
  return cognitoClient.send(
    new InitiateAuthCommand({
      AuthFlow: "USER_PASSWORD_AUTH",
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
      },
      ClientId: CLIENT_ID,
    }),
  );
}

export async function respondToAuthChallenge(
  challengeName: ChallengeNameType,
  session: string,
  challengeResponses: { [key: string]: string },
) {
  const command = new RespondToAuthChallengeCommand({
    ChallengeName: challengeName,
    ClientId: CLIENT_ID,
    Session: session,
    ChallengeResponses: challengeResponses,
  });
  return cognitoClient.send(command);
}

/**
 * Refreshes the user's access and ID tokens using a refresh token.
 * Does not return a new refresh token - the same one is reused.
 * @param refreshToken The refresh token to use for getting new tokens
 * @returns Object with new IdToken and AccessToken, or null if refresh fails
 */
export async function refreshTokens(refreshToken: string): Promise<{
  idToken: string;
  accessToken: string;
} | null> {
  try {
    const response = await cognitoClient.send(
      new InitiateAuthCommand({
        AuthFlow: "REFRESH_TOKEN_AUTH",
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
        ClientId: CLIENT_ID,
      }),
    );

    const { IdToken, AccessToken } = response.AuthenticationResult || {};

    if (IdToken && AccessToken) {
      return {
        idToken: IdToken,
        accessToken: AccessToken,
      };
    }

    return null;
  } catch (error) {
    remoteLog("error", "[Cognito] Token refresh failed", { error });
    return null;
  }
}

/**
 * Signs the user out globally from all devices.
 * @param accessToken The user's access token.
 * @returns The result of the GlobalSignOutCommand from Cognito.
 */
export async function signOut(accessToken: string) {
  const command = new GlobalSignOutCommand({
    AccessToken: accessToken,
  });
  return cognitoClient.send(command);
}
