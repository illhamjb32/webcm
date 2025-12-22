import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FiberhomeAktivasi() {
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
  const isSystemDark = () =>
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedDark = theme === "dark" || (theme === "system" && isSystemDark());

  // Inputs (Frame default 1, + Type ONT)
  const [sn, setSn] = useState("");
  const [frame, setFrame] = useState("1"); // langsung diisi 1
  const [slot, setSlot] = useState("");
  const [port, setPort] = useState("");
  const [ontId, setOntId] = useState("");
  const [typeOnt, setTypeOnt] = useState("");
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
  useEffect(() => { if (!password) setPassword(todayDefault); }, [todayDefault, password]);

  // Modes + OLT types
  const MODES = { V2: "v2acs", V1: "v1", CEK_IP: "cekip", REDAMAN: "cekredaman", HAPUS: "hapus" };
  const [mode, setMode] = useState(MODES.V2);
  const TYPES = { AN6000: "an6000", AN5116: "an5116" };
  const [oltType, setOltType] = useState(TYPES.AN6000);
  // Reset form inputs
  function resetForm() {
    setSn("");
    setFrame("1"); // default back to 1
    setSlot("");
    setPort("");
    setOntId("");
    setTypeOnt("");
    setSid("");
    setNama("");
    setPassword(todayDefault); // reset back to default date (YYYYMMDD)
    setVlan("");
    setErrors({});
    setOutput("");
    setMode(MODES.V2);          // optional: reset mode back to V2
    setOltType(TYPES.AN6000);   // optional: reset OLT type back to AN6000
  }

  // Validation
  const [errors, setErrors] = useState({});
  function requireAll() {
    const e = {};
    if (!sn) e.sn = "SN ONT wajib diisi";
    if (!frame) e.frame = "Frame wajib diisi";
    if (!slot) e.slot = "Slot wajib diisi";
    if (!port) e.port = "Port wajib diisi";
    if (!ontId) e.ontId = "ONT ID wajib diisi";
    if (!typeOnt) e.typeOnt = "Type ONT wajib diisi";
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
      setCopied(true); setTimeout(() => setCopied(false), 1500);
    } catch { }
  }

  // Helpers
  const FSP = `${frame}/${slot}/${port}`;

  // Normalisasi SN: kalau diawali "FHTT", pertahankan "FHTT" dan sisanya lowercase
  function normalizeSn(input) {
    const raw = (input || "").trim().replace(/\s+/g, "");
    return /^fhtt/i.test(raw) ? "FHTT" + raw.slice(4).toLowerCase() : raw;
  }

  // Generate
  function showConfig() {
    const needsFull = mode === MODES.V2 || mode === MODES.V1 || mode === MODES.REDAMAN || mode === MODES.CEK_IP || mode === MODES.HAPUS;
    if (needsFull && !requireAll()) return;

    const snSafe = normalizeSn(sn);

    if (oltType === TYPES.AN6000) {
      if (mode === MODES.V2) {
        const tpl = [
          "config",
          `whitelist add phy-id ${snSafe} checkcode fiberhome type ${typeOnt} slot ${slot} pon ${port} onuid ${ontId}`,
          `interface pon ${FSP}`,
          `onu wan-cfg ${ontId} index 1 mode internet type route ${vlan} 0 nat enable qos disable dsp pppoe proxy disable ${snSafe} ${password} 0 auto entries 4 fe1 fe2 ssid1 ssid5`,
          `onu ipv6-wan-cfg ${ontId} index 1 ip-stack-mode ipv4 ipv6-src-type slaac prefix-src-type delegate`,
          `onu wan-cfg ${ontId} index 2 mode tr069 type route 2989 5 nat dis qos disable dsp dhcp active enable`,
          `onu remote-manage-cfg ${ontId} tr069 enable acs-url http://10.14.4.250:10301 acl-user icon acl-pswd 1c0nPlus!BNG2019`,
          "quit",
          "save",
        ].join("\n\n");
        setOutput(tpl);
        return;
      }

      if (mode === MODES.V1) {
        const tpl = [
          "config",
          `whitelist add phy-id ${snSafe} checkcode fiberhome type ${typeOnt} slot ${slot} pon ${port} onuid ${ontId}`,
          `interface pon ${FSP}`,
          `onu wan-cfg ${ontId} index 1 mode internet type route ${vlan} 0 nat enable qos disable dsp pppoe proxy disable ${snSafe} ${password} 0 auto entries 4 fe1 fe2 ssid1 ssid5`,
          `onu ipv6-wan-cfg ${ontId} index 1 ip-stack-mode ipv4 ipv6-src-type slaac prefix-src-type delegate`,
          `onu wan-cfg ${ontId} index 2 mode tr069 type route 2989 5 nat dis qos disable dsp dhcp active enable`,
          "quit",
          "save",
        ].join("\n\n");
        setOutput(tpl);
        return;
      }

      if (mode === MODES.REDAMAN) {
        const tpl = [
          `interface pon ${FSP}`,
          `show onu optical-info ${ontId}`,
        ].join("\n\n");
        setOutput(tpl);
        return;
      }

      if (mode === MODES.CEK_IP) {
        const tpl = [
          `interface pon ${FSP}`,
          `show onu ${ontId} wan-info`,
        ].join("\n\n");
        setOutput(tpl);
        return;
      }

      if (mode === MODES.HAPUS) {
        setOutput(`no whitelist slot ${slot} pon ${port} onu ${ontId}`);
        return;
      }
    }

    if (oltType === TYPES.AN5116) {
      if (mode === MODES.V2) {
        const tpl = [
          "cd onu",
          `set whitelist phy_addr address ${snSafe} password fiberhome action add slot ${slot} pon ${port} onu ${ontId} type ${typeOnt}`,
          "cd lan",
          `set wancfg slot ${slot} ${port} ${ontId} index 1 mode internet type route ${vlan} 0 nat enable qos disable dsp pppoe proxy disable ${snSafe} ${password}  0 auto entries 4 fe1 fe2 ssid1 ssid5`,
          `set wancfg slot ${slot} ${port} ${ontId} index 1 ip-stack-mode ipv4 ipv6-src-type slaac prefix-src-type delegate`,
          `set wancfg slot ${slot} ${port} ${ontId} index 2 mode tr069 type route 2989 cos nat disable qos disable dsp dhcp`,
          `apply wancfg slot ${slot} ${port} ${ontId}`,
          "cd /",
          "",
          "cd onu",
          `set remote_manage_cfg slot ${slot} pon ${port} onu ${ontId} tr069 enable acs_url http://10.14.4.250:10301  acl_user icon acl_pswd 1c0nPlus!BNG2019`,
          "",
          "save",
        ].join("\n\n");
        setOutput(tpl);
        return;
      }

      if (mode === MODES.V1) {
        const tpl = [
          "cd onu",
          "",
          "show discovery slot all pon all",
          `show whitelist phy-sn slot ${slot} pon ${port}`,
          `set whitelist phy_addr address ${snSafe} password fiberhome action add slot ${slot} pon ${port} onu ${ontId} type ${typeOnt}`,
          "",
          "cd lan",
          `set wancfg slot ${slot} ${port} ${ontId} index 1 mode internet type route ${vlan} 0 nat enable qos disable dsp pppoe proxy disable ${snSafe} ${password} 0 auto entries 3 fe1 fe2 ssid1`,
          `set wancfg slot ${slot} ${port} ${ontId} index 1 ip-stack-mode ipv4 ipv6-src-type slaac prefix-src-type delegate`,
          `apply wancfg slot ${slot} ${port} ${ontId}`,
          "",
          "cd /",
          "",
          "save",
        ].join("\n\n");
        setOutput(tpl);
        return;
      }

      if (mode === MODES.REDAMAN) {
        setOutput(`show onu opticalpower-info phy-id ${snSafe}`);
        return;
      }

      if (mode === MODES.CEK_IP) {
        const tpl = [
          "cd onu",
          `show wan_info slot ${slot} pon ${port} on ${ontId}`,
          "cd /",
        ].join("\n\n");
        setOutput(tpl);
        return;
      }

      if (mode === MODES.HAPUS) {
        setOutput(`no whitelist slot ${slot} pon ${port} onu ${ontId}`);
        return;
      }
    }
  }

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6">
        {/* Header */}
        <div className="mx-auto max-w-7xl flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Config · Aktivasi · Fiberhome</h1>
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

            <Field
              label="SN ONT"
              value={sn}
              onChange={(val) => setSn(normalizeSn(val))}
              name="sn"
              error={errors.sn}
              placeholder="contoh: FHTTC06C8432 → FHTTc06c8432"
            />
            <div className="grid grid-cols-3 gap-2">
              <Field label="Frame" value={frame} onChange={setFrame} name="frame" error={errors.frame} placeholder="1" />
              <Field label="Slot" value={slot} onChange={setSlot} name="slot" error={errors.slot} placeholder="0" />
              <Field label="Port" value={port} onChange={setPort} name="port" error={errors.port} placeholder="0" />
            </div>
            <Field label="ONT ID" value={ontId} onChange={setOntId} name="ontId" error={errors.ontId} placeholder="1" />
            <Field label="Type ONT" value={typeOnt} onChange={setTypeOnt} name="typeOnt" error={errors.typeOnt} placeholder="contoh: HG6243C" />
            <Field label="SID" value={sid} onChange={setSid} name="sid" error={errors.sid} placeholder="123456789" />
            <Field label="Nama User" value={nama} onChange={(val) => setNama(val.replace(/\s+/g, "."))} name="nama" error={errors.nama} placeholder="Nama.Pelanggan" />

            <div className="mb-3">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" />
              {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Default otomatis: tanggal hari ini (YYYYMMDD)</p>
            </div>

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

          {/* Card 2: Mode + OLT type */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm">
            <h2 className="text-sm font-semibold mb-4 text-slate-700 dark:text-slate-200">Mode</h2>

            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tipe OLT</label>
              <select value={oltType} onChange={(e) => setOltType(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-3 py-2 text-sm">
                <option value={TYPES.AN6000}>FH AN6000</option>
                <option value={TYPES.AN5116}>FH AN5116</option>
              </select>
            </div>

            <Radio name="mode" label="Config V2 ACS" checked={mode === MODES.V2} onChange={() => setMode(MODES.V2)} />
            <Radio name="mode" label="Config V1" checked={mode === MODES.V1} onChange={() => setMode(MODES.V1)} />
            <Radio name="mode" label="Cek IP" checked={mode === MODES.CEK_IP} onChange={() => setMode(MODES.CEK_IP)} />
            <Radio name="mode" label="Cek Redaman" checked={mode === MODES.REDAMAN} onChange={() => setMode(MODES.REDAMAN)} />
            <Radio name="mode" label="Hapus Config" checked={mode === MODES.HAPUS} onChange={() => setMode(MODES.HAPUS)} />
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
      <button onClick={() => setTheme("light")} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${theme === "light" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Light</button>
      <button onClick={() => setTheme("system")} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${theme === "system" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>System</button>
      <button onClick={() => setTheme("dark")} className={`px-2.5 py-1.5 rounded-xl text-xs font-medium ${theme === "dark" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>Dark</button>
    </div>
  );
}
