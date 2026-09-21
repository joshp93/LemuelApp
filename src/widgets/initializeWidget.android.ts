import { initializeWidget } from "./widget-service";

/**
 * Triggers an immediate widget reload on Android.
 *
 * The widget endpoint is unauthenticated and rate-limited at the API Gateway
 * level (100 req/s steady, 200 burst). No credentials are required.
 */
export { initializeWidget };