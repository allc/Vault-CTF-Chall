/*
  Warnings:

  - A unique constraint covering the columns `[code,appId]` on the table `AuthorizationCode` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `Token` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "AuthorizationCode_code_appId_key" ON "AuthorizationCode"("code", "appId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_token_key" ON "Token"("token");
