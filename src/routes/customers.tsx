import { createFileRoute } from "@tanstack/react-router";
import { ShellRoot } from "@/components/meridian/AppShell";
import { CustomersScreen } from "@/components/meridian/CustomersScreen";
import { ScreenBoundary } from "@/components/meridian/ScreenBoundary";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Meridian Business Intelligence" },
      { name: "description", content: "Contact details, order history and lifetime value for every customer account." },
    ],
  }),
  component: RouteView,
});

function RouteView() {
  return (
    <ShellRoot
      View={() => (
        <ScreenBoundary permission="customers.view">
          <CustomersScreen />
        </ScreenBoundary>
      )}
    />
  );
}
