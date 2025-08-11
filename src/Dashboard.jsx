import React, { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);

  // THEME (class-based)
  const [theme, setTheme] = useState("system"); // "light" | "dark" | "system"
  useEffect(() => {
    const saved = localStorage.getItem("login-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  const isSystemDark = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedDark = theme === "dark" || (theme === "system" && isSystemDark());
  useEffect(() => {
    if (theme === "system") localStorage.removeItem("login-theme");
    else localStorage.setItem("login-theme", theme);
  }, [theme]);

  // Route guard (demo-only)
  useEffect(() => {
    if (!sessionStorage.getItem("auth")) navigate("/");
  }, [navigate]);

  const navItems = [
    { to: "/dashboard", label: "Home" },
    { to: "/dashboard/flow-kerja", label: "Flow Kerja" },
    // Config handled as dropdown
    { to: "/dashboard/link-kerja", label: "Link Kerja" },
    { to: "/dashboard/tools", label: "Tools" },
  ];

  const vendors = ["Huawei", "Raisecom", "BDCOM", "ZTE", "Fiberhome", "Viberlink"];

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        {/* Top Nav */}
        <header className="sticky top-0 z-40 border-b border-slate-200/60 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
          <nav className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center shadow-sm">
                  <span className="text-sm font-semibold">CM</span>
                </div>
                <h1 className="text-lg font-semibold tracking-tight">CM Dashboard</h1>
              </div>

              {/* Desktop nav */}
              <ul className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-xl text-sm font-medium transition hover:bg-slate-100 dark:hover:bg-slate-800 ${
                          isActive || location.pathname === item.to
                            ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                            : "text-slate-600 dark:text-slate-300"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}

                {/* CONFIG DROPDOWN: Aktivasi only */}
                <li className="relative">
                  <button
                    onClick={() => setOpenConfig((v) => !v)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      location.pathname.startsWith("/dashboard/config")
                        ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Config
                  </button>
                  {openConfig && (
                    <div className="absolute right-0 mt-2 w-[280px] rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-2">
                      <Section title="Aktivasi">
                        {vendors.map((v) => (
                          <DropdownLink
                            key={v}
                            to={`/dashboard/config/aktivasi/${v.toLowerCase()}`}
                            onClick={() => setOpenConfig(false)}
                          >
                            {v}
                          </DropdownLink>
                        ))}
                      </Section>
                    </div>
                  )}
                </li>
              </ul>

              {/* Right side */}
              <div className="flex items-center gap-2">
                {/* Theme toggle */}
                <div className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-1 py-1">
                  <button onClick={() => setTheme("light")} className={`px-2 py-1 rounded-lg text-xs font-medium ${theme === "light" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Light</button>
                  <button onClick={() => setTheme("system")} className={`px-2 py-1 rounded-lg text-xs font-medium ${theme === "system" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>System</button>
                  <button onClick={() => setTheme("dark")} className={`px-2 py-1 rounded-lg text-xs font-medium ${theme === "dark" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Dark</button>
                </div>

                <button
                  onClick={() => {
                    sessionStorage.removeItem("auth");
                    navigate("/");
                  }}
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Logout
                </button>

                {/* Mobile menu button */}
                <button
                  className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-800"
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label="Toggle navigation"
                >
                  <span className="i-bar block h-0.5 w-4 bg-current mb-1"></span>
                  <span className="i-bar block h-0.5 w-4 bg-current mb-1"></span>
                  <span className="i-bar block h-0.5 w-4 bg-current"></span>
                </button>
              </div>
            </div>
          </nav>

          {/* Mobile drawer */}
          {mobileOpen && (
            <div className="md:hidden border-t border-slate-200 dark:border-slate-800">
              <ul className="mx-auto max-w-6xl px-4 py-3 space-y-1">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) =>
                        `block px-3 py-2 rounded-xl text-sm font-medium transition ${
                          isActive || location.pathname === item.to
                            ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}

                {/* Mobile: Config · Aktivasi only */}
                <li className="px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Config · Aktivasi</li>
                {vendors.map((v) => (
                  <li key={`a-${v}`}>
                    <NavLink
                      to={`/dashboard/config/aktivasi/${v.toLowerCase()}`}
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2 rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      {v}
                    </NavLink>
                  </li>
                ))}

                <li>
                  <button
                    onClick={() => {
                      sessionStorage.removeItem("auth");
                      navigate("/");
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          )}
        </header>

        {/* Page body */}
        <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
          <PageHeader location={location} />

          {location.pathname === "/dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card title="Status">
                <ul className="text-sm space-y-2">
                  <li className="flex items-center justify-between"><span>Services</span><span className="font-medium text-blue-700 dark:text-blue-400">OK</span></li>
                  <li className="flex items-center justify-between"><span>Jobs</span><span className="font-medium">12</span></li>
                  <li className="flex items-center justify-between"><span>Alerts</span><span className="font-medium">0</span></li>
                </ul>
              </Card>
              <Card title="Links Cepat">
                <div className="text-sm space-y-2">
                  <DashLink to="/dashboard/flow-kerja">Flow Kerja</DashLink>
                  <DashLink to="/dashboard/config/aktivasi/huawei">Aktivasi · Huawei</DashLink>
                  <DashLink to="/dashboard/tools">Tools</DashLink>
                </div>
              </Card>
              <Card title="Catatan">
                <p className="text-sm text-slate-600 dark:text-slate-300">Tambahkan pengumuman singkat atau checklist di sini.</p>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function PageHeader({ location }) {
  const path = location.pathname.replace(/^\/+|\/+$/g, "");
  const parts = path.split("/");

  let title = "Home";
  if (parts[1] === "flow-kerja") title = "Flow Kerja";
  if (parts[1] === "link-kerja") title = "Link Kerja";
  if (parts[1] === "tools") title = "Tools";
  if (parts[1] === "config") {
    const type = parts[2]; // aktivasi only
    const vendor = parts[3] ? parts[3].toUpperCase() : "";
    if (type === "aktivasi") title = `Config · Aktivasi ${vendor && "· " + vendor}`;
    if (!type) title = "Config";
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">CM Dashboard</p>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 shadow-sm">New</button>
        <button className="rounded-xl border border-slate-200 dark:border-slate-800 text-sm px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">Export</button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="py-1">
      <div className="px-2 pt-1 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-5 shadow-sm">
      {title && <h3 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-200">{title}</h3>}
      {children}
    </section>
  );
}

function DashLink({ to, children }) {
  return (
    <Link
      to={to}
      className="block rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {children}
    </Link>
  );
}

function DropdownLink({ to, onClick, children }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `block px-3 py-2 rounded-xl text-sm transition ${
          isActive
            ? "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30"
            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        }`
      }
    >
      {children}
    </NavLink>
  );
}