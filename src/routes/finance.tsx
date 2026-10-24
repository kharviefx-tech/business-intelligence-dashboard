import { createFileRoute } from "@tanstack/react-router";
import { ShellRoot } from "@/components/meridian/AppShell";
import { FinanceScreen } from "@/components/meridian/FinanceScreen";
import { ScreenBoundary } from "@/components/meridian/ScreenBoundary";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "Finance — Meridian Business Intelligence" },
      { name: "description", content: "Record income and expenses, track collections and review profit by period." },
    ],
  }),
  component: RouteView,
});

function RouteView() {
  return (
    <ShellRoot
      View={() => (
        <ScreenBoundary permission="finance.view">
          <FinanceScreen />
        </ScreenBoundary>
      )}
    />
  );
}
