-- Add geolocation and availability fields to machines
ALTER TABLE "machines"
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "availabilityStart" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "availabilityEnd" TIMESTAMP(3);

-- Add tracking and rental duration fields to rentals
ALTER TABLE "rentals"
  ADD COLUMN IF NOT EXISTS "rentalDays" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "machineLatitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "machineLongitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "baseMachineLatitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "baseMachineLongitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "trackingUpdatedAt" TIMESTAMP(3);

-- Remove unique constraint on (machineId, startDate) — replaced by overlap check in app
ALTER TABLE "rentals" DROP CONSTRAINT IF EXISTS "rentals_machineId_startDate_key";

-- Rebuild RentalStatus enum to drop provider_confirmed and active, keeping confirmed
-- Step 1: Create the new enum type
CREATE TYPE "RentalStatus_new" AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');

-- Step 2: Drop the column default before type change
ALTER TABLE "rentals" ALTER COLUMN "status" DROP DEFAULT;

-- Step 3: Change the column type, mapping old values
ALTER TABLE "rentals"
  ALTER COLUMN "status" TYPE "RentalStatus_new"
  USING CASE "status"::text
    WHEN 'provider_confirmed' THEN 'confirmed'::text
    WHEN 'active' THEN 'confirmed'::text
    ELSE "status"::text
  END::"RentalStatus_new";

-- Step 4: Restore the default using the new type
ALTER TABLE "rentals" ALTER COLUMN "status" SET DEFAULT 'pending'::"RentalStatus_new";

-- Step 5: Drop old enum and rename
DROP TYPE "RentalStatus";
ALTER TYPE "RentalStatus_new" RENAME TO "RentalStatus";

-- Create rental status history table
CREATE TABLE IF NOT EXISTS "rental_status_history" (
  "id" SERIAL NOT NULL,
  "rentalId" INTEGER NOT NULL,
  "status" "RentalStatus" NOT NULL,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "rental_status_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "rental_status_history_rentalId_idx"
  ON "rental_status_history"("rentalId");

ALTER TABLE "rental_status_history"
  ADD CONSTRAINT "rental_status_history_rentalId_fkey"
  FOREIGN KEY ("rentalId") REFERENCES "rentals"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
