import { createFileRoute } from "@tanstack/react-router";
import { ShellRoot } from "@/components/meridian/AppShell";
import { AdminConsole } from "@/components/meridian/AdminConsole";
import { ScreenBoundary } from "@/components/meridian/ScreenBoundary";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin console — Meridian Business Intelligence" },
      { name: "description", content: "Manage team access, roles, permissions and the workspace audit trail." },
    ],
  }),
  component: RouteView,
});

function RouteView() {
  return (
    <ShellRoot
      View={() => (
        <ScreenBoundary permission="admin.access">
          <AdminConsole />
        </ScreenBoundary>
      )}
    />
  );
}
