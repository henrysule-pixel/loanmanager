"use client";

import { SignOutButton, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  userDisplayName: string;
}

export function DashboardHeader({ userDisplayName }: DashboardHeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-soft">
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500">Signed in</p>
        <p className="text-sm font-medium text-slate-900">{userDisplayName}</p>
      </div>
      <div className="flex items-center gap-3">
        <UserButton afterSignOutUrl="/sign-in" />
        <SignOutButton>
          <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
            Logout
          </Button>
        </SignOutButton>
      </div>
    </header>
  );
}
