import { DashboardShell } from "@/components/finance/dashboard-shell";

export default async function DashboardMonthPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  return <DashboardShell monthKey={month} />;
}
