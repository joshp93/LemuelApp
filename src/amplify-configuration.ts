import { Amplify } from "@aws-amplify/core";
import amplifyconfig from "../amplify_outputs.json";

export function configureAmplify() {
  Amplify.configure(amplifyconfig);
}

export const isConfigured = () => !!amplifyconfig.Auth.Cognito.userPoolId;
