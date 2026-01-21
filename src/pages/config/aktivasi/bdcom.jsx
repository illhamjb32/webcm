import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function BDCOMAktivasi() {
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

  // Inputs (no Frame, no Line Profile)
  const [sn, setSn] = useState("");
  const [slot, setSlot] = useState("");
  const [port, setPort] = useState("");
  const [ontId, setOntId] = useState("");
  const [sid, setSid] = useState("");
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
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
    if (!password && todayDefault) setPassword(todayDefault);
  }, [todayDefault]);

  // Modes
  const MODES = { V1: "v1", CEK_IP: "cekip", REDAMAN: "cekredaman", HAPUS: "hapus" };

  // Pengecekan modes
  const PENGECEKAN_MODES = {
    CEK_WAN_STATUS: "cek_wan_status",
    CEK_ONU_STATUS: "cek_onu_status",
    CEK_POWER: "cek_power",
    CEK_OPTICAL: "cek_optical",
    CEK_ONT_STATUS: "cek_ont_status",
    CEK_PORT: "cek_port",
    CEK_REDAMAN: "cek_redaman",
    CEK_WAN_SERVICE: "cek_wan_service",
    GANTI_SSID_PASSWORD: "ganti_ssid_password",
    REBOOT: "reboot",
    GANTI_VLAN: "ganti_vlan",
    CEK_MAC_ADDRESS: "cek_mac_address",
    BIND_IP_ULANG: "bind_ip_ulang",
    HAPUS_IP: "hapus_ip",
    STATUS_INACTIVE: "status_inactive",
    CEK_TOTAL_USER: "cek_total_user",
    CEK_ALL_USER: "cek_all_user",
    CEK_RUNNING_CONFIG: "cek_running_config",
    CEK_REDAMAN_PORT: "cek_redaman_port",
  };

  // Single unified selected option across both Aktivasi and Pengecekan
  const [selectedOption, setSelectedOption] = useState(MODES.V1);
  // Reset form inputs
  function resetForm() {
    setSn("");
    setSlot("");
    setPort("");
    setOntId("");
    setSid("");
    setNama("");
    setUsername("");
    setPassword(todayDefault);
    setVlan("");
    setErrors({});
    setOutput("");
  }

  // Validation
  const [errors, setErrors] = useState({});
  function requireAll() {
    const e = {};
    if (!sn) e.sn = "SN ONT wajib diisi";
    if (!slot) e.slot = "Slot wajib diisi";
    if (!port) e.port = "Port wajib diisi";
    if (!ontId) e.ontId = "ONT ID wajib diisi";
    if (!sid) e.sid = "SID wajib diisi";
    if (!nama) e.nama = "Nama User wajib diisi";
    if (!password) e.password = "Password wajib diisi";
    if (!vlan) e.vlan = "VLAN wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Update username default when SN changes
  useEffect(() => {
    setUsername(sn);
  }, [sn]);

  // Reset password to today when SN changes
  useEffect(() => {
    if (sn) {
      setPassword(todayDefault);
    }
  }, [sn, todayDefault]);

  // Auto-update config when selectedOption changes
  useEffect(() => {
    // Check if it's a mode (aktivasi) or pengecekan option
    const isAktivasi = Object.values(MODES).includes(selectedOption);
    
    if (isAktivasi) {
      showConfig(selectedOption);
    } else {
      generatePengecekanConfig(selectedOption);
    }
  }, [selectedOption, sn, slot, port, ontId, sid, vlan]);

  // Output & copy
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);
  async function copyConfig() {
    try {
      await navigator.clipboard.writeText(output || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { }
  }

  // Dummy data
  function loadDummyData() {
    setSn("4244434DB12E818A");
    setSlot("0");
    setPort("14");
    setOntId("28");
    setSid("141000550166");
    setNama("WIRANTI");
    setUsername("4244434DB12E818A");
    setPassword("20230204");
    setVlan("2938");
    setErrors({});
    setOutput("");
  }

  // Generate Pengecekan Config
  function generatePengecekanConfig(penMode) {
    const SloPorOnt = `${slot}/${port}:${ontId}`;

    let config = "";

    if (penMode === PENGECEKAN_MODES.CEK_WAN_STATUS) {
      config = `show gpon interface gpON ${SloPorOnt} onu wan 1 config`;
    } else if (penMode === PENGECEKAN_MODES.CEK_ONU_STATUS) {
      config = `show gpon interface gpON ${SloPorOnt} onu status`;
    } else if (penMode === PENGECEKAN_MODES.CEK_POWER) {
      config = `show gpon interface gpON ${SloPorOnt} onu optical-transceiver-diagnosis`;
    } else if (penMode === PENGECEKAN_MODES.CEK_OPTICAL) {
      config = `show gpon interface gpON ${SloPorOnt} onu transceiver-info`;
    } else if (penMode === PENGECEKAN_MODES.CEK_ONT_STATUS) {
      config = `show gpon onu-information sn ${sn}\nshow gpon interface gpON ${SloPorOnt} onu basic-info`;
    } else if (penMode === PENGECEKAN_MODES.CEK_PORT) {
      config = `show gpon onu-information interface gpon ${slot}/${port}\nshow gpon onu-description interface gpon ${slot}/${port}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_REDAMAN) {
      config = `show gpon interface gpON ${SloPorOnt} onu optical-transceiver-diagnosis\nshow gpon onu-optical-transceiver-diagnosis int gpon 0/${slot}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_WAN_SERVICE) {
      config = `show gpon interface gpON ${SloPorOnt} onu wan 1 config`;
    } else if (penMode === PENGECEKAN_MODES.GANTI_SSID_PASSWORD) {
      config = `config\nint gpon ${slot}/${port}:${ontId}\ngpon onu wifi 2.4G ssid 1 ssid-name ....\ngpon onu wifi 2.4G ssid 1 encrypt-key ....`;
    } else if (penMode === PENGECEKAN_MODES.REBOOT) {
      config = `gpon reboot onu interface gpon ${slot}/${port}:${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.GANTI_VLAN && vlan) {
      config = `config\ninterface gpon 0/${slot}:${ontId}\ngpon onu wan 1 tci vlan ${vlan}\ngpon onu wan 1 connection-type dhcp\ngpon onu wan 1 service-type internet\ngpon onu wan 1 bind lan1 lan2 ssid1`;
    } else if (penMode === PENGECEKAN_MODES.CEK_MAC_ADDRESS) {
      config = `show mac-address table interface gpON ${SloPorOnt}`;
    } else if (penMode === PENGECEKAN_MODES.BIND_IP_ULANG) {
      config = `config\ninterface gpoN 0/${slot}\nno gpon bind-onu sequence ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.HAPUS_IP) {
      config = `config\ninterface gpoN 0/${slot}\nno gpon bind-onu sn ${sn}`;
    } else if (penMode === PENGECEKAN_MODES.STATUS_INACTIVE) {
      config = `gpon transceiver any-reset-preamble`;
    } else if (penMode === PENGECEKAN_MODES.CEK_TOTAL_USER) {
      config = `show gpon onu-status-count`;
    } else if (penMode === PENGECEKAN_MODES.CEK_ALL_USER) {
      config = `show gpon-onu description\nshow gpon-onu information\nshow gpon active-onu\nshow gpon inactive-onu`;
    } else if (penMode === PENGECEKAN_MODES.CEK_RUNNING_CONFIG) {
      config = `show running-config db-onu interface GPON 0/${slot}:${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_REDAMAN_PORT) {
      config = `show interface gPON 0/${slot}`;
    } else {
      setOutput("⚠️ Silakan isi field yang diperlukan untuk pengecekan ini");
      return;
    }

    if (config) {
      setOutput(config);
    }
  }

  // Build strings
  function showConfig(selectedMode) {
    const needsFull = Object.values(MODES).includes(selectedMode) && (selectedMode === MODES.V1 || selectedMode === MODES.REDAMAN || selectedMode === MODES.CEK_IP);
    if (needsFull && !requireAll()) {
      setOutput("⚠️ Silakan isi semua field yang wajib diisi");
      return;
    }

    const SloPorOnt = `${slot}/${port}:${ontId}`;

    if (selectedMode === MODES.V1) {
      const tpl = `Config

interface GPON0/${slot}:${port}

description ${sid}-${nama}

quit

Config

interface gpON 0/${slot}:${port}

gpon onu wan 1 admin-status enable

gpon onu wan 1 nat enable

gpon onu wan 1 service-type internet

gpon onu wan 1 connection-type pppoe

gpon onu wan 1 pppoe username ${username} password ${password}

gpon onu wan 1 tci vlan ${vlan}

gpon onu wan 1 bind lan1 lan2 ssid1

gpon onu wan 1 auto-get-dns-address enable

gpon onu wan 1 lan-dhcp enable

quit

write all
`;
      setOutput(tpl);
      return;
    }

    if (selectedMode === MODES.REDAMAN) {
      setOutput(`show gpon interface gpON ${SloPorOnt} onu optical-transceiver-diagnosis`);
      return;
    }

    if (selectedMode === MODES.CEK_IP) {
      setOutput(`show gpon interface gpON ${SloPorOnt} onu wan 1 config`);
      return;
    }

    if (selectedMode === MODES.HAPUS) {
      setOutput(`config\ninterface gpON ${SloPorOnt}\nno gpon onu wan 1`);
      return;
    }
  }

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6">
        {/* Header */}
        <div className="mx-auto max-w-7xl flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Config · Aktivasi · BDCOM</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle theme={theme} setTheme={setTheme} />
            <button className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => navigate(-1)}>Kembali</button>
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

            <Field label="SN ONT" value={sn} onChange={setSn} name="sn" error={errors.sn} placeholder="e.g. 5A544547D1A1189A" />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Slot" value={slot} onChange={setSlot} name="slot" error={errors.slot} placeholder="0" />
              <Field label="Port" value={port} onChange={setPort} name="port" error={errors.port} placeholder="0" />
            </div>
            <Field label="ONT ID" value={ontId} onChange={setOntId} name="ontId" error={errors.ontId} placeholder="1" />
            <Field label="SID" value={sid} onChange={setSid} name="sid" error={errors.sid} placeholder="123456789" />
            <Field
              label="Nama User"
              value={nama}
              onChange={(val) => setNama(val.replace(/\s+/g, "."))}
              name="nama"
              error={errors.nama}
              placeholder="Nama.Pelanggan"
            />

            <Field
              label="Username"
              value={username}
              onChange={setUsername}
              name="username"
              placeholder={sn || "Username (default: SN)"}
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

            <button className="mt-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2" onClick={() => showConfig(selectedOption)}>Show Config</button>
            <button
              className="mt-2 w-full rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
              onClick={resetForm}
              type="button"
            >
              Reset Form
            </button>
          </section>

          {/* Card 2: Aktivasi & Pengecekan */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm overflow-y-auto flex flex-col">
            <div>
              <h2 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-200">Aktivasi</h2>
              <div className="space-y-1.5 mb-4 pb-4 border-b border-slate-300 dark:border-slate-700">
                <Radio name="option" label="Config V1" checked={selectedOption === MODES.V1} onChange={() => setSelectedOption(MODES.V1)} />
                <Radio name="option" label="Cek IP" checked={selectedOption === MODES.CEK_IP} onChange={() => setSelectedOption(MODES.CEK_IP)} />
                <Radio name="option" label="Cek Redaman" checked={selectedOption === MODES.REDAMAN} onChange={() => setSelectedOption(MODES.REDAMAN)} />
                <Radio name="option" label="Hapus Config" checked={selectedOption === MODES.HAPUS} onChange={() => setSelectedOption(MODES.HAPUS)} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-200">Pengecekan</h2>
              <div className="space-y-1.5">
                <Radio name="option" label="Cek WAN Status" checked={selectedOption === PENGECEKAN_MODES.CEK_WAN_STATUS} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_WAN_STATUS)} />
                <Radio name="option" label="Cek ONU Status" checked={selectedOption === PENGECEKAN_MODES.CEK_ONU_STATUS} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_ONU_STATUS)} />
                <Radio name="option" label="Cek Power" checked={selectedOption === PENGECEKAN_MODES.CEK_POWER} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_POWER)} />
                <Radio name="option" label="Cek Optical" checked={selectedOption === PENGECEKAN_MODES.CEK_OPTICAL} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_OPTICAL)} />
                <Radio name="option" label="Cek ONT Status" checked={selectedOption === PENGECEKAN_MODES.CEK_ONT_STATUS} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_ONT_STATUS)} />
                <Radio name="option" label="Cek Port" checked={selectedOption === PENGECEKAN_MODES.CEK_PORT} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_PORT)} />
                <Radio name="option" label="Cek Redaman" checked={selectedOption === PENGECEKAN_MODES.CEK_REDAMAN} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_REDAMAN)} />
                <Radio name="option" label="Cek WAN Service" checked={selectedOption === PENGECEKAN_MODES.CEK_WAN_SERVICE} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_WAN_SERVICE)} />
                <Radio name="option" label="Ganti SSID/Password" checked={selectedOption === PENGECEKAN_MODES.GANTI_SSID_PASSWORD} onChange={() => setSelectedOption(PENGECEKAN_MODES.GANTI_SSID_PASSWORD)} />
                <Radio name="option" label="Reboot" checked={selectedOption === PENGECEKAN_MODES.REBOOT} onChange={() => setSelectedOption(PENGECEKAN_MODES.REBOOT)} />
                <Radio name="option" label="Ganti VLAN" checked={selectedOption === PENGECEKAN_MODES.GANTI_VLAN} onChange={() => setSelectedOption(PENGECEKAN_MODES.GANTI_VLAN)} />
                <Radio name="option" label="Cek MAC Address" checked={selectedOption === PENGECEKAN_MODES.CEK_MAC_ADDRESS} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_MAC_ADDRESS)} />
                <Radio name="option" label="Bind IP Ulang" checked={selectedOption === PENGECEKAN_MODES.BIND_IP_ULANG} onChange={() => setSelectedOption(PENGECEKAN_MODES.BIND_IP_ULANG)} />
                <Radio name="option" label="Hapus IP" checked={selectedOption === PENGECEKAN_MODES.HAPUS_IP} onChange={() => setSelectedOption(PENGECEKAN_MODES.HAPUS_IP)} />
                <Radio name="option" label="Status Inactive" checked={selectedOption === PENGECEKAN_MODES.STATUS_INACTIVE} onChange={() => setSelectedOption(PENGECEKAN_MODES.STATUS_INACTIVE)} />
                <Radio name="option" label="Cek Total User" checked={selectedOption === PENGECEKAN_MODES.CEK_TOTAL_USER} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_TOTAL_USER)} />
                <Radio name="option" label="Cek All User" checked={selectedOption === PENGECEKAN_MODES.CEK_ALL_USER} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_ALL_USER)} />
                <Radio name="option" label="Cek Running Config" checked={selectedOption === PENGECEKAN_MODES.CEK_RUNNING_CONFIG} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_RUNNING_CONFIG)} />
                <Radio name="option" label="Cek Redaman Port" checked={selectedOption === PENGECEKAN_MODES.CEK_REDAMAN_PORT} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_REDAMAN_PORT)} />
              </div>
            </div>
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