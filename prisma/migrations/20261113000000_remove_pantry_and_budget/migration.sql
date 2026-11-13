-- DropForeignKey
ALTER TABLE "Expense" DROP CONSTRAINT "Expense_budgetId_fkey";

-- DropForeignKey
ALTER TABLE "RecipeIngredient" DROP CONSTRAINT "RecipeIngredient_pantryItemId_fkey";

-- AlterTable
ALTER TABLE "GroceryList" DROP COLUMN "claimedPantryItemIds";

-- AlterTable
ALTER TABLE "RecipeIngredient" DROP COLUMN "pantryItemId",
DROP COLUMN "reviewed";

-- DropTable
DROP TABLE "Budget";

-- DropTable
DROP TABLE "Expense";

-- DropTable
DROP TABLE "PantryItem";

