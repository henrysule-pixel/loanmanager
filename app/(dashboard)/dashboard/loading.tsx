import { Card, CardContent } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="p-6">
            <div className="h-4 w-28 animate-pulse rounded bg-emerald-100" />
            <div className="mt-4 h-8 w-20 animate-pulse rounded bg-emerald-100" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
