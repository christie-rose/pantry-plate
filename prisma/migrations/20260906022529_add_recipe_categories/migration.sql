-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[];
