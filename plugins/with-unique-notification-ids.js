const {
  withAndroidManifest,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

const KOTLIN_SOURCE = `package com.lemuel.app.notification

import android.content.Context
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate
import expo.modules.notifications.service.interfaces.PresentationDelegate

/**
 * Custom NotificationsService that delegates to [UniqueIdPresentationDelegate]
 * to give every notification a distinct Android integer ID.
 *
 * The stock [ExpoPresentationDelegate] hardcodes the Android notification ID
 * to 0 for all notifications. On some Android versions / OEMs, sharing ID=0
 * causes notifications from this app to be auto-grouped, and dismissing one
 * may dismiss the entire group.
 *
 * This service overrides [getPresentationDelegate] to use a delegate whose
 * [getNotifyId] returns a hash of the notification identifier, giving each
 * day's proverb notification a unique Android notification ID.
 */
class LemuelNotificationsService : NotificationsService() {
  override fun getPresentationDelegate(context: Context): PresentationDelegate {
    return UniqueIdPresentationDelegate(context)
  }
}

class UniqueIdPresentationDelegate(context: Context) : ExpoPresentationDelegate(context) {
  override fun getNotifyId(request: NotificationRequest?): Int {
    val id = request?.identifier?.hashCode() ?: return 0
    return id and 0x7FFFFFFF
  }
}
`;

const RECEIVER_XML = `        <receiver
            android:name="com.lemuel.app.notification.LemuelNotificationsService"
            android:exported="false">
            <intent-filter>
                <action android:name="expo.modules.notifications.NOTIFICATION_EVENT" />
            </intent-filter>
        </receiver>`;

/** Remove the stock NotificationsService so ours is the only handler. */
const REMOVE_STOCK = `<receiver
            android:name="expo.modules.notifications.service.NotificationsService"
            android:exported="false"
            tools:node="remove" />`;

/**
 * Expo config plugin that gives each daily notification a unique Android
 * notification ID by replacing the stock NotificationsService with a custom
 * subclass that uses a hash of the notification identifier as the ID.
 */
module.exports = function withUniqueNotificationIds(config) {
  config = withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];
    if (!application) return config;

    if (!application.receiver) {
      application.receiver = [];
    }

    // Remove stock NotificationsService if present (from earlier runs)
    application.receiver = application.receiver.filter(
      (r) =>
        r.$["android:name"] !==
        "expo.modules.notifications.service.NotificationsService",
    );

    // Add our custom receiver
    application.receiver.push({
      $: {
        "android:name":
          "com.lemuel.app.notification.LemuelNotificationsService",
        "android:exported": "false",
      },
      "intent-filter": [
        {
          action: [
            {
              $: {
                "android:name": "expo.modules.notifications.NOTIFICATION_EVENT",
              },
            },
          ],
        },
      ],
    });

    // Add tools:node="remove" for the stock service to prevent manifest
    // merger from including both (which would make the component lookup
    // order-dependent).
    if (!manifest.manifest.$) manifest.manifest.$ = {};
    manifest.manifest.$["xmlns:tools"] =
      manifest.manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";

    application.receiver.push({
      $: {
        "android:name":
          "expo.modules.notifications.service.NotificationsService",
        "android:exported": "false",
        "tools:node": "remove",
      },
    });

    return config;
  });

  config = withDangerousMod(config, [
    "android",
    (config) => {
      const targetDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java/com/lemuel/app/notification",
      );
      const targetFile = path.join(targetDir, "LemuelNotificationsService.kt");

      fs.mkdirSync(targetDir, { recursive: true });
      fs.writeFileSync(targetFile, KOTLIN_SOURCE, "utf-8");

      return config;
    },
  ]);

  return config;
};
