-- AlterTable
ALTER TABLE "league_registration" ADD COLUMN     "partnerPlayerId" TEXT;

-- AddForeignKey
ALTER TABLE "league_registration" ADD CONSTRAINT "league_registration_partnerPlayerId_fkey" FOREIGN KEY ("partnerPlayerId") REFERENCES "player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
