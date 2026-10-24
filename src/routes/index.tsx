import { createFileRoute } from "@tanstack/react-router";
import { ShellRoot } from "@/components/meridian/AppShell";
import { OverviewScreen } from "@/components/meridian/OverviewScreen";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — Meridian Business Intelligence" },
      { name: "description", content: "Revenue, expenses, profit, cash flow and growth for your business at a glance." },
    ],
  }),
  component: RouteView,
});

function RouteView() {
  return <ShellRoot View={OverviewScreen} />;
}
