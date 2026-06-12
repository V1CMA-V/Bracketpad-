-- CreateTable
CREATE TABLE "club_court_rate" (
    "id" TEXT NOT NULL,
    "clubId" TEXT NOT NULL,
    "label" TEXT,
    "days" INTEGER[],
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MXN',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "club_court_rate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "club_court_rate_clubId_idx" ON "club_court_rate"("clubId");

-- AddForeignKey
ALTER TABLE "club_court_rate" ADD CONSTRAINT "club_court_rate_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
