CREATE TABLE "machine_models" (
  "id"         SERIAL  NOT NULL,
  "name"       TEXT    NOT NULL,
  "categoryId" INTEGER NOT NULL,

  CONSTRAINT "machine_models_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "machine_models_categoryId_idx" ON "machine_models"("categoryId");

ALTER TABLE "machine_models"
  ADD CONSTRAINT "machine_models_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "machine_categories"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
