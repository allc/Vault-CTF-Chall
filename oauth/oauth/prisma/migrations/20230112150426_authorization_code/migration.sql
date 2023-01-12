-- CreateTable
CREATE TABLE "AuthorizationCode" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "expire" DATETIME NOT NULL,
    "appId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "AuthorizationCode_appId_fkey" FOREIGN KEY ("appId") REFERENCES "App" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuthorizationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
