import ExcelJS from 'exceljs';
import { Task } from '@task-platform/shared';
import { promises as fs } from 'fs';

export async function exportToExcel(
  tasks: Task[],
  outputPath: string
): Promise<{ path: string; sizeBytes: number }> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Tasks');

  // Define columns
  worksheet.columns = [
    { header: 'Title', key: 'title', width: 40 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Owner', key: 'owner', width: 20 },
    { header: 'Due Date', key: 'dueDate', width: 15 },
    { header: 'Priority', key: 'priority', width: 10 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Confidence', key: 'confidence', width: 12 },
    { header: 'Source Quote', key: 'sourceQuote', width: 60 },
    { header: 'Tags', key: 'tags', width: 30 },
  ];

  // Style header row
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' },
  };

  // Add data
  tasks.forEach(task => {
    worksheet.addRow({
      title: task.title,
      description: task.description || '',
      owner: task.ownerNormalized || task.ownerRaw || '',
      dueDate: task.dueDateISO ? new Date(task.dueDateISO).toLocaleDateString() : '',
      priority: task.priority || '',
      status: task.status,
      confidence: Math.round(task.confidence * 100) + '%',
      sourceQuote: task.sourceQuote,
      tags: task.tags.join(', '),
    });
  });

  // Save to file
  await workbook.xlsx.writeFile(outputPath);

  const stats = await fs.stat(outputPath);
  return {
    path: outputPath,
    sizeBytes: stats.size,
  };
}
