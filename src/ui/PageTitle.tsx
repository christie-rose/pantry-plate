import type { ReactNode } from "react";

/**
 * The quiet label at the top of a section page (Recipes, Grocery List, Meal Plan): Karla medium, 20px, in cocoa.
 * It tells you where you are without competing with the logo. Use RecipeTitle for the name of a recipe.
 */
export function PageTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`text-xl font-medium leading-tight text-cocoa ${className}`}>{children}</h1>;
}

/** A recipe's own name at the top of its page: the brush script, 36px, brick, like a title on a handwritten recipe page. */
export function RecipeTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <h1 className={`font-title text-4xl leading-tight text-brick ${className}`}>{children}</h1>;
}
