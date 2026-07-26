# Privacy Policy

**Last updated: 26 July 2026**

## Summary

Lemuel is a daily proverb and meditation app. Your privacy matters. Here's what you need to know:

- **We only collect what's necessary** — an email address for your account and the notes you choose to write.
- **Your notes can be shared** — notes are visible to other users by default (community notes feature).
- **No tracking, no ads, no third-party analytics.**
- **You can delete your account and data at any time.**

## Data We Collect

### Information You Provide

| Data | Purpose |
|---|---|
| **Email address** | Account creation and authentication via AWS Cognito |
| **Rich-text notes** | Personal journaling and community notes feature — stored in AWS DynamoDB |
| **Meditation & note stats** | Displayed on your account page (meditations completed, notes written) |

### Information Collected Automatically

| Data | Purpose |
|---|---|
| **Device push token** | To send you daily notification reminders via Firebase Cloud Messaging (FCM) |
| **Device platform** (iOS/Android) | Included with push token registration |
| **App logs** (level, message, diagnostic context) | For debugging and improving app reliability — sent to our backend API |

### Information Stored Only on Your Device

The following preferences never leave your device and are stored via AsyncStorage:

- Notification preferences (on/off, scheduled time, random window)
- Meditation timer duration
- Bible version selection
- Authentication session tokens

## How We Use Your Data

- To create and manage your account
- To deliver daily proverb notifications
- To save and display your notes (including community notes)
- To display your meditation and journaling stats
- To diagnose and fix technical issues

## Data Sharing

- **Community notes** — Your notes for any given proverb are visible to other authenticated users. This is a core feature of the app.
- **Service providers** — We use AWS (Cognito, Lambda, API Gateway, DynamoDB) and Firebase Cloud Messaging to operate the app. These providers process data under their own security and privacy commitments.
- **We do not sell your data.** We do not share data with advertisers or third-party analytics services.

## Data Retention

We retain your account data and notes for as long as your account exists. You can request deletion at any time (see below).

## Account Deletion

You can delete your account and all associated data by:

1. Sending a deletion request to **joshp93@gmail.com** with the email address used for your Lemuel account.
2. We will remove your account record, notes, and associated data from our systems within 30 days.

## Children's Privacy

Lemuel is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, contact us and we will delete it.

## Security

We use industry-standard encryption in transit (HTTPS/TLS) for all communication between the app and our backend. Authentication tokens are stored securely on your device. AWS Cognito handles password storage and verification.

## Changes to This Policy

If we make material changes, we will update the "Last updated" date at the top of this policy and notify users via the app.

## Contact

For questions, data deletion requests, or privacy concerns:

**Email:** joshp93@gmail.com
