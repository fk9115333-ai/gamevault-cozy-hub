import { Link, useRouterState } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Library,
  CalendarClock,
  BarChart3,
  Settings2,
  Sparkles,
  Activity as ActivityIcon,
  Crown,
  PartyPopper,
} from "lucide-react";
import { useCurrentData, useStore } from "@/lib/store";
import { computeLevel } from "@/lib/stats";
import { cn } from "@/lib/utils";
import { SmartSearch } from "./SmartSearch";
import { UserSwitcher } from "./UserSwitcher";
import type { ReactNode } from "react";

/** التنقل السفلي: 4 تبويبات فقط */
const mainNav = [
  { to: "/home", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/library", label: "المكتبة", icon: Library },
  { to: "/upcoming", label: "المرتقبة", icon: CalendarClock },
  { to: "/stats", label: "الإحصائيات", icon: BarChart3 },
] as const;

const nav = [
  ...mainNav,
  { to: "/timeline", label: "الخط الزمني", icon: ActivityIcon },
  { to: "/hall", label: "قاعة المشاهير", icon: Crown },
  { to: "/wrap", label: "ملخص السنة", icon: PartyPopper },
  { to: "/profile", label: "الملف الشخصي", icon: Sparkles },
  { to: "/settings", label: "الإعدادات", icon: Settings2 },
] as const;

function LevelBar() {
  const data = useCurrentData();
  const { level, pct } = computeLevel(data.entries);
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[var(--gradient-primary)] text-[11px] font-black text-primary-foreground">
        {level}
      </span>
      <div className="hidden w-24 sm:block">
        <div className="mb-1 text-[10px] text-muted-foreground">المستوى {level}</div>
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const user = useStore((s) => s.currentUser);
  const profile = useCurrentData().profile;

  // شاشة اختيار الملف الشخصي تُعرض بلا هيكل
  if (pathname === "/") return <div dir="rtl">{children}</div>;

  return (
    <div dir="rtl" className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-3 pb-28 pt-4 md:px-6 lg:pb-8">
        <aside className="sticky top-4 hidden h-[calc(100vh-2rem)] w-64 shrink-0 flex-col rounded-3xl glass p-4 lg:flex">
          <Link to="/home" className="mb-6 flex items-center gap-3 px-2">
            <span className="grid size-10 place-items-center rounded-2xl bg-[var(--gradient-primary)] text-lg">
              {profile.avatar}
            </span>
            <span className="font-display text-lg font-extrabold">مرحباً {profile.name}</span>
          </Link>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {nav.map((item) => {
              const active = pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                    active && "text-foreground",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-2xl bg-secondary/70 ring-1 ring-primary/30"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <item.icon className="relative size-[18px]" />
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <UserSwitcher />
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-5 flex items-center gap-3">
            <Link to="/" className="lg:hidden">
              <span className="grid size-10 place-items-center rounded-2xl bg-secondary text-lg">
                {profile.avatar}
              </span>
            </Link>
            <div className="min-w-0 flex-1">
              <SmartSearch />
            </div>
            <LevelBar />
          </header>
          <motion.div
            key={pathname + user}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-1 glass px-2 py-2 lg:hidden">
        {mainNav.map((item) => {
          const active = pathname.startsWith(item.to);
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[10px] transition-colors",
                active ? "bg-secondary/70 text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
