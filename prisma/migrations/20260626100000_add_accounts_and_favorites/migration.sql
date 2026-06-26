-- AlterTable
ALTER TABLE "Person" ADD COLUMN "username" TEXT;
ALTER TABLE "Person" ADD COLUMN "passwordHash" TEXT;
UPDATE "Person" SET "username" = "code" WHERE "username" IS NULL;
ALTER TABLE "Person" ALTER COLUMN "username" SET NOT NULL;
CREATE UNIQUE INDEX "Person_username_key" ON "Person"("username");

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "favoriterId" TEXT NOT NULL,
    "favoriteeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Favorite_favoriterId_idx" ON "Favorite"("favoriterId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_favoriterId_favoriteeId_key" ON "Favorite"("favoriterId", "favoriteeId");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_favoriterId_fkey" FOREIGN KEY ("favoriterId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_favoriteeId_fkey" FOREIGN KEY ("favoriteeId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;
