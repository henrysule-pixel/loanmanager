"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dashboard failed to load</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{error.message || "An unexpected error occurred."}</p>
        <Button onClick={reset}>Retry</Button>
      </CardContent>
    </Card>
  );
}
