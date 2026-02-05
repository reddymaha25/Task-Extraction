import { PrismaClient, Task as PrismaTask } from '@prisma/client';
import { prisma } from '../client';
import { Task, SourceLocation, TaskStatus, Priority } from '@task-platform/shared';

/**
 * Repository for Task operations
 */
export class TaskRepository {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Create a new task
   */
  async create(data: {
    runId: string;
    title: string;
    description?: string;
    ownerRaw?: string;
    ownerNormalized?: string;
    dueDateRaw?: string;
    dueDateISO?: Date;
    priority?: Priority;
    status?: TaskStatus;
    confidence: number;
    sourceQuote: string;
    sourceLocation?: SourceLocation;
    tags?: string[];
  }): Promise<Task> {
    const task = await this.db.task.create({
      data: {
        runId: data.runId,
        title: data.title,
        description: data.description,
        ownerRaw: data.ownerRaw,
        ownerNormalized: data.ownerNormalized,
        dueDateRaw: data.dueDateRaw,
        dueDateISO: data.dueDateISO,
        priority: data.priority,
        status: data.status || 'NEW',
        confidence: data.confidence,
        sourceQuote: data.sourceQuote,
        sourceLocationPage: data.sourceLocation?.page,
        sourceLocationSection: data.sourceLocation?.section,
        sourceLocationParagraph: data.sourceLocation?.paragraphIndex,
        sourceLocationLine: data.sourceLocation?.lineNumber,
        tags: data.tags || [],
      },
    });

    return this.toDomain(task);
  }

  /**
   * Create multiple tasks in a transaction
   */
  async createMany(tasks: Array<{
    runId: string;
    title: string;
    description?: string;
    ownerRaw?: string;
    ownerNormalized?: string;
    dueDateRaw?: string;
    dueDateISO?: Date;
    priority?: Priority;
    status?: TaskStatus;
    confidence: number;
    sourceQuote: string;
    sourceLocation?: SourceLocation;
    tags?: string[];
  }>): Promise<Task[]> {
    const created = await this.db.$transaction(
      tasks.map(data =>
        this.db.task.create({
          data: {
            runId: data.runId,
            title: data.title,
            description: data.description,
            ownerRaw: data.ownerRaw,
            ownerNormalized: data.ownerNormalized,
            dueDateRaw: data.dueDateRaw,
            dueDateISO: data.dueDateISO,
            priority: data.priority,
            status: data.status || 'NEW',
            confidence: data.confidence,
            sourceQuote: data.sourceQuote,
            sourceLocationPage: data.sourceLocation?.page,
            sourceLocationSection: data.sourceLocation?.section,
            sourceLocationParagraph: data.sourceLocation?.paragraphIndex,
            sourceLocationLine: data.sourceLocation?.lineNumber,
            tags: data.tags || [],
          },
        })
      )
    );

    return created.map((t: PrismaTask) => this.toDomain(t));
  }

  /**
   * Find task by ID
   */
  async findById(id: string): Promise<Task | null> {
    const task = await this.db.task.findUnique({
      where: { id },
    });

    return task ? this.toDomain(task) : null;
  }

  /**
   * Find all tasks for a run
   */
  async findByRunId(runId: string): Promise<Task[]> {
    const tasks = await this.db.task.findMany({
      where: { runId },
      orderBy: [
        { confidence: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    return tasks.map((t: PrismaTask) => this.toDomain(t));
  }

  /**
   * Update a task
   */
  async update(
    id: string,
    data: Partial<{
      title: string;
      description: string;
      ownerNormalized: string;
      dueDateISO: Date;
      priority: Priority;
      status: TaskStatus;
      tags: string[];
      integrationState: Record<string, any>;
    }>
  ): Promise<Task> {
    const task = await this.db.task.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        ownerNormalized: data.ownerNormalized,
        dueDateISO: data.dueDateISO,
        priority: data.priority,
        status: data.status,
        tags: data.tags,
        integrationState: data.integrationState,
      },
    });

    return this.toDomain(task);
  }

  /**
   * Update integration state for a task
   */
  async updateIntegrationState(
    id: string,
    targetName: string,
    state: {
      externalId?: string;
      syncStatus?: string;
      lastSyncedAt?: Date;
      errorMessage?: string;
    }
  ): Promise<Task> {
    const task = await this.db.task.findUnique({ where: { id } });
    if (!task) {
      throw new Error(`Task ${id} not found`);
    }

    const integrationState = task.integrationState as Record<string, any>;
    integrationState[targetName] = {
      ...integrationState[targetName],
      ...state,
    };

    return this.update(id, { integrationState });
  }

  /**
   * Delete a task
   */
  async delete(id: string): Promise<void> {
    await this.db.task.delete({
      where: { id },
    });
  }

  /**
   * Convert Prisma model to domain type
   */
  private toDomain(task: PrismaTask): Task {
    return {
      id: task.id,
      runId: task.runId,
      title: task.title,
      description: task.description || undefined,
      ownerRaw: task.ownerRaw || undefined,
      ownerNormalized: task.ownerNormalized || undefined,
      dueDateRaw: task.dueDateRaw || undefined,
      dueDateISO: task.dueDateISO?.toISOString(),
      priority: task.priority as Priority | undefined,
      status: task.status as TaskStatus,
      confidence: task.confidence,
      sourceQuote: task.sourceQuote,
      sourceLocation: {
        page: task.sourceLocationPage || undefined,
        section: task.sourceLocationSection || undefined,
        paragraphIndex: task.sourceLocationParagraph || undefined,
        lineNumber: task.sourceLocationLine || undefined,
      },
      tags: task.tags,
      integrationState: task.integrationState as Record<string, any>,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    };
  }
}

export function createTaskRepository(db?: PrismaClient): TaskRepository {
  return new TaskRepository(db);
}
