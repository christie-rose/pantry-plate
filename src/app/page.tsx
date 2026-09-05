import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl text-brick">Pantry & Plate</h1>
      <p className="max-w-md text-cocoa">
        Meal planning, grocery lists, and budget tracking are coming in the
        next phases.
      </p>
      <div className="flex gap-3">
        <Link
          href="/pantry"
          className="rounded-md bg-brick px-4 py-2 text-sm font-medium text-white"
        >
          Go to Pantry
        </Link>
        <Link
          href="/recipes"
          className="rounded-md border border-brick px-4 py-2 text-sm font-medium text-brick"
        >
          Go to Recipes
        </Link>
      </div>
    </main>
  );
}
