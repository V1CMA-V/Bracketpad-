-- CreateEnum
CREATE TYPE "ReservationKind" AS ENUM ('free_play', 'class');

-- AlterTable
ALTER TABLE "court_reservation" ADD COLUMN     "coachId" TEXT,
ADD COLUMN     "kind" "ReservationKind" NOT NULL DEFAULT 'free_play',
ADD COLUMN     "playerCount" SMALLINT;

-- CreateTable
CREATE TABLE "coach" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "club_class_pricing" (
    "clubId" TEXT NOT NULL,
    "price1" DECIMAL(10,2),
    "price2" DECIMAL(10,2),
    "price3" DECIMAL(10,2),
    "price4" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'MXN',

    CONSTRAINT "club_class_pricing_pkey" PRIMARY KEY ("clubId")
);

-- CreateIndex
CREATE INDEX "coach_clubId_idx" ON "coach"("clubId");

-- CreateIndex
CREATE INDEX "court_reservation_coachId_startAt_idx" ON "court_reservation"("coachId", "startAt");

-- AddForeignKey
ALTER TABLE "coach" ADD CONSTRAINT "coach_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "club_class_pricing" ADD CONSTRAINT "club_class_pricing_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_reservation" ADD CONSTRAINT "court_reservation_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;
