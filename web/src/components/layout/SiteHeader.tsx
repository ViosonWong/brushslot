"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { clearSession } from "@/store/authSlice";
import { useLogoutMutation } from "@/store/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

type NavItem = { href: string; label: string };

function useNavItems(): NavItem[] {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return [{ href: "/artists", label: "画师" }];

  if (user.role === "CUSTOMER") {
    return [
      { href: "/artists", label: "画师" },
      { href: "/me/bookings", label: "我的预约" },
    ];
  }

  if (user.role === "ARTIST") {
    return [
      { href: "/artists", label: "画师" },
      { href: "/artist/schedule", label: "我的排班" },
    ];
  }

  return [
    { href: "/artists", label: "画师" },
    { href: "/admin/artists", label: "画师管理" },
    { href: "/admin/schedules", label: "排班管理" },
    { href: "/admin/attendance", label: "出勤" },
    { href: "/admin/bookings", label: "预约" },
    { href: "/admin/logs", label: "日志" },
  ];
}

export function SiteHeader() {
  const user = useAppSelector((s) => s.auth.user);
  const refreshToken = useAppSelector((s) => s.auth.refreshToken);
  const pathname = usePathname();
  const navItems = useNavItems();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [logoutMutation] = useLogoutMutation();

  const onLogout = async () => {
    if (refreshToken) {
      try {
        await logoutMutation({ refreshToken }).unwrap();
      } catch {
        // ignore network/logout errors, we still clear local session
      }
    }
    dispatch(clearSession());
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-black/10 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex max-w-screen-xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-zinc-900">
            Brushslot
          </span>
          <span className="hidden text-xs text-zinc-500 sm:inline">预约画师</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm transition-colors",
                pathname === it.href
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              {it.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <span className="text-sm text-zinc-600">
                {user.name} ({user.role})
              </span>
              <button
                onClick={onLogout}
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                退出
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-50"
              >
                登录
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-zinc-900 px-3 py-1.5 text-sm text-white hover:bg-zinc-800"
              >
                注册
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden">
          <details className="relative">
            <summary className="list-none rounded-full border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700">
              菜单
            </summary>
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg">
              <div className="flex flex-col p-1">
                {navItems.map((it) => (
                  <Link
                    key={it.href}
                    href={it.href}
                    className={cn(
                      "rounded-xl px-3 py-2 text-sm",
                      pathname === it.href
                        ? "bg-zinc-900 text-white"
                        : "text-zinc-700 hover:bg-zinc-50"
                    )}
                  >
                    {it.label}
                  </Link>
                ))}
                <div className="my-1 h-px bg-zinc-100" />
                {user ? (
                  <button
                    onClick={onLogout}
                    className="rounded-xl px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    退出登录
                  </button>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      登录
                    </Link>
                    <Link
                      href="/register"
                      className="rounded-xl px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    >
                      注册
                    </Link>
                  </>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
