import { stringify } from 'csv-stringify/sync';
import { Task } from '@task-platform/shared';
import { promises as fs } from 'fs';

export async function exportToCSV(
  tasks: Task[],
  outputPath: string
): Promise<{ path: string; sizeBytes: number }> {
  const records = tasks.map(task => ({
    title: task.title,
    description: task.description || '',
    owner: task.ownerNormalized || task.ownerRaw || '',
    dueDate: task.dueDateISO ? new Date(task.dueDateISO).toLocaleDateString() : '',
    priority: task.priority || '',
    status: task.status,
    confidence: Math.round(task.confidence * 100) + '%',
    sourceQuote: task.sourceQuote,
    tags: task.tags.join(';'),
  }));

  const csv = stringify(records, {
    header: true,
    columns: {
      title: 'Title',
      description: 'Description',
      owner: 'Owner',
      dueDate: 'Due Date',
      priority: 'Priority',
      status: 'Status',
      confidence: 'Confidence',
      sourceQuote: 'Source Quote',
      tags: 'Tags',
    },
  });

  await fs.writeFile(outputPath, csv, 'utf8');

  const stats = await fs.stat(outputPath);
  return {
    path: outputPath,
    sizeBytes: stats.size,
  };
}
