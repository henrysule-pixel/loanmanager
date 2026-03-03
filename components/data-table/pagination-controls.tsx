import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  pageSize: number;
  total: number;
  pathname: string;
  searchParams: Record<string, string | undefined>;
}

function buildHref(pathname: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function PaginationControls({ page, pageSize, total, pathname, searchParams }: PaginationControlsProps) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(pageCount, page + 1);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <div className="flex items-center gap-2">
        <Link href={buildHref(pathname, { ...searchParams, page: String(prevPage) })}>
          <Button variant="outline" disabled={page <= 1}>
            Previous
          </Button>
        </Link>
        <Link href={buildHref(pathname, { ...searchParams, page: String(nextPage) })}>
          <Button variant="outline" disabled={page >= pageCount}>
            Next
          </Button>
        </Link>
      </div>
    </div>
  );
}
