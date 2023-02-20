/*
  Warnings:

  - Added the required column `userId` to the `App` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_App" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "App_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_App" ("clientId", "clientSecret", "id", "name") SELECT "clientId", "clientSecret", "id", "name" FROM "App";
DROP TABLE "App";
ALTER TABLE "new_App" RENAME TO "App";
CREATE UNIQUE INDEX "App_clientId_key" ON "App"("clientId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
