import { Card, CardContent } from "@/components/ui/card";

export default function LoansLoading() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="h-5 w-56 animate-pulse rounded bg-emerald-100" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
