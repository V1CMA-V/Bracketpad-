-- AlterTable
ALTER TABLE "league" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'MXN',
ADD COLUMN     "entryFee" DECIMAL(10,2);
