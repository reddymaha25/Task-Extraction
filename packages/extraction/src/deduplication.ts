import { Task, stringSimilarity, DEDUP_SIMILARITY_THRESHOLD } from '@task-platform/shared';

/**
 * Deduplicate tasks based on similarity
 * Merges tasks that are highly similar in title and have same owner/due date
 */
export function deduplicateTasks(tasks: Task[]): Task[] {
  if (tasks.length === 0) {
    return [];
  }

  const deduplicated: Task[] = [];
  const merged = new Set<number>(); // Track merged task indices

  for (let i = 0; i < tasks.length; i++) {
    if (merged.has(i)) {
      continue;
    }

    const currentTask = tasks[i];
    let bestMatch = currentTask;
    let bestConfidence = currentTask.confidence;

    // Look for duplicates
    for (let j = i + 1; j < tasks.length; j++) {
      if (merged.has(j)) {
        continue;
      }

      const otherTask = tasks[j];

      // Check if they're similar
      if (areSimilarTasks(currentTask, otherTask)) {
        merged.add(j);

        // Keep the one with higher confidence
        if (otherTask.confidence > bestConfidence) {
          bestMatch = otherTask;
          bestConfidence = otherTask.confidence;
        }
      }
    }

    deduplicated.push(bestMatch);
  }

  return deduplicated;
}

/**
 * Check if two tasks are similar enough to be considered duplicates
 */
function areSimilarTasks(task1: Task, task2: Task): boolean {
  // Title similarity
  const titleSimilarity = stringSimilarity(
    task1.title.toLowerCase(),
    task2.title.toLowerCase()
  );

  if (titleSimilarity < DEDUP_SIMILARITY_THRESHOLD) {
    return false;
  }

  // Same owner (if both have owners)
  if (task1.ownerRaw && task2.ownerRaw) {
    const ownerSimilarity = stringSimilarity(
      task1.ownerRaw.toLowerCase(),
      task2.ownerRaw.toLowerCase()
    );
    if (ownerSimilarity < 0.8) {
      return false;
    }
  }

  // Same due date (if both have dates)
  if (task1.dueDateISO && task2.dueDateISO) {
    if (task1.dueDateISO !== task2.dueDateISO) {
      return false;
    }
  }

  return true;
}

/**
 * Merge similar tasks (combine information)
 */
export function mergeTasks(task1: Task, task2: Task): Task {
  // Take the one with higher confidence as base
  const base = task1.confidence >= task2.confidence ? task1 : task2;
  const other = task1.confidence >= task2.confidence ? task2 : task1;

  return {
    ...base,
    // Merge descriptions if both exist
    description: base.description || other.description,
    // Use more specific owner
    ownerRaw: base.ownerRaw || other.ownerRaw,
    ownerNormalized: base.ownerNormalized || other.ownerNormalized,
    // Use more specific date
    dueDateRaw: base.dueDateRaw || other.dueDateRaw,
    dueDateISO: base.dueDateISO || other.dueDateISO,
    // Use higher priority
    priority: base.priority || other.priority,
    // Combine tags
    tags: [...new Set([...base.tags, ...other.tags])],
    // Keep the longer/more detailed quote
    sourceQuote: base.sourceQuote.length >= other.sourceQuote.length 
      ? base.sourceQuote 
      : other.sourceQuote,
  };
}
