import { Task, Run, StakeholderSummary } from '@task-platform/shared';
import { promises as fs } from 'fs';

export async function exportToJSON(
  data: {
    run?: Partial<Run>;
    tasks: Task[];
    summary?: StakeholderSummary;
  },
  outputPath: string
): Promise<{ path: string; sizeBytes: number }> {
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(outputPath, json, 'utf8');

  const stats = await fs.stat(outputPath);
  return {
    path: outputPath,
    sizeBytes: stats.size,
  };
}
