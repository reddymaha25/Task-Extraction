import { PrismaClient, Run as PrismaRun } from '@prisma/client';
import { prisma } from '../client';
import { Run, RunStats, StakeholderSummary, MeetingMinutes } from '@task-platform/shared';

/**
 * Repository for Run operations
 * Handles conversion between Prisma models and domain types
 */
export class RunRepository {
  constructor(private db: PrismaClient = prisma) {}

  /**
   * Create a new run
   */
  async create(data: {
    inputType: string;
    sourceName?: string;
    referenceTime?: Date;
    timezone?: string;
    llmMode: string;
    createdBy?: string;
  }): Promise<Run> {
    const run = await this.db.run.create({
      data: {
        inputType: data.inputType,
        sourceName: data.sourceName,
        referenceTime: data.referenceTime || new Date(),
        timezone: data.timezone || 'UTC',
        llmMode: data.llmMode,
        status: 'PENDING',
        createdBy: data.createdBy,
      },
    });

    return this.toDomain(run);
  }

  /**
   * Find run by ID
   */
  async findById(id: string): Promise<Run | null> {
    const run = await this.db.run.findUnique({
      where: { id },
      include: {
        documents: true,
        tasks: true,
        exportArtifacts: true,
      },
    });

    return run ? this.toDomain(run) : null;
  }

  /**
   * Update run status and stats
   */
  async updateStatus(
    id: string,
    status: string,
    stats?: Partial<RunStats>,
    errorMessage?: string
  ): Promise<Run> {
    const run = await this.db.run.update({
      where: { id },
      data: {
        status,
        taskCount: stats?.taskCount,
        highConfidenceCount: stats?.highConfidenceCount,
        processingDurationMs: stats?.processingDurationMs,
        llmCallCount: stats?.llmCallCount,
        errorMessage,
      },
    });

    return this.toDomain(run);
  }

  /**
   * Update run summary
   */
  async updateSummary(id: string, summary: StakeholderSummary): Promise<Run> {
    const run = await this.db.run.update({
      where: { id },
      data: {
        summaryDecisions: summary.decisions,
        summaryRisks: summary.risks,
        summaryAsks: summary.asks,
        summaryKeyPoints: summary.keyPoints,
      },
    });

    return this.toDomain(run);
  }

  /**
   * Update meeting minutes
   */
  async updateMeetingMinutes(id: string, meetingMinutes: MeetingMinutes): Promise<Run> {
    const run = await this.db.run.update({
      where: { id },
      data: {
        meetingTitle: meetingMinutes.title,
        meetingDate: meetingMinutes.date,
        meetingParticipants: meetingMinutes.participants,
        meetingAgenda: meetingMinutes.agenda,
        meetingNotes: meetingMinutes.notes,
        meetingNextSteps: meetingMinutes.nextSteps,
      },
    });

    return this.toDomain(run);
  }

  /**
   * List runs with pagination
   */
  async list(options: {
    page?: number;
    limit?: number;
    status?: string;
    inputType?: string;
  }): Promise<{ runs: Run[]; total: number }> {
    const page = options.page || 1;
    const limit = options.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options.status) where.status = options.status;
    if (options.inputType) where.inputType = options.inputType;

    const [runs, total] = await Promise.all([
      this.db.run.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.db.run.count({ where }),
    ]);

    return {
      runs: runs.map((r: PrismaRun) => this.toDomain(r)),
      total,
    };
  }

  /**
   * Delete a run (cascade deletes related records)
   */
  async delete(id: string): Promise<void> {
    await this.db.run.delete({
      where: { id },
    });
  }

  /**
   * Convert Prisma model to domain type
   */
  private toDomain(run: PrismaRun): Run {
    const meetingMinutes: MeetingMinutes | undefined = 
      run.meetingTitle || run.meetingDate || run.meetingParticipants.length > 0 || 
      run.meetingAgenda.length > 0 || run.meetingNotes || run.meetingNextSteps.length > 0
      ? {
          title: run.meetingTitle || undefined,
          date: run.meetingDate || undefined,
          participants: run.meetingParticipants,
          agenda: run.meetingAgenda,
          notes: run.meetingNotes || undefined,
          nextSteps: run.meetingNextSteps,
        }
      : undefined;

    return {
      id: run.id,
      createdAt: run.createdAt,
      updatedAt: run.updatedAt,
      createdBy: run.createdBy || undefined,
      inputType: run.inputType as any,
      sourceName: run.sourceName || undefined,
      referenceTime: run.referenceTime,
      timezone: run.timezone,
      status: run.status as any,
      llmMode: run.llmMode as any,
      summary: {
        decisions: run.summaryDecisions,
        risks: run.summaryRisks,
        asks: run.summaryAsks,
        keyPoints: run.summaryKeyPoints,
      },
      meetingMinutes,
      stats: {
        taskCount: run.taskCount,
        highConfidenceCount: run.highConfidenceCount,
        processingDurationMs: run.processingDurationMs || undefined,
        llmCallCount: run.llmCallCount || undefined,
      },
      errorMessage: run.errorMessage || undefined,
    };
  }
}

export function createRunRepository(db?: PrismaClient): RunRepository {
  return new RunRepository(db);
}
