import { createFileRoute } from "@tanstack/react-router";
import { ShellRoot } from "@/components/meridian/AppShell";
import { SalesScreen } from "@/components/meridian/SalesScreen";
import { ScreenBoundary } from "@/components/meridian/ScreenBoundary";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales & orders — Meridian Business Intelligence" },
      { name: "description", content: "Orders, product performance, team targets and payment status." },
    ],
  }),
  component: RouteView,
});

function RouteView() {
  return (
    <ShellRoot
      View={() => (
        <ScreenBoundary permission="sales.view">
          <SalesScreen />
        </ScreenBoundary>
      )}
    />
  );
}
