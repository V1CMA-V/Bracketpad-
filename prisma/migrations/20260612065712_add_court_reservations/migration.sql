-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('confirmed', 'cancelled');

-- CreateEnum
CREATE TYPE "ReservationPaymentStatus" AS ENUM ('paid', 'pending', 'partial');

-- CreateTable
CREATE TABLE "court_reservation" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "courtId" TEXT NOT NULL,
    "holderName" TEXT NOT NULL,
    "phone" TEXT,
    "startAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" SMALLINT NOT NULL,
    "status" "ReservationStatus" NOT NULL DEFAULT 'confirmed',
    "paymentStatus" "ReservationPaymentStatus" NOT NULL DEFAULT 'pending',
    "price" DECIMAL(10,2),
    "amountPaid" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "court_reservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "court_reservation_clubId_startAt_idx" ON "court_reservation"("clubId", "startAt");

-- CreateIndex
CREATE INDEX "court_reservation_courtId_startAt_idx" ON "court_reservation"("courtId", "startAt");

-- AddForeignKey
ALTER TABLE "court_reservation" ADD CONSTRAINT "court_reservation_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "court_reservation" ADD CONSTRAINT "court_reservation_courtId_fkey" FOREIGN KEY ("courtId") REFERENCES "court"("id") ON DELETE CASCADE ON UPDATE CASCADE;
