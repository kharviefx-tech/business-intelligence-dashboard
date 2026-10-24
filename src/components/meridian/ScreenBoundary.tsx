import { Lock } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useStore, ROLE_LABELS, type Permission } from "@/lib/store";
import { EmptyState } from "./PageHeader";
import { Button } from "@/components/ui/button";

/** Keeps a screen behind its role permission, even when the URL is typed directly. */
export function ScreenBoundary({ permission, children }: { permission: Permission; children: React.ReactNode }) {
  const { can, role } = useStore();
  if (can(permission)) return <>{children}</>;
  return (
    <EmptyState
      title="You don't have access to this area"
      description={`The ${ROLE_LABELS[role]} role cannot open this section. Ask an owner or administrator if you need access.`}
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/">
            <Lock className="mr-1.5 h-3.5 w-3.5" /> Back to overview
          </Link>
        </Button>
      }
    />
  );
}
