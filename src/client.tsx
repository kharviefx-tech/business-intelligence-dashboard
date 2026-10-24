import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

const OWN_ROOT_ATTRS = new Set([
  "class",
  "style",
  "lang",
  "dir",
  "id",
  "translate",
  "data-theme",
  "data-scroll-locked",
  "data-vaul-drawer-wrapper",
]);

function foreignRootAttrs(): string[] {
  const out: string[] = [];
  try {
    for (const el of [document.documentElement, document.body]) {
      if (!el) continue;
      for (const name of el.getAttributeNames()) {
        if (!OWN_ROOT_ATTRS.has(name)) out.push(name);
      }
    }
  } catch {
  }
  return out;
}

let preHydrationMutations = 0;
let stopObserving = () => {};
try {
  const observer = new MutationObserver((records) => {
    preHydrationMutations += records.length;
  });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true,
  });
  stopObserving = () => {
    try {
      preHydrationMutations += observer.takeRecords().length;
      observer.disconnect();
    } catch {
    }
  };
} catch {
}

startTransition(() => {
  stopObserving();

  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
    {
      onRecoverableError: (error, errorInfo) => {
        const message = error instanceof Error ? error.message : String(error);
        const stack =
          errorInfo?.componentStack ||
          (error instanceof Error ? error.stack : undefined) ||
          "(no stack)";
        const foreign = foreignRootAttrs();
        const origin =
          foreign.length > 0 || preHydrationMutations > 0
            ? `env:foreign-dom(attrs=${foreign.slice(0, 6).join(",") || "none"};mutations=${preHydrationMutations})`
            : "env:clean";
        console.error("[recoverable]", origin, message, "\n", stack);
      },
    },
  );
});
