-- AlterTable
ALTER TABLE "club" ADD COLUMN     "country" TEXT DEFAULT 'México',
ADD COLUMN     "description" TEXT,
ADD COLUMN     "foundedYear" SMALLINT,
ADD COLUMN     "instagram" TEXT,
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "state" TEXT,
ADD COLUMN     "taxId" TEXT,
ADD COLUMN     "website" TEXT;
