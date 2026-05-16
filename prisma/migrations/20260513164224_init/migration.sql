-- DropIndex
DROP INDEX "rentals_machineId_startDate_key";

-- AlterTable
ALTER TABLE "conversations" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "rentals" ALTER COLUMN "rentalDays" DROP DEFAULT;
