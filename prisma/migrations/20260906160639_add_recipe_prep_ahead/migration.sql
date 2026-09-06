-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "prepAhead" TEXT[] DEFAULT ARRAY[]::TEXT[];
