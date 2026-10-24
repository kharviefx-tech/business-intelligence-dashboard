import { createFileRoute } from "@tanstack/react-router";
import { ShellRoot } from "@/components/meridian/AppShell";
import { ReportBuilder } from "@/components/meridian/ReportBuilder";
import { ScreenBoundary } from "@/components/meridian/ScreenBoundary";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports — Meridian Business Intelligence" },
      { name: "description", content: "Build, review and export financial and operational reports for any period." },
    ],
  }),
  component: RouteView,
});

function RouteView() {
  return (
    <ShellRoot
      View={() => (
        <ScreenBoundary permission="finance.view">
          <ReportBuilder />
        </ScreenBoundary>
      )}
    />
  );
}
