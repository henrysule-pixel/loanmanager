"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function InvestorsError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Investors failed to load</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{error.message || "Unable to load investors right now."}</p>
        <Button onClick={reset}>Retry</Button>
      </CardContent>
    </Card>
  );
}
