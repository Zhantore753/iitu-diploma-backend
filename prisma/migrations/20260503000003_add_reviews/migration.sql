CREATE TABLE "reviews" (
  "id"        SERIAL       NOT NULL,
  "machineId" INTEGER      NOT NULL,
  "renterId"  INTEGER      NOT NULL,
  "rentalId"  INTEGER      NOT NULL,
  "rating"    INTEGER      NOT NULL,
  "text"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "reviews_pkey"               PRIMARY KEY ("id"),
  CONSTRAINT "reviews_rentalId_key"       UNIQUE ("rentalId"),
  CONSTRAINT "reviews_machineId_renterId_key" UNIQUE ("machineId", "renterId")
);

CREATE INDEX "reviews_machineId_idx" ON "reviews"("machineId");

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_machineId_fkey"
  FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_renterId_fkey"
  FOREIGN KEY ("renterId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reviews"
  ADD CONSTRAINT "reviews_rentalId_fkey"
  FOREIGN KEY ("rentalId") REFERENCES "rentals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
