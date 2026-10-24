import { createFileRoute } from "@tanstack/react-router";
import { ShellRoot } from "@/components/meridian/AppShell";
import { PlanScreen } from "@/components/meridian/PlanScreen";

export const Route = createFileRoute("/plan")({
  head: () => ({
    meta: [
      { title: "Plan & billing — Meridian Business Intelligence" },
      { name: "description", content: "Subscription plan, usage limits and what each tier includes." },
    ],
  }),
  component: RouteView,
});

function RouteView() {
  return <ShellRoot View={PlanScreen} />;
}
