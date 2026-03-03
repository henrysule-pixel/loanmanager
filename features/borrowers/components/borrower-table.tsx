import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { Database } from "@/types/database";

interface BorrowerTableProps {
  borrowers: Pick<
    Database["public"]["Tables"]["borrowers"]["Row"],
    "id" | "full_name" | "phone_number" | "email" | "created_at"
  >[];
}

export function BorrowerTable({ borrowers }: BorrowerTableProps) {
  return (
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
                    <Link href={`/dashboard/borrowers/${borrower.id}`} className="font-medium text-blue-700 hover:underline">
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
  );
}
