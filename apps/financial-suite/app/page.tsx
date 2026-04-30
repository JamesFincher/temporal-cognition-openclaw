import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

function currentMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export default async function HomePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");
  redirect(`/dashboard/${currentMonthKey()}`);
}
