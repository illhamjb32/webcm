import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function OpenAksesMoratel() {
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
  const [sid, setSid] = useState("");
  const [nama, setNama] = useState("");
  const DEFAULT_PPPOE_USERNAME = "";
  const DEFAULT_PPPOE_PASSWORD = "";
  const DUMMY_PPPOE_USERNAME = "21432257";
  const DUMMY_PPPOE_PASSWORD = "icon21432257";
  const [pppoeUsername, setPppoeUsername] = useState(DEFAULT_PPPOE_USERNAME);
  const [pppoePassword, setPppoePassword] = useState(DEFAULT_PPPOE_PASSWORD);

  // Validation
  const [errors, setErrors] = useState({});
  function requireAll() {
    const e = {};
    if (!sn) e.sn = "SN ONT wajib diisi";
    if (!frame) e.frame = "Frame wajib diisi";
    if (!slot) e.slot = "Slot wajib diisi";
    if (!port) e.port = "Port wajib diisi";
    if (!ontId) e.ontId = "ONT ID wajib diisi";
    if (!sid) e.sid = "SID wajib diisi";
    if (!nama) e.nama = "Nama User wajib diisi";
    if (!pppoeUsername) e.pppoeUsername = "Username wajib diisi";
    if (!pppoePassword) e.pppoePassword = "Password wajib diisi";
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
      // noop
    }
  }

  function loadDummyData() {
    setSn("48575443B47E49B6");
    setFrame("0");
    setSlot("1");
    setPort("9");
    setOntId("26");
    setSid("21432257");
    setNama("STELLA");
    setPppoeUsername(DUMMY_PPPOE_USERNAME);
    setPppoePassword(DUMMY_PPPOE_PASSWORD);
    setErrors({});
    setOutput("");
  }

  function resetForm() {
    setSn("");
    setFrame("");
    setSlot("");
    setPort("");
    setOntId("");
    setSid("");
    setNama("");
    setPppoeUsername(DEFAULT_PPPOE_USERNAME);
    setPppoePassword(DEFAULT_PPPOE_PASSWORD);
    setErrors({});
    setOutput("");
  }

  function showConfig() {
    if (!requireAll()) {
      setOutput("⚠️ Silakan isi semua field yang wajib diisi");
      return;
    }

    const FSP = `${frame}/${slot}`;
    const FSP_ID = `${frame}/${slot}/${port}`;

    const tpl = `int gpon ${FSP}


ont add ${port} ${ontId} sn-auth ${sn} omci ont-lineprofile-name OAMORATEL.2700 ont-srvprofile-name OAMORATEL.2700 desc ${sid}-${nama}


ont ipconfig ${port} ${ontId} pppoe vlan 2700 priority 0 user-account username ${pppoeUsername} password ${pppoePassword}


ont internet-config ${port} ${ontId} ip-index 0


ont wan-config ${port} ${ontId} ip-index 0 profile-name MORATEL


ont policy-route-config ${port} ${ontId} profile-name MORATEL


ont port route ${port} ${ontId} eth 1 enable


ont port route ${port} ${ontId} eth 2 enable


quit


service-port vlan 2700 gpon ${FSP_ID} ont ${ontId} gemport 1 multi-service user-vlan 2700 tag-transform translate


save`;

    setOutput(tpl);
  }

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6">
        {/* Header */}
        <div className="mx-auto max-w-7xl flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Config · Open Akses · MORATEL</h1>
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Input Data</h2>
              <button
                className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs"
                onClick={loadDummyData}
              >
                Data Dummy
              </button>
            </div>

            <Field label="SN ONT" value={sn} onChange={setSn} name="sn" error={errors.sn} placeholder="e.g. 48575443B47E49B6" />
            <div className="grid grid-cols-3 gap-2">
              <Field label="Frame" value={frame} onChange={setFrame} name="frame" error={errors.frame} placeholder="0" />
              <Field label="Slot" value={slot} onChange={setSlot} name="slot" error={errors.slot} placeholder="1" />
              <Field label="Port" value={port} onChange={setPort} name="port" error={errors.port} placeholder="9" />
            </div>
            <Field label="ONT ID" value={ontId} onChange={setOntId} name="ontId" error={errors.ontId} placeholder="26" />
            <Field label="SID" value={sid} onChange={setSid} name="sid" error={errors.sid} placeholder="21432257" />
            <Field
              label="Nama User"
              value={nama}
              onChange={(val) => setNama(val.replace(/\s+/g, "."))}
              name="nama"
              error={errors.nama}
              placeholder="STELLA"
            />
            <Field
              label="Username"
              value={pppoeUsername}
              onChange={setPppoeUsername}
              name="pppoeUsername"
              error={errors.pppoeUsername}
              placeholder="Masukkan Username PPPoE"
            />
            <Field
              label="Password"
              value={pppoePassword}
              onChange={setPppoePassword}
              name="pppoePassword"
              error={errors.pppoePassword}
              placeholder="Masukkan Password PPPoE"

            />

            <button
              className="mt-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
              onClick={showConfig}
            >
              Show Config
            </button>
            <button
              className="mt-2 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
              onClick={resetForm}
              type="button"
            >
              Reset Form
            </button>
          </section>

          {/* Card 2: Fixed Profile */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-200">Open Akses - MORATEL</h2>
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-200">
              <p>Line Profile: <b>OAMORATEL.2700</b></p>
              <p>Service Profile: <b>OAMORATEL.2700</b></p>
              <p>VLAN: <b>2700</b></p>
              <p>WAN/Policy Profile: <b>MORATEL</b></p>
              <p className="text-xs text-slate-500 dark:text-slate-400 pt-2">FSP ID mengikuti pola Huawei: Frame/Slot/Port.</p>
            </div>
          </section>

          {/* Card 3: Output */}
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
      <label htmlFor={name} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">
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