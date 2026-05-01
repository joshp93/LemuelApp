import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { getProverbForTheDay } from '../_api/proverbs';
import { saveProverbForWidget } from './widget-storage';

/**
 * Task name for the widget background update
 */
export const WIDGET_UPDATE_TASK = 'WIDGET_UPDATE_TASK';

/**
 * Registers the background task that runs daily and immediately fetches proverb
 */
export async function registerWidgetUpdateTask(): Promise<void> {
  try {
    const isAlreadyRegistered = await isWidgetTaskRegistered();

    // Define the task
    TaskManager.defineTask(WIDGET_UPDATE_TASK, async () => {
      try {
        console.log('Running widget background update task...');
        const proverb = await getProverbForTheDay();
        await saveProverbForWidget(proverb);
        console.log('Widget updated successfully with proverb:', proverb.ref);
        return BackgroundFetch.BackgroundFetchResult.NewData;
      } catch (error) {
        console.error('Error in widget background update task:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
      }
    });

    // If not already registered, register and run immediately
    if (!isAlreadyRegistered) {
      await BackgroundFetch.registerTaskAsync(WIDGET_UPDATE_TASK, {
        minimumInterval: 60 * 60 * 24,
        stopOnTerminate: false,
        startOnBoot: true,
      });

      // Run immediately after first registration
      await manuallyUpdateWidget();
      console.log('Widget update task registered with immediate run');
    } else {
      console.log('Widget update task already registered');
    }
  } catch (error) {
    console.error('Failed to register widget update task:', error);
    throw error;
  }
}

/**
 * Unregisters the background task
 */
export async function unregisterWidgetUpdateTask(): Promise<void> {
  try {
    await BackgroundFetch.unregisterTaskAsync(WIDGET_UPDATE_TASK);
    console.log('Widget update task unregistered');
  } catch (error) {
    console.error('Failed to unregister widget update task:', error);
    throw error;
  }
}

/**
 * Checks if the widget task is registered
 */
export async function isWidgetTaskRegistered(): Promise<boolean> {
  try {
    const tasks = await BackgroundFetch.getRegisteredTasksAsync();
    return tasks.some((task) => task.taskName === WIDGET_UPDATE_TASK);
  } catch (error) {
    console.error('Error checking widget task registration:', error);
    return false;
  }
}

/**
 * Triggers a manual widget update (useful for testing or forcing updates)
 */
export async function manuallyUpdateWidget(): Promise<void> {
  try {
    console.log('Manually updating widget...');
    const proverb = await getProverbForTheDay();
    await saveProverbForWidget(proverb);
    console.log('Widget manually updated with proverb:', proverb.ref);
  } catch (error) {
    console.error('Error manually updating widget:', error);
    throw error;
  }
}

/**
 * Calculates the delay until the next 5:05 AM
 * Returns milliseconds until the next scheduled time
 */
export function getDelayUntilNextUpdate(): number {
  const now = new Date();
  const nextUpdate = new Date(now);

  // Set to 5:05 AM
  nextUpdate.setHours(5, 5, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (nextUpdate <= now) {
    nextUpdate.setDate(nextUpdate.getDate() + 1);
  }

  return nextUpdate.getTime() - now.getTime();
}
