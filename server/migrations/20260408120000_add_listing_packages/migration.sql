ALTER TABLE "Listing"
ADD COLUMN "isPackage" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "PackageItem" (
    "id" TEXT NOT NULL,
    "packageListingId" TEXT NOT NULL,
    "includedListingId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PackageItem_packageListingId_includedListingId_key"
ON "PackageItem"("packageListingId", "includedListingId");

ALTER TABLE "PackageItem"
ADD CONSTRAINT "PackageItem_packageListingId_fkey"
FOREIGN KEY ("packageListingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PackageItem"
ADD CONSTRAINT "PackageItem_includedListingId_fkey"
FOREIGN KEY ("includedListingId") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
