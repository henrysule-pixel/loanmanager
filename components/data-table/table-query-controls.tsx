import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TableQueryControlsProps {
  searchParam: string;
  searchPlaceholder: string;
  statusParam?: string;
  statusOptions?: string[];
}

export function TableQueryControls({
  searchParam,
  searchPlaceholder,
  statusParam = "ALL",
  statusOptions = [],
}: TableQueryControlsProps) {
  return (
    <form className="flex flex-col gap-3 rounded-xl border bg-white p-4 shadow-soft md:flex-row md:items-center">
      <Input name="search" placeholder={searchPlaceholder} defaultValue={searchParam} className="md:max-w-sm" />
      {statusOptions.length > 0 ? (
        <select
          name="status"
          defaultValue={statusParam}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="ALL">All Statuses</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      ) : null}
      <Button type="submit" className="md:ml-auto">
        Apply
      </Button>
    </form>
  );
}
