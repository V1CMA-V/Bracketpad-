/*
  Warnings:

  - You are about to drop the column `closeTime` on the `club` table. All the data in the column will be lost.
  - You are about to drop the column `openTime` on the `club` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "club" DROP COLUMN "closeTime",
DROP COLUMN "openTime";

-- CreateTable
CREATE TABLE "club_hours" (
    "clubId" TEXT NOT NULL,
    "dayOfWeek" SMALLINT NOT NULL,
    "openTime" TEXT NOT NULL,
    "closeTime" TEXT NOT NULL,

    CONSTRAINT "club_hours_pkey" PRIMARY KEY ("clubId","dayOfWeek")
);

-- AddForeignKey
ALTER TABLE "club_hours" ADD CONSTRAINT "club_hours_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "club"("id") ON DELETE CASCADE ON UPDATE CASCADE;
