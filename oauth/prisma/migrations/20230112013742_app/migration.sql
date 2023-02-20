-- CreateTable
CREATE TABLE "App" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "name" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "App_clientId_key" ON "App"("clientId");
