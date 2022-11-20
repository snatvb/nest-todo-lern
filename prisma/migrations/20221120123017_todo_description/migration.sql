/*
  Warnings:

  - You are about to drop the column `content` on the `Todo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Todo" DROP COLUMN "content",
ADD COLUMN     "description" TEXT;
