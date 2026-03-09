import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PublicLandingPage() {
  const { userId } = auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-emerald-50/60 p-6">
      <Card className="w-full max-w-2xl border-emerald-100 shadow-soft">
        <CardHeader>
          <div className="mb-3">
            <Image
              src="/loan-manager-logo.png"
              alt="HJ Financial Operation"
              width={72}
              height={72}
              className="h-16 w-16 rounded-lg object-cover"
            />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">HJ Financial</p>
          <CardTitle className="text-3xl">Internal Staff Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-muted-foreground">
            This system is for authorized staff only. Use it to manage borrowers, loans, investors, and internal
            operations.
          </p>
          <div className="flex gap-3">
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
