import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RaisecomAktivasi() {
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
  const [slot, setSlot] = useState("");
  const [port, setPort] = useState("");
  const [ontId, setOntId] = useState("");
  const [lineProfileId, setLineProfileId] = useState("");
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
  const MODES = {
    V2: "v2acs",
    V1: "v1",
    CEK_IP: "cekip",
    REDAMAN: "cekredaman",
    HAPUS: "hapus",
  };

  // Pengecekan modes
  const PENGECEKAN_MODES = {
    CEK_FSP: "cek_fsp",
    CEK_ONT_STATUS: "cek_ont_status",
    CEK_POWER: "cek_power",
    CEK_IP: "cek_ip",
    CEK_PORT_REDAMAN: "cek_port_redaman",
    CEK_SSID_PASSWORD: "cek_ssid_password",
    GANTI_SSID_PASSWORD: "ganti_ssid_password",
    PING_GAGAL_BNG: "ping_gagal_bng",
    REBOOT: "reboot",
    GANTI_LINE_PROFILE: "ganti_line_profile",
    GANTI_VLAN: "ganti_vlan",
    HAPUS_IP: "hapus_ip",
    IP_STATIC: "ip_static",
    ENABLE_DISABLE_SSID: "enable_disable_ssid",
    FACTORY_RESET: "factory_reset",
    MISMATCH_TO_MATCH: "mismatch_to_match",
    PING_OLT: "ping_olt",
    REDAMAN_PORT: "redaman_port",
    ENABLE_REDAMAN_PORT: "enable_redaman_port",
    ALLOWED_VLAN: "allowed_vlan",
  };

  // Single unified selected option across both Aktivasi and Pengecekan
  const [selectedOption, setSelectedOption] = useState(MODES.V2);

  // Validation
  const [errors, setErrors] = useState({});
  function requireAll() {
    const e = {};
    if (!sn) e.sn = "SN ONT wajib diisi";
    if (!slot) e.slot = "Slot wajib diisi";
    if (!port) e.port = "Port wajib diisi";
    if (!ontId) e.ontId = "ONT ID wajib diisi";
    if (!lineProfileId) e.lineProfileId = "Line Profile ID wajib diisi";
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

  // Output + copy
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
    setSn("RCMG3A8848C4");
    setSlot("1");
    setPort("4");
    setOntId("21");
    setLineProfileId("NEWAP1.2917.ACS");
    setSid("123456789");
    setNama("cm.semarang");
    setUsername("RCMG3A8848C4");
    setPassword("20260121");
    setVlan("2917");
    setErrors({});
    setOutput("");
  }

  // Reset form inputs
  function resetForm() {
    setSn("");
    setSlot("");
    setPort("");
    setOntId("");
    setLineProfileId("");
    setSid("");
    setNama("");
    setUsername("");
    setPassword(todayDefault);
    setVlan("");
    setErrors({});
    setOutput("");
  }

  // Generate Pengecekan Config
  function generatePengecekanConfig(penMode) {
    const SloPor = `${slot}/${port}`;
    const SloPorOnt = `${slot}/${port}/${ontId}`;

    let config = "";

    if (penMode === PENGECEKAN_MODES.CEK_FSP) {
      config = `show interface gpon-onu creation-information | include SN\nshow interface gpon-onu ${sn} | include`;
    } else if (penMode === PENGECEKAN_MODES.CEK_ONT_STATUS) {
      config = `show interface gpon-onu online-information\nshow interface gpon-onu ${SloPorOnt} online-information`;
    } else if (penMode === PENGECEKAN_MODES.CEK_POWER) {
      config = `show gpon-onu ${SloPorOnt} transceiver`;
    } else if (penMode === PENGECEKAN_MODES.CEK_IP) {
      config = `show gpon-onu ${SloPorOnt} iphost 1\nshow gpon-onu ${SloPorOnt} detail-information`;
    } else if (penMode === PENGECEKAN_MODES.CEK_PORT_REDAMAN) {
      config = `show gpon-onu ${SloPorOnt} transceiver\nshow interface gpon-olt 3/1\nshow interface gpon-olt ${SloPor} transceiver rx-onu-power`;
    } else if (penMode === PENGECEKAN_MODES.CEK_SSID_PASSWORD) {
      config = `show gpon-onu ${SloPorOnt} wifi information`;
    } else if (penMode === PENGECEKAN_MODES.GANTI_SSID_PASSWORD) {
      config = `config\ngpon-onu ${SloPorOnt}\nwifi-ap 1 auth mode wpa2\nwifi-ap 1 ssid-name ....\nwifi-ap 1 wpa key ….`;
    } else if (penMode === PENGECEKAN_MODES.PING_GAGAL_BNG) {
      config = `config\ngpon-onu ${SloPorOnt}\naccess-control ping mode allowwan`;
    } else if (penMode === PENGECEKAN_MODES.REBOOT) {
      config = `reboot gpon onu ${SloPorOnt} now`;
    } else if (penMode === PENGECEKAN_MODES.GANTI_LINE_PROFILE) {
      config = `config\ninterface gpon-onu ${SloPorOnt}\nline-profile-id 1`;
    } else if (penMode === PENGECEKAN_MODES.GANTI_VLAN && SloPorOnt && vlan) {
      config = `config\ngpon-onu ${SloPorOnt}\niphost 1 mode dhcp\niphost 1 vlan ${vlan}\niphost 1 service Internet\niphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1`;
    } else if (penMode === PENGECEKAN_MODES.HAPUS_IP) {
      config = `config\ngpon-onu ${SloPorOnt}\nno iphost 1`;
    } else if (penMode === PENGECEKAN_MODES.IP_STATIC) {
      config = `config\ngpon-onu ${SloPorOnt}\niphost 1 static address 10.108.21.195 mask 255.255.252.0 default-gw 10.108.20.1\nprimary-dns 202.162.220.110 secondary-dns 202.162.220.220`;
    } else if (penMode === PENGECEKAN_MODES.ENABLE_DISABLE_SSID) {
      config = `config\ngpon-onu ${SloPorOnt}\nwifi-ap 1 hidden disable\nwifi-ap 1 client max 32`;
    } else if (penMode === PENGECEKAN_MODES.FACTORY_RESET) {
      config = `factory reset gpon-onu 3/2/16 now`;
    } else if (penMode === PENGECEKAN_MODES.MISMATCH_TO_MATCH) {
      config = `config\ngpon-onu ${SloPorOnt}\nderegister`;
    } else if (penMode === PENGECEKAN_MODES.PING_OLT) {
      config = `config\ninterface gpon-olt 0/1\nont remote ping 42 8.8.8.8`;
    } else if (penMode === PENGECEKAN_MODES.REDAMAN_PORT) {
      config = `show interface gpon-olt 0/1 ddm-detail`;
    } else if (penMode === PENGECEKAN_MODES.ENABLE_REDAMAN_PORT) {
      config = `interface gpon-olt 3/1\nstorm-control dlf\ntransceiver ddm enable`;
    } else if (penMode === PENGECEKAN_MODES.ALLOWED_VLAN) {
      config = `config\ninterface gpon-olt 1/2\nswitchport trunk allowed vlan 2801,2828,2881-2891,2830\nyes`;
    } else {
      setOutput("⚠️ Silakan isi field yang diperlukan untuk pengecekan ini");
      return;
    }

    if (config) {
      setOutput(config);
    }
  }


  // Generate
  function showConfig(selectedMode) {
    const needsFull = Object.values(MODES).includes(selectedMode) && (selectedMode === MODES.V2 || selectedMode === MODES.V1 || selectedMode === MODES.CEK_IP || selectedMode === MODES.REDAMAN || selectedMode === MODES.HAPUS);
    if (needsFull && !requireAll()) {
      setOutput("⚠️ Silakan isi semua field yang wajib diisi");
      return;
    }

    const SloPor = `${slot}/${port}`;
    const SloPorOnt = `${slot}/${port}/${ontId}`;

    if (selectedMode === MODES.V2) {
      const tpl = `config

int gpon-olt ${SloPor}

create gpon-onu ${ontId} sn ${sn} line-profile-id ${lineProfileId} service-profile-id 1

quit

int gpon-onu ${SloPorOnt}

desc ${sid}-${nama}

quit

gpon-onu ${SloPorOnt}

iphost 1 mode pppoe

iphost 1 pppoe username ${username} password ${password}

iphost 1 vlan ${vlan}

iphost 1 service internet

iphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1

iphost 2 mode dhcp

iphost 2 service management

iphost 2 vlan 2989

access-control http mode allowlan

access-control telnet mode blockall

access-control ping mode allowwan

access-control https mode allowlan

end

w s
`;
      setOutput(tpl);
      return;
    }

    if (selectedMode === MODES.V1) {
      const tpl = `config

int gpon-olt ${SloPor}

create gpon-onu ${ontId} sn ${sn} line-profile-id ${lineProfileId} service-profile-id 1

quit

int gpon-onu ${SloPorOnt}

desc ${sid}-${nama}

quit

gpon-onu ${SloPorOnt}

iphost 1 mode pppoe

iphost 1 pppoe username ${username} password ${password}

iphost 1 vlan ${vlan}

iphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1

iphost 1 service internet

end

write startup-config
`;
      setOutput(tpl);
      return;
    }

    if (selectedMode === MODES.CEK_IP) {
      setOutput(`show gpon-onu ${SloPorOnt} iphost 1`);
      return;
    }

    if (selectedMode === MODES.REDAMAN) {
      setOutput(`show gpon-onu ${SloPorOnt} transceiver`);
      return;
    }

    if (selectedMode === MODES.HAPUS) {
      setOutput(`Int gpon-olt ${SloPor}\n\nno create gpon-onu ${ontId}`);
      return;
    }
  }

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6">
        {/* Header */}
        <div className="mx-auto max-w-7xl flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Config · Aktivasi · Raisecom</h1>
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

            <Field label="SN ONT" value={sn} onChange={setSn} name="sn" error={errors.sn} placeholder="e.g. RCMG3A8848C4" />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Slot" value={slot} onChange={setSlot} name="slot" error={errors.slot} placeholder="0" />
              <Field label="Port" value={port} onChange={setPort} name="port" error={errors.port} placeholder="0" />
            </div>
            <Field label="ONT ID" value={ontId} onChange={setOntId} name="ontId" error={errors.ontId} placeholder="1" />
            <Field label="Line Profile ID" value={lineProfileId} onChange={setLineProfileId} name="lineProfileId" error={errors.lineProfileId} placeholder="100" />
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
                <Radio name="option" label="Config V2 ACS" checked={selectedOption === MODES.V2} onChange={() => setSelectedOption(MODES.V2)} />
                <Radio name="option" label="Config V1" checked={selectedOption === MODES.V1} onChange={() => setSelectedOption(MODES.V1)} />
                <Radio name="option" label="Cek IP" checked={selectedOption === MODES.CEK_IP} onChange={() => setSelectedOption(MODES.CEK_IP)} />
                <Radio name="option" label="Cek Redaman" checked={selectedOption === MODES.REDAMAN} onChange={() => setSelectedOption(MODES.REDAMAN)} />
                <Radio name="option" label="Hapus Config" checked={selectedOption === MODES.HAPUS} onChange={() => setSelectedOption(MODES.HAPUS)} />
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-200">Pengecekan</h2>
              <div className="space-y-1.5">
                <Radio name="option" label="Cek FSP" checked={selectedOption === PENGECEKAN_MODES.CEK_FSP} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_FSP)} />
                <Radio name="option" label="Cek ONT Status" checked={selectedOption === PENGECEKAN_MODES.CEK_ONT_STATUS} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_ONT_STATUS)} />
                <Radio name="option" label="Cek Power" checked={selectedOption === PENGECEKAN_MODES.CEK_POWER} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_POWER)} />
                <Radio name="option" label="Cek IP" checked={selectedOption === PENGECEKAN_MODES.CEK_IP} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_IP)} />
                <Radio name="option" label="Cek Port/Redaman" checked={selectedOption === PENGECEKAN_MODES.CEK_PORT_REDAMAN} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_PORT_REDAMAN)} />
                <Radio name="option" label="Cek SSID & Password" checked={selectedOption === PENGECEKAN_MODES.CEK_SSID_PASSWORD} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_SSID_PASSWORD)} />
                <Radio name="option" label="Ganti SSID/Password ONT" checked={selectedOption === PENGECEKAN_MODES.GANTI_SSID_PASSWORD} onChange={() => setSelectedOption(PENGECEKAN_MODES.GANTI_SSID_PASSWORD)} />
                <Radio name="option" label="Jika Test Ping Gagal di BNG" checked={selectedOption === PENGECEKAN_MODES.PING_GAGAL_BNG} onChange={() => setSelectedOption(PENGECEKAN_MODES.PING_GAGAL_BNG)} />
                <Radio name="option" label="Reboot" checked={selectedOption === PENGECEKAN_MODES.REBOOT} onChange={() => setSelectedOption(PENGECEKAN_MODES.REBOOT)} />
                <Radio name="option" label="Ganti Line-Profile" checked={selectedOption === PENGECEKAN_MODES.GANTI_LINE_PROFILE} onChange={() => setSelectedOption(PENGECEKAN_MODES.GANTI_LINE_PROFILE)} />
                <Radio name="option" label="Ganti VLAN" checked={selectedOption === PENGECEKAN_MODES.GANTI_VLAN} onChange={() => setSelectedOption(PENGECEKAN_MODES.GANTI_VLAN)} />
                <Radio name="option" label="Hapus IP" checked={selectedOption === PENGECEKAN_MODES.HAPUS_IP} onChange={() => setSelectedOption(PENGECEKAN_MODES.HAPUS_IP)} />
                <Radio name="option" label="IP Static" checked={selectedOption === PENGECEKAN_MODES.IP_STATIC} onChange={() => setSelectedOption(PENGECEKAN_MODES.IP_STATIC)} />
                <Radio name="option" label="Enable/Disable SSID" checked={selectedOption === PENGECEKAN_MODES.ENABLE_DISABLE_SSID} onChange={() => setSelectedOption(PENGECEKAN_MODES.ENABLE_DISABLE_SSID)} />
                <Radio name="option" label="Factory Reset ONT" checked={selectedOption === PENGECEKAN_MODES.FACTORY_RESET} onChange={() => setSelectedOption(PENGECEKAN_MODES.FACTORY_RESET)} />
                <Radio name="option" label="Mismatch to Match" checked={selectedOption === PENGECEKAN_MODES.MISMATCH_TO_MATCH} onChange={() => setSelectedOption(PENGECEKAN_MODES.MISMATCH_TO_MATCH)} />
                <Radio name="option" label="PING di OLT" checked={selectedOption === PENGECEKAN_MODES.PING_OLT} onChange={() => setSelectedOption(PENGECEKAN_MODES.PING_OLT)} />
                <Radio name="option" label="Redaman Port" checked={selectedOption === PENGECEKAN_MODES.REDAMAN_PORT} onChange={() => setSelectedOption(PENGECEKAN_MODES.REDAMAN_PORT)} />
                <Radio name="option" label="Enable Redaman Port" checked={selectedOption === PENGECEKAN_MODES.ENABLE_REDAMAN_PORT} onChange={() => setSelectedOption(PENGECEKAN_MODES.ENABLE_REDAMAN_PORT)} />
                <Radio name="option" label="Allowed VLAN" checked={selectedOption === PENGECEKAN_MODES.ALLOWED_VLAN} onChange={() => setSelectedOption(PENGECEKAN_MODES.ALLOWED_VLAN)} />
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