import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);

  // THEME
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    const saved = localStorage.getItem("cm-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  const isSystemDark = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedDark = theme === "dark" || (theme === "system" && isSystemDark());
  useEffect(() => {
    if (theme === "system") localStorage.removeItem("cm-theme");
    else localStorage.setItem("cm-theme", theme);
  }, [theme]);

  // Route guard
  useEffect(() => {
    if (!sessionStorage.getItem("auth")) navigate("/");
  }, [navigate]);

  const navItems = [
    { to: "/dashboard", label: "Home" },
    { to: "/dashboard/flow-kerja", label: "Flow Kerja" },
    { to: "/dashboard/link-kerja", label: "Link Kerja" },
    { to: "/dashboard/tools", label: "Tools" },
  ];
  const vendors = ["Huawei", "Raisecom", "BDCOM", "ZTE", "Fiberhome", "Viberlink"];

  // ===== Clock (WIB) =====
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const { tanggalStr, waktuStr } = useMemo(() => {
    const d = new Date(now);
    const tanggal = d.toLocaleDateString("id-ID", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      timeZone: "Asia/Jakarta",
    });
    const waktu = d.toLocaleTimeString("id-ID", {
      hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit",
      timeZone: "Asia/Jakarta",
    });
    return { tanggalStr: tanggal, waktuStr: `${waktu} WIB` };
  }, [now]);

  // ===== Quick Links dari riwayat global (top 3: terbaru → terbanyak) =====
  const [quickLinks, setQuickLinks] = useState([]);
  function labelForPath(p) {
    if (p === "/dashboard") return "Home";
    if (p === "/dashboard/flow-kerja") return "Flow Kerja";
    if (p === "/dashboard/link-kerja") return "Link Kerja";
    if (p === "/dashboard/tools") return "Tools";
    if (p.startsWith("/dashboard/config/aktivasi/")) {
      const vendor = p.split("/").pop() || "";
      return `Aktivasi · ${vendor.charAt(0).toUpperCase() + vendor.slice(1)}`;
    }
    return p;
  }
  function computeTop3() {
    try {
      const data = JSON.parse(localStorage.getItem("cm-usage") || "{}");
      return Object.entries(data)
        .sort((a, b) => (b[1].lastAt - a[1].lastAt) || (b[1].count - a[1].count))
        .slice(0, 3)
        .map(([path]) => ({ to: path, label: labelForPath(path) }));
    } catch { return []; }
  }
  // refresh saat Dashboard mount & setiap kali kembali ke /dashboard
  useEffect(() => {
    setQuickLinks(computeTop3());
  }, [location.pathname]);

  const fallbackQuick = [
    { to: "/dashboard/flow-kerja", label: "Flow Kerja" },
    { to: "/dashboard/config/aktivasi/huawei", label: "Aktivasi · Huawei" },
    { to: "/dashboard/tools", label: "Tools" },
  ];

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

                {/* CONFIG DROPDOWN */}
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
                <div className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-1 py-1">
                  <button onClick={() => setTheme("light")}  className={`px-2 py-1 rounded-lg text-xs font-medium ${theme === "light"  ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Light</button>
                  <button onClick={() => setTheme("system")} className={`px-2 py-1 rounded-lg text-xs font-medium ${theme === "system" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>System</button>
                  <button onClick={() => setTheme("dark")}   className={`px-2 py-1 rounded-lg text-xs font-medium ${theme === "dark"   ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Dark</button>
                </div>

                <button
                  onClick={() => { sessionStorage.removeItem("auth"); navigate("/"); }}
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Logout
                </button>

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
                    onClick={() => { sessionStorage.removeItem("auth"); navigate("/"); }}
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
              {/* Status: tanggal & jam realtime */}
              <Card title="Status">
                <ul className="text-sm space-y-2">
                  <li className="flex items-center justify-between"><span>Tanggal</span><span className="font-medium">{tanggalStr}</span></li>
                  <li className="flex items-center justify-between"><span>Waktu</span><span className="font-medium">{waktuStr}</span></li>
                </ul>
              </Card>

              {/* Links Cepat: dari history (top 3) */}
              <Card title="Links Cepat">
                <div className="text-sm space-y-2">
                  {(quickLinks.length ? quickLinks : fallbackQuick).map((it) => (
                    <DashLink key={it.to} to={it.to}>{it.label}</DashLink>
                  ))}
                </div>
              </Card>

              {/* Catatan: bullet points */}
              <Card title="Catatan">
      <b><h1>Whats New?</h1></b>
                <ul className="list-disc pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
                  <li>Fixing Huawei and Raisecom Config Typo</li>
                  <li>Adding Reset Button</li>
                </ul>
               
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
    const type = parts[2];
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
      {/* tombol New & Export dihilangkan */}
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
    <Link to={to} className="block rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800">
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
