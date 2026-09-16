import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  History,
  Home,
  LayoutDashboard,
  ListVideo,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Sun,
  Upload,
  UserRound,
  Users,
  Video,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Dropdown } from "@/components/ui/Dropdown";
import { VidzoraLogo } from "@/brand/VidzoraLogo";
import { toggleTheme, getTheme } from "@/lib/theme";
import { queryClient } from "@/app/config/queryClient";

const primaryLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/subscriptions", label: "Subscriptions", icon: Users },
  { to: "/history", label: "History", icon: History },
  { to: "/playlists", label: "Playlists", icon: ListVideo },
];

const studioLinks = [
  { to: "/dashboard", label: "Studio", icon: LayoutDashboard },
  { to: "/studio/upload", label: "Upload", icon: Upload },
  { to: "/studio/videos", label: "My videos", icon: Video },
];

const guestLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
];

const mobileAuthLinks = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/subscriptions", label: "Subs", icon: Users },
  { to: "/history", label: "History", icon: History },
  { to: "/dashboard", label: "Studio", icon: LayoutDashboard },
];

export const AppShell = ({ children }: { children?: ReactNode }) => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(getTheme() === "dark");
  const navigate = useNavigate();
  const signedIn = Boolean(user);
  const navLinks = signedIn ? primaryLinks : guestLinks;
  const mobileLinks = signedIn ? mobileAuthLinks : guestLinks;

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const q = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
    setMenuOpen(false);
  };

  const onLogout = async () => {
    await logout();
    queryClient.clear();
    navigate("/");
  };

  return (
    <div className="min-h-dvh bg-surface text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-6">
          <Button
            variant="ghost"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <VidzoraLogo />
          <form onSubmit={onSearch} className="min-w-0 flex-1">
            <label className="sr-only" htmlFor="global-search">
              Search videos
            </label>
            <div className="flex overflow-hidden rounded-full border border-line bg-elevated">
              <input
                id="global-search"
                name="q"
                placeholder="Search Vidzora"
                className="min-w-0 flex-1 bg-transparent px-4 py-2 text-sm outline-none"
              />
              <button
                type="submit"
                className="px-4 text-muted hover:text-ink"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
              onClick={() => setDark(toggleTheme() === "dark")}
            >
              {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {signedIn ? (
              <>
                <Button variant="secondary" className="hidden sm:inline-flex" onClick={() => navigate("/studio/upload")}>
                  Create
                </Button>
                <Dropdown
                  label={
                    <span className="inline-flex items-center" aria-label="Account menu">
                      <Avatar src={user!.avatar} alt={user!.fullname} />
                    </span>
                  }
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-elevated"
                    onClick={() => navigate(`/channel/${user!.username}`)}
                  >
                    <UserRound className="h-4 w-4" /> Channel
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-elevated"
                    onClick={() => navigate("/settings")}
                  >
                    <Settings className="h-4 w-4" /> Settings
                  </button>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-elevated"
                    onClick={() => void onLogout()}
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </Dropdown>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Sign in
                </Button>
                <Button className="hidden sm:inline-flex" onClick={() => navigate("/register")}>
                  Join
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>
      {menuOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <div className="mx-auto flex max-w-7xl">
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-line bg-surface p-4 transition lg:static lg:z-0 lg:translate-x-0 ${menuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
        >
          <p className="mb-4 hidden lg:block">
            <VidzoraLogo />
          </p>
          <nav className="space-y-1" aria-label="Primary">
            {navLinks.map((link) => (
              <NavItem key={link.to} {...link} onClick={() => setMenuOpen(false)} />
            ))}
          </nav>
          {signedIn ? (
            <>
              <p className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Studio</p>
              <nav className="space-y-1" aria-label="Studio">
                {studioLinks.map((link) => (
                  <NavItem key={link.to} {...link} onClick={() => setMenuOpen(false)} />
                ))}
              </nav>
            </>
          ) : (
            <p className="mt-6 text-sm text-muted">Sign in to subscribe, comment, and create on Vidzora.</p>
          )}
        </aside>
        <main id="main" className="min-w-0 flex-1 px-3 py-6 pb-24 sm:px-6 lg:pb-10">
          {children ?? <Outlet />}
        </main>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 grid border-t border-line bg-surface/95 p-2 lg:hidden"
        style={{ gridTemplateColumns: `repeat(${mobileLinks.length}, minmax(0, 1fr))` }}
        aria-label="Mobile"
      >
        {mobileLinks.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg text-[11px] ${isActive ? "text-accent" : "text-muted"}`
            }
          >
            <link.icon className="h-5 w-5" />
            {link.label}
          </NavLink>
        ))}
      </nav>
      <footer className="hidden border-t border-line px-6 py-6 text-center text-sm text-muted lg:block">
        Vidzora · Watch. Create. Connect.
      </footer>
    </div>
  );
};

const NavItem = ({
  to,
  label,
  icon: Icon,
  onClick,
}: {
  to: string;
  label: string;
  icon: typeof Home;
  onClick?: () => void;
}) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${isActive ? "bg-elevated text-ink" : "text-muted hover:bg-elevated hover:text-ink"}`
    }
  >
    <Icon className="h-4 w-4" />
    {label}
  </NavLink>
);
