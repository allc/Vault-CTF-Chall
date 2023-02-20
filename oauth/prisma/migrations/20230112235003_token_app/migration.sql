-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "token" TEXT NOT NULL,
    "expire" DATETIME NOT NULL,
    "userId" INTEGER NOT NULL,
    "appId" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Token_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Token_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Token" ("expire", "id", "token", "userId") SELECT "expire", "id", "token", "userId" FROM "Token";
DROP TABLE "Token";
ALTER TABLE "new_Token" RENAME TO "Token";
CREATE UNIQUE INDEX "Token_token_key" ON "Token"("token");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
