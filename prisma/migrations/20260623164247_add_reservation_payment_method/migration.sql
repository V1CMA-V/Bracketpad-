-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'card');

-- AlterTable
ALTER TABLE "court_reservation" ADD COLUMN     "paymentMethod" "PaymentMethod";
