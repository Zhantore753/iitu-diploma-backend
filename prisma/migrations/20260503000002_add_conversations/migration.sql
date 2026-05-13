-- Drop old rental-chat tables (no production data)
DROP TABLE IF EXISTS "messages" CASCADE;
DROP TABLE IF EXISTS "chats" CASCADE;

-- Remove chat relation from rentals
ALTER TABLE "rentals" DROP COLUMN IF EXISTS "chat";

-- Add conversations table
CREATE TABLE "conversations" (
  "id"             SERIAL       NOT NULL,
  "machineId"      INTEGER,
  "participant1Id" INTEGER      NOT NULL,
  "participant2Id" INTEGER      NOT NULL,
  "p1LastReadAt"   TIMESTAMP(3),
  "p2LastReadAt"   TIMESTAMP(3),
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversations_participant1Id_participant2Id_machineId_key"
  ON "conversations"("participant1Id", "participant2Id", "machineId");

CREATE INDEX "conversations_participant1Id_idx" ON "conversations"("participant1Id");
CREATE INDEX "conversations_participant2Id_idx" ON "conversations"("participant2Id");

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_participant1Id_fkey"
  FOREIGN KEY ("participant1Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_participant2Id_fkey"
  FOREIGN KEY ("participant2Id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "conversations"
  ADD CONSTRAINT "conversations_machineId_fkey"
  FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add messages table (new schema, linked to conversations)
CREATE TABLE "messages" (
  "id"             SERIAL       NOT NULL,
  "conversationId" INTEGER      NOT NULL,
  "senderId"       INTEGER      NOT NULL,
  "text"           TEXT         NOT NULL,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "messages_conversationId_idx" ON "messages"("conversationId");

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_conversationId_fkey"
  FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "messages"
  ADD CONSTRAINT "messages_senderId_fkey"
  FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
