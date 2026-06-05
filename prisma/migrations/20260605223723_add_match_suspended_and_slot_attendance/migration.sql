-- CreateEnum
CREATE TYPE "SlotAttendance" AS ENUM ('pending', 'present', 'absent');

-- AlterEnum
ALTER TYPE "MatchStatus" ADD VALUE 'suspended';

-- AlterTable
ALTER TABLE "league_group_slot" ADD COLUMN     "attendance" "SlotAttendance" NOT NULL DEFAULT 'pending',
ADD COLUMN     "substituteName" TEXT;
