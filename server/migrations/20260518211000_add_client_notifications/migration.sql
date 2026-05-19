CREATE TABLE "ClientNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'SYSTEM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ClientNotification_userId_createdAt_idx" ON "ClientNotification"("userId", "createdAt");
CREATE INDEX "ClientNotification_userId_readAt_idx" ON "ClientNotification"("userId", "readAt");
CREATE INDEX "ClientNotification_orderId_idx" ON "ClientNotification"("orderId");

ALTER TABLE "ClientNotification"
ADD CONSTRAINT "ClientNotification_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClientNotification"
ADD CONSTRAINT "ClientNotification_orderId_fkey"
FOREIGN KEY ("orderId") REFERENCES "Order"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
