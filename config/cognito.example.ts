/**
 * Cognito configuration template
 * Copy this file to cognito.ts and fill in your actual credentials
 * cognito.ts is gitignored and not committed to version control
 */

export const COGNITO_CONFIG = {
  region: "eu-west-2",
  userPoolId: "eu-west-2_xxxxxxxxxx", // Replace with your User Pool ID
  clientId: "xxxxxxxxxxxxxxxxxxxxxxxxxx", // Replace with your Client ID
} as const;
