-- AlterTable
ALTER TABLE "Run" ADD COLUMN     "meetingAgenda" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "meetingDate" TIMESTAMP(3),
ADD COLUMN     "meetingNextSteps" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "meetingNotes" TEXT,
ADD COLUMN     "meetingParticipants" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "meetingTitle" TEXT;
