import Link from "next/link";
import { BorrowerForm } from "@/components/borrowers/borrower-form";
import { PaginationControls } from "@/components/data-table/pagination-controls";
import { TableQueryControls } from "@/components/data-table/table-query-controls";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { listBorrowers } from "@/features/borrowers/server/queries";

export default async function BorrowersPage({
  searchParams,
}: {
  searchParams: { search?: string; page?: string };
}) {
  const page = Number(searchParams.page ?? "1");
  const search = searchParams.search ?? "";
  const { rows: borrowers, total, pageSize } = await listBorrowers({ search, page, pageSize: 10 });

  return (
    <div className="space-y-6">
      <PageHeader title="Business Portfolio" description="Client and legal profile management." />
      <TableQueryControls searchParam={search} searchPlaceholder="Search clients by name, email, or phone" />
      <BorrowerForm />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Full Name</TH>
                  <TH>Phone</TH>
                  <TH>Email</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {borrowers.map((borrower) => (
                  <TR key={borrower.id}>
                    <TD>
                      <Link
                        href={`/dashboard/borrowers/${borrower.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {borrower.full_name}
                      </Link>
                    </TD>
                    <TD>{borrower.phone_number}</TD>
                    <TD>{borrower.email}</TD>
                    <TD>{new Date(borrower.created_at).toLocaleDateString()}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <PaginationControls
        page={page}
        pageSize={pageSize}
        total={total}
        pathname="/dashboard/borrowers"
        searchParams={{ search }}
      />
    </div>
  );
}
