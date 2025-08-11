import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [theme, setTheme] = useState("system");

  const navigate = useNavigate();

  // Determine initial theme
  useEffect(() => {
    const saved = localStorage.getItem("login-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else {
      setTheme("system");
    }
  }, []);

  const isSystemDark = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const resolvedDark = theme === "dark" || (theme === "system" && isSystemDark());

  useEffect(() => {
    if (theme === "system") {
      localStorage.removeItem("login-theme");
    } else {
      localStorage.setItem("login-theme", theme);
    }
  }, [theme]);

  function onSubmit(e) {
    e.preventDefault();

    const VALID_USER = "cmsmrg";
    const VALID_PASS = "Icon123+";

    const now = Date.now();
    if (lockedUntil && now < lockedUntil) {
      const secs = Math.ceil((lockedUntil - now) / 1000);
      setError(`Too many attempts. Try again in ${secs}s.`);
      return;
    }

    if (username === VALID_USER && password === VALID_PASS) {
      setError("");
      setAttempts(0);
      sessionStorage.setItem("auth", "1");
      navigate("/dashboard"); // Redirect
      return;
    }

    const next = attempts + 1;
    setAttempts(next);
    if (next >= 5) {
      setLockedUntil(Date.now() + 60 * 1000);
      setError("Too many attempts. Locked for 60s.");
    } else {
      setError("Invalid username or password.");
    }
  }

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-blue-600/90 dark:bg-blue-500 flex items-center justify-center shadow-lg">
                <span className="text-white font-semibold">∞</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Sign in to continue</p>
              </div>
            </div>

            {/* Theme toggle */}
            <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 shadow-sm backdrop-blur px-1 py-1">
              <button onClick={() => setTheme("light")} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${theme === "light" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Light</button>
              <button onClick={() => setTheme("system")} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${theme === "system" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>System</button>
              <button onClick={() => setTheme("dark")} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${theme === "dark" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Dark</button>
            </div>
          </div>

          {/* Card */}
          <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 shadow-xl">
            <div className="p-6 sm:p-8">
              <form onSubmit={onSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-slate-700 dark:text-slate-300">Username</label>
                  <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
                  <div className="relative">
                    <input id="password" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-4 py-3 pr-12 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
                    <button type="button" onClick={() => setShowPassword(s => !s)} className="absolute inset-y-0 right-2 my-auto px-2 h-8 rounded-xl text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800">{showPassword ? "Hide" : "Show"}</button>
                  </div>
                </div>

                {error && <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300 text-sm px-3 py-2">{error}</div>}

                <button type="submit" className="w-full rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-3">Sign in</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
