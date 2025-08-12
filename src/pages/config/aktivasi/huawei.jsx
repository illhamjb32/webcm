import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HuaweiAktivasi() {
  const navigate = useNavigate();

  // Route guard
  useEffect(() => {
    if (!sessionStorage.getItem("auth")) navigate("/");
  }, [navigate]);

  // Dark mode (sync with cm-theme)
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    const saved = localStorage.getItem("cm-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  const isSystemDark = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedDark = theme === "dark" || (theme === "system" && isSystemDark());

  // Inputs
  const [sn, setSn] = useState("");
  const [frame, setFrame] = useState("");
  const [slot, setSlot] = useState("");
  const [port, setPort] = useState("");
  const [ontId, setOntId] = useState("");
  const [lineProfile, setLineProfile] = useState("");
  const [sid, setSid] = useState("");
  const [nama, setNama] = useState("");
  const [vlan, setVlan] = useState("");

  // Default password: YYYYMMDD
  const todayDefault = useMemo(() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  }, []);
  const [password, setPassword] = useState("");
  useEffect(() => {
    if (!password) setPassword(todayDefault);
  }, [todayDefault, password]);

  // Modes
  const MODES = {
    V2: "v2acs",
    V1: "v1",
    CEK_IP: "cekip",
    REDAMAN: "cekredaman",
    HAPUS: "hapus",
  };
  const [mode, setMode] = useState(MODES.V2);

  // Validation
  const [errors, setErrors] = useState({});
  function requireAll() {
    const e = {};
    if (!sn) e.sn = "SN ONT wajib diisi";
    if (!frame) e.frame = "Frame wajib diisi";
    if (!slot) e.slot = "Slot wajib diisi";
    if (!port) e.port = "Port wajib diisi";
    if (!ontId) e.ontId = "ONT ID wajib diisi";
    if (!lineProfile) e.lineProfile = "Line Profile Name wajib diisi";
    if (!sid) e.sid = "SID wajib diisi";
    if (!nama) e.nama = "Nama User wajib diisi";
    if (!password) e.password = "Password wajib diisi";
    if (!vlan) e.vlan = "VLAN wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Output + copy
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(output || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // (optional) fallback bisa ditambahkan jika perlu
    }
  }

  // Generate
  function showConfig() {
    const needsFull =
      mode === MODES.V2 || mode === MODES.V1 || mode === MODES.REDAMAN || mode === MODES.HAPUS;
    if (needsFull && !requireAll()) return;

    const FraSlo = `${frame}/${slot}`;
    const FraSloPor = `${frame}/${slot}/${port}`;

    if (mode === MODES.V2) {
      const tpl = `config
interface gpon ${FraSlo}

ont add ${port} ${ontId} sn-auth ${sn} omci ont-lineprofile-name ${lineProfile} ont-srvprofile-name ${lineProfile} desc ${sid}-${nama}

ont ipconfig ${port} ${ontId} pppoe vlan ${vlan} priority 0 user-account username ${sn} password ${password}

ont internet-config ${port} ${ontId} ip-index 0

ont wan-config ${port} ${ontId} ip-index 0 profile-name ICONNET.AUTOPROV 

ont policy-route-config ${port} ${ontId} profile-name ICONNET.AUTOPROV

ont port route ${port} ${ontId} eth 1 enable

ont port route ${port} ${ontId} eth 2 enable

ont ipconfig ${port} ${ontId} ip-index 2 dhcp vlan 2989 priority 5

ont tr069-server-config ${port} ${ontId} 4 profile-name ACS

ont wan-config ${port} ${ontId} ip-index 2 profile-name ACS


quit

service-port vlan ${vlan} gpon ${FraSloPor} ont ${ontId} gemport 1 multi-service user-vlan ${vlan} tag-transform translate

service-port vlan 2989 gpon ${FraSloPor} ont ${ontId} gemport 2 multi-service user-vlan 2989 tag-transform translate


quit

save`;
      setOutput(tpl);
      return;
    }

    if (mode === MODES.V1) {
      const tpl = `conf

int gpon ${frame}/${slot}

ont add ${port} ${ontId} sn-auth ${sn} omci ont-lineprofile-name ${lineProfile} ont-srvprofile-name ${lineProfile} desc ${sid}-${nama}

ont ipconfig ${port} ${ontId} pppoe vlan ${vlan} priority 0 user-account username ${sn} password ${password}

ont internet-config ${port} ${ontId} ip-index 0

ont wan-config ${port} ${ontId} ip-index 0 profile-name ICONNET.AUTOPROV

ont policy-route-config ${port} ${ontId} profile-name ICONNET.AUTOPROV

ont port route ${port} ${ontId} eth 1 enable

ont port route ${port} ${ontId} eth 2 enable

quit

service-port vlan ${vlan} gpon ${FraSloPor} ont ${ontId} gemport 1 multi-service user-vlan ${vlan} tag-transform translate

save`;
      setOutput(tpl);
      return;
    }

    if (mode === MODES.REDAMAN) {
      setOutput(`display ont info option run-state ${frame} ${slot} ${port} ${ontId}`);
      return;
    }

    if (mode === MODES.CEK_IP) {
      // (di Huawei kamu minta run-state, versi ini dipertahankan)
      setOutput(`display ont wan info ${frame}/${slot} ${port} ${ontId}`);
      return;
    }

    if (mode === MODES.HAPUS) {
      setOutput(
        `Display current-configuration ont ${frame}/${slot} ${port} ${ontId}\n\nUndo service port (SERVICE PORT)\n\nInterface gpon ${frame}/${slot}\n\nOnt delete ${port} ${ontId}`
      );
      return;
    }
  }

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6">
        {/* Header */}
        <div className="mx-auto max-w-7xl flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Config · Aktivasi · Huawei</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => navigate(-1)}
            >
              Kembali
            </button>
          </div>
        </div>

        {/* 3 Columns */}
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Input */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-200">Input Data</h2>

            <Field label="SN ONT" value={sn} onChange={setSn} name="sn" error={errors.sn} placeholder="e.g. 4857544399C888AD" />
            <div className="grid grid-cols-3 gap-2">
              <Field label="Frame" value={frame} onChange={setFrame} name="frame" error={errors.frame} placeholder="0" />
              <Field label="Slot" value={slot} onChange={setSlot} name="slot" error={errors.slot} placeholder="0" />
              <Field label="Port" value={port} onChange={setPort} name="port" error={errors.port} placeholder="0" />
            </div>
            <Field label="ONT ID" value={ontId} onChange={setOntId} name="ontId" error={errors.ontId} placeholder="1" />
            <Field
              label="Line Profile Name"
              value={lineProfile}
              onChange={setLineProfile}
              name="lineProfile"
              error={errors.lineProfile}
              placeholder="LINE-PROFILE"
            />
            <Field label="SID" value={sid} onChange={setSid} name="sid" error={errors.sid} placeholder="123456789" />
            <Field
              label="Nama User"
              value={nama}
              onChange={(val) => setNama(val.replace(/\s+/g, "."))}
              name="nama"
              error={errors.nama}
              placeholder="Nama.Pelanggan"
            />

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Default otomatis: tanggal hari ini (YYYYMMDD)</p>
            </div>

            <Field label="VLAN" value={vlan} onChange={setVlan} name="vlan" error={errors.vlan} placeholder="10" />

            <button
              className="mt-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
              onClick={showConfig}
            >
              Show Config
            </button>
          </section>

          {/* Card 2: Mode */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-200">Mode</h2>
            <Radio name="mode" label="Config V2 ACS" checked={mode === MODES.V2} onChange={() => setMode(MODES.V2)} />
            <Radio name="mode" label="Config V1" checked={mode === MODES.V1} onChange={() => setMode(MODES.V1)} />
            <Radio name="mode" label="Cek IP" checked={mode === MODES.CEK_IP} onChange={() => setMode(MODES.CEK_IP)} />
            <Radio name="mode" label="Cek Redaman" checked={mode === MODES.REDAMAN} onChange={() => setMode(MODES.REDAMAN)} />
            <Radio name="mode" label="Hapus Config" checked={mode === MODES.HAPUS} onChange={() => setMode(MODES.HAPUS)} />
          </section>

          {/* Card 3: Output (copy button like Raisecom) */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Output</h2>
              <button
                onClick={copyConfig}
                className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs"
              >
                {copied ? "Copied!" : "Copy Config"}
              </button>
            </div>
            <textarea
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              rows={24}
              className="flex-1 font-mono text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 p-3 focus:outline-none"
              placeholder="Output konfigurasi akan muncul di sini setelah menekan Show Config"
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, name, error, placeholder }) {
  return (
    <div className="mb-3">
      <label
        htmlFor={name}
        className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
      >
        {label}
      </label>
      <input
        id={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Radio({ name, label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 mb-2 text-sm">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}

function ThemeToggle({ theme, setTheme }) {
  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 px-1 py-1">
      <button
        onClick={() => setTheme("light")}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${
          theme === "light" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${
          theme === "system" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        System
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${
          theme === "dark" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"
        }`}
      >
        Dark
      </button>
    </div>
  );
}
