# Widget Implementation

The app displays a home screen widget showing today's proverb, automatically updating daily.

## Architecture

- **Voltra** - Provides Android widget support via Jetpack Compose Glance
- **Background Task** - Scheduled daily updates via expo-background-task
- **Config** - Widget defined in app.json plugins

## Key Files

- `src/widgets/proverb-widget.tsx` - Widget component
- `src/background/proverb-task.ts` - Background update scheduling
- `app.json` - Voltra plugin configuration
