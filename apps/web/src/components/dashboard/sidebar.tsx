"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, Boxes, Brush, Home, Megaphone, Package, Printer, Settings, ShoppingCart, Store, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Overview", href: "/dashboard/overview", icon: Home },
  { title: "Products", href: "/dashboard/products", icon: Package },
  { title: "Research", href: "/dashboard/research", icon: Brush },
  { title: "Etsy", href: "/dashboard/etsy", icon: Store },
  { title: "Printify", href: "/dashboard/printify", icon: Printer },
  { title: "Orders", href: "/dashboard/orders", icon: ShoppingCart },
  { title: "Customers", href: "/dashboard/customers", icon: Users },
  { title: "Marketing", href: "/dashboard/marketing", icon: Megaphone },
  { title: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { title: "AI", href: "/dashboard/ai", icon: Bot },
  { title: "Settings", href: "/dashboard/settings", icon: Settings }
] as const;

function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-sky-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar() {
  return (
    <>
      <aside className="hidden w-64 shrink-0 border-r border-zinc-200 bg-white/80 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 lg:block">
        <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold">
          <Boxes className="h-5 w-5 text-sky-600" />
          AutoDrop AI
        </div>
        <SidebarNav />
      </aside>
      <div className="lg:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">Menu</Button>
          </DialogTrigger>
          <DialogContent className="max-w-xs p-4">
            <div className="mb-4 flex items-center gap-2 text-lg font-semibold">
              <Boxes className="h-5 w-5 text-sky-600" />
              AutoDrop AI
            </div>
            <SidebarNav />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
