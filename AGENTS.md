# Lemuel

A daily proverb app that displays a new proverb each day and encourages users to meditate on it.

## What the app does

- Fetches a daily proverb from an API and displays it in the app
- Shows a widget on the home screen with today's proverb (auto-updates daily)

## Ultimate Goals

- ✅ **Widget** - Home screen widget showing the Daily Proverb (see `WIDGET_IMPLEMENTATION.md`)
- Push notifications reminding users to meditate on the daily proverb
- Notes/comments system for personal reflections (public or private)

Backend is separate (AWS Lambda). API changes needed for features beyond the app's direct functionality.

## Development Guidelines

- Uses pnpm and TypeScript
- Unit tests required
- Don't modify generated files (e.g., android folder - regenerated on build)
- Follow Expo documentation
- Avoid building/running unless asked; if needed, ask first
- Optimize imports
