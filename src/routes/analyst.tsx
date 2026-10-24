import { createFileRoute } from "@tanstack/react-router";
import { ShellRoot } from "@/components/meridian/AppShell";
import { AnalystScreen } from "@/components/meridian/AnalystScreen";
import { ScreenBoundary } from "@/components/meridian/ScreenBoundary";

export const Route = createFileRoute("/analyst")({
  head: () => ({
    meta: [
      { title: "AI analyst — Meridian Business Intelligence" },
      { name: "description", content: "Ask questions about your recorded business data and get grounded answers." },
    ],
  }),
  component: RouteView,
});

function RouteView() {
  return (
    <ShellRoot
      View={() => (
        <ScreenBoundary permission="ai.use">
          <AnalystScreen />
        </ScreenBoundary>
      )}
    />
  );
}
