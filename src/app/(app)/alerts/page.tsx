import { Suspense } from "react";
import AlertsPageContent from "./alerts-content";

export const dynamic = "force-dynamic";

export default function AlertsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <AlertsPageContent />
    </Suspense>
  );
}