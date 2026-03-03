"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BorrowersError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrowers failed to load</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{error.message || "Unable to load borrowers right now."}</p>
        <Button onClick={reset}>Retry</Button>
      </CardContent>
    </Card>
  );
}
