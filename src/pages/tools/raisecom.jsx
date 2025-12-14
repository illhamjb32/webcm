import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RaisecomMigrasi() {
  const navigate = useNavigate();

  // ===== AUTH GUARD =====
  useEffect(() => {
    if (!sessionStorage.getItem("auth")) navigate("/");
  }, [navigate]);

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

  // ===== INPUTS =====
  const [lineProfile, setLineProfile] = useState("");
  const [serviceProfile, setServiceProfile] = useState("");
  const [vlan, setVlan] = useState("");
  const [iphostRaw, setIphostRaw] = useState("");

  // ===== MODE =====
  const [mode, setMode] = useState("single");

  // ===== OUTPUT =====
  const [output, setOutput] = useState("");

  // ===== VALIDATION + PARSER =====
  function generateConfig() {
    const missing = [];

    if (!lineProfile) missing.push("Line Profile Name");
    if (!serviceProfile) missing.push("Service Profile Name");
    if (!vlan) missing.push("VLAN");
    if (!iphostRaw) missing.push("Input Cek IPHOST");

    if (missing.length > 0) {
      alert(`Data belum lengkap:\n- ${missing.join("\n- ")}`);
      return;
    }

    // --- Parse S/P/ID ---
    const spidMatch = iphostRaw.match(/ONU ID:\s*(\d+)\/(\d+)\/(\d+)/i);
    if (!spidMatch) {
      alert("ONU ID (S/P/ID) tidak ditemukan pada data IPHOST");
      return;
    }
    const S = spidMatch[1];
    const P = spidMatch[2];
    const ID = spidMatch[3];

    // --- Parse Username ---
    const userMatch = iphostRaw.match(/PPPoE Username\s*:\s*(\S+)/i);
    if (!userMatch) {
      alert("PPPoE Username tidak ditemukan pada data IPHOST");
      return;
    }
    const username = userMatch[1];

    // --- Parse Password ---
    const passMatch = iphostRaw.match(/PPPoE Password\s*:\s*(\S+)/i);
    if (!passMatch) {
      alert("PPPoE Password tidak ditemukan pada data IPHOST");
      return;
    }
    const password = passMatch[1];

    const tpl = `interface gpon-onu ${S}/${P}/${ID}
line-profile-name ${lineProfile}
service-profile-name ${serviceProfile}
quit

gpon-onu ${S}/${P}/${ID}
iphost 1 mode pppoe
iphost 1 pppoe username ${username} password ${password}
iphost 1 vlan ${vlan}
iphost 1 service Internet
iphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1

iphost 2 mode dhcp
iphost 2 service management
iphost 2 vlan 2989
access-control http mode allowall
access-control https mode allowall
access-control ping mode allowall

quit`;

    setOutput(tpl);
  }

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
        {/* HEADER */}
        <div className="max-w-7xl mx-auto flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">
            Tools · Migrasi ACS · Raisecom
          </h1>
          <div className="flex gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-2 rounded-xl border text-sm"
            >
              Kembali
            </button>
          </div>
        </div>

        {/* ===== 3 COLUMNS ===== */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* COLUMN 1 */}
          <section className="rounded-2xl border p-4 bg-white/80 dark:bg-slate-900/60">
            <h2 className="font-semibold text-sm mb-3">Input Data</h2>

            <Field label="Line Profile Name" value={lineProfile} onChange={setLineProfile} />
            <Field label="Service Profile Name" value={serviceProfile} onChange={setServiceProfile} />
            <Field label="VLAN" value={vlan} onChange={setVlan} />

            <label className="block text-xs font-medium mb-1 mt-3">
              Input Cek IPHOST
            </label>
            <textarea
              value={iphostRaw}
              onChange={(e) => setIphostRaw(e.target.value)}
              rows={12}
              className="w-full rounded-xl border p-3 font-mono text-sm dark:bg-slate-950"
              placeholder="Paste output cek iphost di sini"
            />

            <button
              onClick={generateConfig}
              className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm"
            >
              Generate Config
            </button>
          </section>

          {/* COLUMN 2 */}
          <section className="rounded-2xl border p-4 bg-white/80 dark:bg-slate-900/60">
            <h2 className="font-semibold text-sm mb-3">Mode</h2>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950"
            >
              <option value="single">Single ACS</option>
              <option value="soon" disabled>
                Coming Soon
              </option>
            </select>
          </section>

          {/* COLUMN 3 */}
          <section className="rounded-2xl border p-4 bg-white/80 dark:bg-slate-900/60 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-sm">Output Config</h2>
              <button
                onClick={() => navigator.clipboard.writeText(output)}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg"
              >
                Copy
              </button>
            </div>

            <textarea
              value={output}
              readOnly
              rows={22}
              className="flex-1 rounded-xl border p-3 font-mono text-sm dark:bg-slate-950"
              placeholder="Config migrasi akan muncul di sini"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

/* ===== COMPONENTS ===== */

function Field({ label, value, onChange }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950"
      />
    </div>
  );
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="flex border rounded-xl overflow-hidden">
      {["light", "system", "dark"].map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`px-3 py-1.5 text-xs ${
            theme === t ? "bg-blue-600 text-white" : ""
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
