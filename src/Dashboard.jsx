import React, { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openConfig, setOpenConfig] = useState(false);
  const [openTools, setOpenTools] = useState(false);

  // ===== THEME =====
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    const saved = localStorage.getItem("cm-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);

  const isSystemDark = () =>
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const resolvedDark =
    theme === "dark" || (theme === "system" && isSystemDark());

  useEffect(() => {
    if (theme === "system") localStorage.removeItem("cm-theme");
    else localStorage.setItem("cm-theme", theme);
  }, [theme]);

  // ===== AUTH GUARD =====
  useEffect(() => {
    if (!sessionStorage.getItem("auth")) navigate("/");
  }, [navigate]);

  // ===== AUTO CLOSE DROPDOWN ON ROUTE CHANGE =====
  useEffect(() => {
    setOpenTools(false);
    setOpenConfig(false);
    setMobileOpen(false);
  }, [location.pathname]);

  const navItems = [
    { to: "/dashboard", label: "Home" },
    { to: "/dashboard/flow-kerja", label: "Flow Kerja" },
    { to: "/dashboard/link-kerja", label: "Link Kerja" },
  ];

  const vendors = ["Huawei", "Raisecom", "BDCOM", "ZTE", "Fiberhome", "Viberlink"];

  // ===== CLOCK (WIB) =====
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const { tanggalStr, waktuStr } = useMemo(() => {
    const d = new Date(now);
    return {
      tanggalStr: d.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Jakarta",
      }),
      waktuStr:
        d.toLocaleTimeString("id-ID", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jakarta",
        }) + " WIB",
    };
  }, [now]);

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        {/* ===== TOP NAV ===== */}
        <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
          <nav className="mx-auto max-w-6xl px-4">
            <div className="h-16 flex items-center justify-between">
              {/* LOGO */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-blue-600 text-white grid place-items-center font-semibold">
                  CM
                </div>
                <h1 className="font-semibold">CM Dashboard</h1>
              </div>

              {/* ===== DESKTOP MENU ===== */}
              <ul className="hidden md:flex items-center gap-1">
                {navItems.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-xl text-sm font-medium transition ${
                          isActive
                            ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}

                {/* ===== TOOLS DROPDOWN ===== */}
                <li className="relative">
                  <button
                    onClick={() => {
                      setOpenTools(v => !v);
                      setOpenConfig(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      location.pathname.startsWith("/dashboard/tools")
                        ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Tools
                  </button>

                  {openTools && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg p-2">
                      <Section title="Migrasi ACS">
                        <DropdownLink to="/dashboard/tools/migrasi-acs/raisecom">
                          Raisecom
                        </DropdownLink>
                      </Section>
                    </div>
                  )}
                </li>

                {/* ===== CONFIG DROPDOWN ===== */}
                <li className="relative">
                  <button
                    onClick={() => {
                      setOpenConfig(v => !v);
                      setOpenTools(false);
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition ${
                      location.pathname.startsWith("/dashboard/config")
                        ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    Config
                  </button>

                  {openConfig && (
                    <div className="absolute right-0 mt-2 w-64 rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-lg p-2">
                      <Section title="Aktivasi">
                        {vendors.map(v => (
                          <DropdownLink
                            key={v}
                            to={`/dashboard/config/aktivasi/${v.toLowerCase()}`}
                          >
                            {v}
                          </DropdownLink>
                        ))}
                      </Section>
                    </div>
                  )}
                </li>
              </ul>

              {/* ===== RIGHT ===== */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    sessionStorage.removeItem("auth");
                    navigate("/");
                  }}
                  className="hidden sm:inline px-3 py-2 rounded-xl border text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Logout
                </button>

                <button
                  className="md:hidden h-9 w-9 rounded-xl border"
                  onClick={() => setMobileOpen(v => !v)}
                >
                  ☰
                </button>
              </div>
            </div>
          </nav>

          {/* ===== MOBILE MENU ===== */}
          {mobileOpen && (
            <div className="md:hidden border-t">
              <ul className="px-4 py-3 space-y-1">
                {navItems.map(item => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      className="block px-3 py-2 rounded-xl"
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}

                <li className="px-3 pt-2 text-xs font-semibold text-slate-500">
                  Tools → Migrasi ACS → Raisecom sudah aktif
                </li>
                <li>
                  <NavLink
                    to="/dashboard/tools/migrasi-acs/raisecom"
                    className="block px-3 py-2 rounded-xl"
                  >
                    Raisecom
                  </NavLink>
                </li>
              </ul>
            </div>
          )}
        </header>

        {/* ===== PAGE BODY ===== */}
        <main className="mx-auto max-w-6xl px-4 py-8">
          <h2 className="text-2xl font-semibold mb-6">Dashboard</h2>

          <div className="grid md:grid-cols-3 gap-4">
            <Card title="Status">
              <p>{tanggalStr}</p>
              <p className="font-semibold">{waktuStr}</p>
            </Card>

            <Card title="Info">
              <p>Tools → Migrasi ACS → Raisecom sudah aktif</p>
              <p><b>Pekerjaan Dilakukan Dengan Teliti</b></p>
            </Card>

            <Card title="Catatan">
              <ul className="list-disc pl-5 text-sm">
                 <li>Update Semua Conifg ONT V2</li>
                 <li>optimasi Config dan Perbaikan bugs</li>
                <li>Menambahkan Tool - Migrasi ACS untuk Raisecom</li>
              </ul>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ===== HELPER COMPONENTS ===== */

function Section({ title, children }) {
  return (
    <div>
      <div className="px-2 text-xs font-semibold text-slate-500 mb-1">
        {title}
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <section className="rounded-2xl border p-4">
      <h3 className="font-semibold mb-2">{title}</h3>
      {children}
    </section>
  );
}

function DropdownLink({ to, children }) {
  return (
    <NavLink
      to={to}
      className="block px-3 py-2 rounded-xl transition hover:bg-slate-100 dark:hover:bg-slate-800"
    >
      {children}
    </NavLink>
  );
}
