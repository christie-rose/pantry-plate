import { redirect } from "next/navigation";

// The week-by-week Meal Plan was replaced by Menus.
export default function PlanPage() {
  redirect("/menus");
}
