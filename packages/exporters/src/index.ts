export * from './excel.exporter';
export * from './csv.exporter';
export * from './json.exporter';

import { ExportType, Task, Run, StakeholderSummary } from '@task-platform/shared';
import { exportToExcel } from './excel.exporter';
import { exportToCSV } from './csv.exporter';
import { exportToJSON } from './json.exporter';

export async function exportTasks(
  type: ExportType,
  tasks: Task[],
  outputPath: string,
  options?: {
    run?: Partial<Run>;
    summary?: StakeholderSummary;
  }
): Promise<{ path: string; sizeBytes: number }> {
  switch (type) {
    case ExportType.XLSX:
      return exportToExcel(tasks, outputPath);
    case ExportType.CSV:
      return exportToCSV(tasks, outputPath);
    case ExportType.JSON:
      return exportToJSON(
        {
          run: options?.run,
          tasks,
          summary: options?.summary,
        },
        outputPath
      );
    default:
      throw new Error(`Unsupported export type: ${type}`);
  }
}
