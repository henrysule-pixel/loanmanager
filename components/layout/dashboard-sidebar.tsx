"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarClock, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/borrowers", label: "Business Portfolio", icon: Users },
  { href: "/dashboard/payments", label: "Payments", icon: CalendarClock },
  { href: "/dashboard/investors", label: "Investors", icon: Wallet },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-slate-800 bg-[#0f1e3d] p-4 text-slate-200 md:min-h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <Image
            src="/loan-manager-logo.png"
            alt="HJ Financial Operation"
            width={32}
            height={32}
            className="h-8 w-8 rounded-md object-cover"
          />
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Loan Manager</p>
        </div>
        <h1 className="text-xl font-semibold text-white">HJ Financial Operation</h1>
      </div>
      <nav className="grid gap-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-[#1a2f5f] text-amber-300"
                  : "text-slate-300 hover:bg-[#16284f] hover:text-white",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
