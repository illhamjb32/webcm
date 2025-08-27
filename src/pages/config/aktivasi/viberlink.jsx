import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ViberlinkAktivasi() {
  const navigate = useNavigate();

  // Route guard
  useEffect(() => {
    if (!sessionStorage.getItem("auth")) navigate("/");
  }, [navigate]);

  // Dark mode (sync cm-theme)
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    const saved = localStorage.getItem("cm-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  const isSystemDark = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedDark = theme === "dark" || (theme === "system" && isSystemDark());

  // Inputs (konsep Fiberhome, beda: +Username, Password bukan tanggal, -SID, -Nama User)
  const [sn, setSn] = useState("");
  const [frame, setFrame] = useState("1"); // default 1
  const [slot, setSlot] = useState("");
  const [port, setPort] = useState("");
  const [ontId, setOntId] = useState("");
  const [typeOnt, setTypeOnt] = useState("");
  const [username, setUsername] = useState(""); // contoh REGVB15540852648
  const [password, setPassword] = useState(""); // placeholder: nama depan huruf kecil
  const [vlan, setVlan] = useState("");

  // Modes (tidak ada V2 ACS)
  const MODES = { CONFIG: "config", CEK_IP: "cekip", REDAMAN: "cekredaman", HAPUS: "hapus" };
  const [mode, setMode] = useState(MODES.CONFIG);

  // Validation
  const [errors, setErrors] = useState({});
  function validateAllForConfig() {
    const e = {};
    if (!sn) e.sn = "SN ONT wajib diisi";
    if (!frame) e.frame = "Frame wajib diisi";
    if (!slot) e.slot = "Slot wajib diisi";
    if (!port) e.port = "Port wajib diisi";
    if (!ontId) e.ontId = "ONT ID wajib diisi";
    if (!typeOnt) e.typeOnt = "Type ONT wajib diisi";
    if (!username) e.username = "Username wajib diisi";
    if (!password) e.password = "Password wajib diisi";
    if (!vlan) e.vlan = "VLAN wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function validateForBasic() {
    const e = {};
    if (!frame) e.frame = "Frame wajib diisi";
    if (!slot) e.slot = "Slot wajib diisi";
    if (!port) e.port = "Port wajib diisi";
    if (!ontId) e.ontId = "ONT ID wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Output + copy
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(output || "");
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch { }
  }

  const FSP = `${frame}/${slot}/${port}`;
  //rst
  // Reset form inputs
  function resetForm() {
    setSn("");
    setFrame("1"); // back to default 1
    setSlot("");
    setPort("");
    setOntId("");
    setTypeOnt("");
    setUsername("");
    setPassword("");
    setVlan("");
    setErrors({});
    setOutput("");
    setMode(MODES.CONFIG); // optional: reset mode back to CONFIG
  }

  function showConfig() {
    if (mode === MODES.CONFIG) {
      if (!validateAllForConfig()) return;

      const tpl = [
        "Config",
        "",
        "show discovery",
        "",
        `show whitelist phy-id ${FSP}`,
        "",
        `whitelist add phy-id ${sn} checkcode fiberhome type ${typeOnt} slot ${slot} pon ${port} onuid ${ontId}`,
        "",
        `interface pon ${FSP}`,
        "",
        `onu wan-cfg ${ontId} ind 1 mode inter ty r ${vlan} 0 nat en qos dis dsp pppoe pro dis ${username} ${password} null auto entries 4 fe1 fe2 ssid1 ssid5`,
        "",
        `onu ipv6-wan-cfg ${ontId} ind 1 ip-stack-mode ipv4 ipv6-src-type slaac prefix-src-type delegate`,
        "",
        `onu layer3-ratelimit-profile ${ontId} 1 upstream-profile-id 1 downstream-profile-id 1`,
        "",
        `onu local-manage-con ${ontId} conf en cons en tel en web en web-p 80 web-ani-s en tel-ani-s en web-admin-s dis icmp-ani en icmp-uni en ssh-ani dis ssh-uni dis snmp-ani dis snmp-uni dis tftp-ani dis tftp-uni dis ftp-ani dis ftp-uni dis`,
        "",
        "quit",
        "",
        "save",
      ].join("\n");
      setOutput(tpl);
      return;
    }

    if (mode === MODES.REDAMAN) {
      if (!validateForBasic()) return;
      const tpl = [
        `interface pon ${FSP}`,
        "",
        `show onu optical-info ${ontId}`,
      ].join("\n");
      setOutput(tpl);
      return;
    }

    if (mode === MODES.CEK_IP) {
      if (!validateForBasic()) return;
      const tpl = [
        `interface pon ${FSP}`,
        "",
        `show onu ${ontId} wan-info`,
      ].join("\n");
      setOutput(tpl);
      return;
    }

    if (mode === MODES.HAPUS) {
      if (!validateForBasic()) return;
      setOutput(`no whitelist slot ${slot} pon ${port} onu ${ontId}`);
      return;
    }
  }

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6">
        {/* Header */}
        <div className="mx-auto max-w-7xl flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Config · Aktivasi · Viberlink</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate(-1)}>Kembali</button>
          </div>
        </div>

        {/* Grid */}
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card 1: Input */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-200">Input Data</h2>

            <Field label="SN ONT" value={sn} onChange={(val) => { const r = (val || '').trim(); setSn(/^fhtt/i.test(r) ? 'FHTT' + r.slice(4).toLowerCase() : r); }} name="sn" error={errors.sn} placeholder="contoh: FHTTC06C8432 → FHTTc06c8432" />
            <div className="grid grid-cols-3 gap-2">
              <Field label="Frame" value={frame} onChange={setFrame} name="frame" error={errors.frame} placeholder="1" />
              <Field label="Slot" value={slot} onChange={setSlot} name="slot" error={errors.slot} placeholder="0" />
              <Field label="Port" value={port} onChange={setPort} name="port" error={errors.port} placeholder="0" />
            </div>
            <Field label="ONT ID" value={ontId} onChange={setOntId} name="ontId" error={errors.ontId} placeholder="1" />
            <Field label="Type ONT" value={typeOnt} onChange={setTypeOnt} name="typeOnt" error={errors.typeOnt} placeholder="contoh: AN5506-04-F1" />
            <Field label="Username" value={username} onChange={setUsername} name="username" error={errors.username} placeholder="REGVB15540852648" />
            <Field label="Password" value={password} onChange={setPassword} name="password" error={errors.password} placeholder="nama depan huruf kecil" />
            <Field label="VLAN" value={vlan} onChange={setVlan} name="vlan" error={errors.vlan} placeholder="10" />

            <button className="mt-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2" onClick={showConfig}>Show Config</button>
            <button
              className="mt-2 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
              onClick={resetForm}
              type="button"
            >
              Reset Form
            </button>

          </section>

          {/* Card 2: Mode */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-200">Mode</h2>
            <Radio name="mode" label="CONFIG" checked={mode === MODES.CONFIG} onChange={() => setMode(MODES.CONFIG)} />
            <Radio name="mode" label="Cek IP" checked={mode === MODES.CEK_IP} onChange={() => setMode(MODES.CEK_IP)} />
            <Radio name="mode" label="Cek Redaman" checked={mode === MODES.REDAMAN} onChange={() => setMode(MODES.REDAMAN)} />
            <Radio name="mode" label="Hapus Ont" checked={mode === MODES.HAPUS} onChange={() => setMode(MODES.HAPUS)} />
          </section>

          {/* Card 3: Output */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Output</h2>
              <button onClick={copyConfig} className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs">{copied ? "Copied!" : "Copy Config"}</button>
            </div>
            <textarea value={output} onChange={(e) => setOutput(e.target.value)} rows={24} className="flex-1 font-mono text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 p-3 focus:outline-none" placeholder="Output konfigurasi akan muncul di sini setelah menekan Show Config" />
          </section>
        </div>
      </div>
    </div>
  );
}

// Reusable
function Field({ label, value, onChange, name, error, placeholder }) {
  return (
    <div className="mb-3">
      <label htmlFor={name} className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{label}</label>
      <input id={name} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
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
      <button onClick={() => setTheme("light")} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${theme === "light" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Light</button>
      <button onClick={() => setTheme("system")} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${theme === "system" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>System</button>
      <button onClick={() => setTheme("dark")} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${theme === "dark" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Dark</button>
    </div>
  );
}
