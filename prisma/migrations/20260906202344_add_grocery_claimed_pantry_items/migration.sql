-- AlterTable
ALTER TABLE "GroceryList" ADD COLUMN     "claimedPantryItemIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
