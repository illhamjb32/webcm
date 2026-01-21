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
    RUN_STATE_BY_SN: "run_state_by_sn",
    RUN_STATE_FSP_ID: "run_state_fsp_id",
    RUN_STATE_BY_DESC: "run_state_by_desc",
    CEK_IP_PENG: "cek_ip_peng",
    CEK_POWER: "cek_power",
    CEK_GAMAS: "cek_gamas",
    CEK_PORT_COLOK: "cek_port_colok",
    CEK_MAC: "cek_mac",
    CEK_SERVICE_PORT: "cek_service_port",
    CEK_CONFIG: "cek_config",
    CEK_ONT_UNREG: "cek_ont_unreg",
    PING_ONT: "ping_ont",
    CEK_TRAFFIC: "cek_traffic",
    CEK_LOG: "cek_log",
    REBOOT: "reboot",
    CEK_IGMP: "cek_igmp",
    CEK_BNG: "cek_bng",
    GANTI_SSID: "ganti_ssid",
    FACTORY_RESET: "factory_reset",
    VLAN_LAIN: "vlan_lain",
    CEK_SSID_DEVICE: "cek_ssid_device",
  };

  // Single unified selected option across both Aktivasi and Pengecekan
  const [selectedOption, setSelectedOption] = useState(MODES.V2);

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
  }, [selectedOption, sn, frame, slot, port, ontId, sid, vlan]);

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

  // Dummy data
  function loadDummyData() {
    setSn("4857544399C888AD");
    setFrame("1");
    setSlot("2");
    setPort("3");
    setOntId("4");
    setLineProfile("AUTOPROV.PPPOE");
    setSid("123456789");
    setNama("cm.semarang");
    setUsername("4857544399C888AD");
    setPassword("20260121");
    setVlan("2923");
    setErrors({});
    setOutput("");
  }
//
function resetForm() {
  setSn("");
  setFrame("");
  setSlot("");
  setPort("");
  setOntId("");
  setLineProfile("");
  setSid("");
  setNama("");
  setUsername("");
  setPassword(todayDefault); // reset to default password (YYYYMMDD)
  setVlan("");
  setErrors({});
  setOutput("");
}

  // Generate
  function generatePengecekanConfig(penMode) {
    const FraSlo = `${frame}/${slot}`;
    const FraSloPor = `${frame}/${slot}/${port}`;

    let config = "";

    if (penMode === PENGECEKAN_MODES.RUN_STATE_BY_SN && sn) {
      config = `display ont info by-sn ${sn}`;
    } else if (penMode === PENGECEKAN_MODES.RUN_STATE_FSP_ID && frame && slot && port && ontId) {
      config = `display ont info ${frame} ${slot} ${port} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.RUN_STATE_BY_DESC && sid) {
      config = `display ont info by-desc ${sid}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_IP_PENG && FraSloPor && ontId) {
      config = `display ont wan-info ${FraSloPor} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_POWER && FraSlo && port && ontId) {
      config = `config\ninterface gpon ${FraSlo}\ndisplay ont optical-info ${port} ${ontId}\ndisplay ont optical-info ${port} all\ndisplay ont info option run-state ${frame} ${slot} ${port} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_GAMAS && frame && slot) {
      config = `display ont info ${frame} ${slot} all\ndisplay ont info summary ${frame}/${slot}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_PORT_COLOK && FraSlo && port) {
      config = `config\ninterface gpon ${FraSlo}\ndisplay ont port state ${port} all eth-port all`;
    } else if (penMode === PENGECEKAN_MODES.CEK_MAC && FraSloPor && ontId) {
      config = `display mac-address ont ${FraSloPor} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_SERVICE_PORT && FraSloPor && ontId) {
      config = `display service-port port ${FraSloPor} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_CONFIG && FraSloPor && ontId) {
      config = `display current-configuration ont ${FraSloPor} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_ONT_UNREG) {
      config = `display ont autofind all`;
    } else if (penMode === PENGECEKAN_MODES.PING_ONT && FraSlo && port && ontId) {
      config = `config\ninterface gpon ${FraSlo}\nont remote-ping ${port} ${ontId} ip-address 8.8.8.8`;
    } else if (penMode === PENGECEKAN_MODES.CEK_TRAFFIC && FraSlo && port && ontId) {
      config = `config\ninterface gpon ${FraSlo}\ndisplay ont traffic ${port} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_LOG && FraSlo && port && ontId) {
      config = `config\ninterface gpon ${FraSlo}\ndisplay ont register-info ${port} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.REBOOT && FraSlo && port && ontId) {
      config = `config\ninterface gpon ${FraSlo}\nont reset ${port} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_IGMP) {
      config = `display current-configuration | include igmp`;
    } else if (penMode === PENGECEKAN_MODES.CEK_BNG) {
      config = `show interfaces descriptions\nshow arp interface xe-x/x/x.2886 | match xx:xx (mac address)`;
    } else if (penMode === PENGECEKAN_MODES.GANTI_SSID) {
      config = `- ONU Details\n- Maintain ONT`;
    } else if (penMode === PENGECEKAN_MODES.FACTORY_RESET && FraSlo && port && ontId) {
      config = `config\ninterface gpon ${FraSlo}\nont factory-setting-restore ${port} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.VLAN_LAIN && FraSlo && port && ontId && vlan) {
      config = `config\ninterface gpon ${FraSlo}\nont ipconfig ${port} ${ontId} dhcp vlan ${vlan} priority 0`;
    } else if (penMode === PENGECEKAN_MODES.CEK_SSID_DEVICE && FraSlo && port && ontId) {
      config = `display ont wlan-info ${FraSlo} ${port} ${ontId}\ndisplay ont-learned-mac ${FraSlo} ${port} ${ontId} wlan`;
    } else {
      setOutput("⚠️ Silakan isi field yang diperlukan untuk pengecekan ini");
      return;
    }

    if (config) {
      setOutput(config);
    }
  }

  function showConfig(selectedMode) {
    const needsFull = Object.values(MODES).includes(selectedMode) && (selectedMode === MODES.V2 || selectedMode === MODES.V1 || selectedMode === MODES.CEK_IP || selectedMode === MODES.REDAMAN || selectedMode === MODES.HAPUS);
    if (needsFull && !requireAll()) {
      setOutput("⚠️ Silakan isi semua field yang wajib diisi");
      return;
    }

    const FraSlo = `${frame}/${slot}`;
    const FraSloPor = `${frame}/${slot}/${port}`;

    if (selectedMode === MODES.V2) {
      const tpl = `config
      
interface gpon ${FraSlo}

ont add ${port} ${ontId} sn-auth ${sn} omci ont-lineprofile-name ${lineProfile} ont-srvprofile-name ${lineProfile} desc ${sid}-${nama}

ont ipconfig ${port} ${ontId} pppoe vlan ${vlan} priority 0 user-account username ${username} password ${password}

ont internet-config ${port} ${ontId} ip-index 0

ont wan-config ${port} ${ontId} ip-index 0 profile-name ICONNET.AUTOPROV 

ont policy-route-config ${port} ${ontId} profile-name ICONNET.AUTOPROV

ont port route ${port} ${ontId} eth 1 enable

ont port route ${port} ${ontId} eth 2 enable

ont ipconfig ${port} ${ontId} ip-index 2 dhcp vlan 2989 priority 5

ont tr069-server-config ${port} ${ontId}  profile-name ACS

ont wan-config ${port} ${ontId} ip-index 2 profile-name ACS


quit

service-port vlan ${vlan} gpon ${FraSloPor} ont ${ontId} gemport 1 multi-service user-vlan ${vlan} tag-transform translate

service-port vlan 2989 gpon ${FraSloPor} ont ${ontId} gemport 2 multi-service user-vlan 2989 tag-transform translate


quit

save\n`;
      setOutput(tpl);
      return;
    }

    if (selectedMode === MODES.V1) {
      const tpl = `conf

int gpon ${frame}/${slot}

ont add ${port} ${ontId} sn-auth ${sn} omci ont-lineprofile-name ${lineProfile} ont-srvprofile-name ${lineProfile} desc ${sid}-${nama}

ont ipconfig ${port} ${ontId} pppoe vlan ${vlan} priority 0 user-account username ${username} password ${password}

ont internet-config ${port} ${ontId} ip-index 0

ont wan-config ${port} ${ontId} ip-index 0 profile-name ICONNET.AUTOPROV

ont policy-route-config ${port} ${ontId} profile-name ICONNET.AUTOPROV

ont port route ${port} ${ontId} eth 1 enable

ont port route ${port} ${ontId} eth 2 enable

quit

service-port vlan ${vlan} gpon ${FraSloPor} ont ${ontId} gemport 1 multi-service user-vlan ${vlan} tag-transform translate

save\n`;
      setOutput(tpl);
      return;
    }

    if (selectedMode === MODES.REDAMAN) {
      setOutput(`display ont info option run-state ${frame} ${slot} ${port} ${ontId}`);
      return;
    }

    if (selectedMode === MODES.CEK_IP) {
      setOutput(`display ont wan info ${frame}/${slot} ${port} ${ontId}`);
      return;
    }

    if (selectedMode === MODES.HAPUS) {
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Input Data</h2>
              <button
                className="rounded-lg bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 text-xs"
                onClick={loadDummyData}
              >
                Data Dummy
              </button>
            </div>

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

            <button
              className="mt-2 w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2"
              onClick={() => showConfig(selectedOption)}
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
                <Radio name="option" label="Run State (SN)" checked={selectedOption === PENGECEKAN_MODES.RUN_STATE_BY_SN} onChange={() => setSelectedOption(PENGECEKAN_MODES.RUN_STATE_BY_SN)} />
                <Radio name="option" label="Run State (F/S/P/ID)" checked={selectedOption === PENGECEKAN_MODES.RUN_STATE_FSP_ID} onChange={() => setSelectedOption(PENGECEKAN_MODES.RUN_STATE_FSP_ID)} />
                <Radio name="option" label="Run State (SID)" checked={selectedOption === PENGECEKAN_MODES.RUN_STATE_BY_DESC} onChange={() => setSelectedOption(PENGECEKAN_MODES.RUN_STATE_BY_DESC)} />
                <Radio name="option" label="Cek IP" checked={selectedOption === PENGECEKAN_MODES.CEK_IP_PENG} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_IP_PENG)} />
                <Radio name="option" label="Cek Power" checked={selectedOption === PENGECEKAN_MODES.CEK_POWER} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_POWER)} />
                <Radio name="option" label="Cek GAMAS" checked={selectedOption === PENGECEKAN_MODES.CEK_GAMAS} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_GAMAS)} />
                <Radio name="option" label="Cek Port Colok" checked={selectedOption === PENGECEKAN_MODES.CEK_PORT_COLOK} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_PORT_COLOK)} />
                <Radio name="option" label="Cek MAC" checked={selectedOption === PENGECEKAN_MODES.CEK_MAC} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_MAC)} />
                <Radio name="option" label="Cek Service Port" checked={selectedOption === PENGECEKAN_MODES.CEK_SERVICE_PORT} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_SERVICE_PORT)} />
                <Radio name="option" label="Cek Konfigurasi" checked={selectedOption === PENGECEKAN_MODES.CEK_CONFIG} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_CONFIG)} />
                <Radio name="option" label="Cek ONT Unreg" checked={selectedOption === PENGECEKAN_MODES.CEK_ONT_UNREG} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_ONT_UNREG)} />
                <Radio name="option" label="Ping ONT" checked={selectedOption === PENGECEKAN_MODES.PING_ONT} onChange={() => setSelectedOption(PENGECEKAN_MODES.PING_ONT)} />
                <Radio name="option" label="Cek Traffic" checked={selectedOption === PENGECEKAN_MODES.CEK_TRAFFIC} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_TRAFFIC)} />
                <Radio name="option" label="Cek Log" checked={selectedOption === PENGECEKAN_MODES.CEK_LOG} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_LOG)} />
                <Radio name="option" label="Reboot" checked={selectedOption === PENGECEKAN_MODES.REBOOT} onChange={() => setSelectedOption(PENGECEKAN_MODES.REBOOT)} />
                <Radio name="option" label="Cek IGMP" checked={selectedOption === PENGECEKAN_MODES.CEK_IGMP} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_IGMP)} />
                <Radio name="option" label="Cek BNG" checked={selectedOption === PENGECEKAN_MODES.CEK_BNG} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_BNG)} />
                <Radio name="option" label="Ganti SSID/Password" checked={selectedOption === PENGECEKAN_MODES.GANTI_SSID} onChange={() => setSelectedOption(PENGECEKAN_MODES.GANTI_SSID)} />
                <Radio name="option" label="Factory Reset" checked={selectedOption === PENGECEKAN_MODES.FACTORY_RESET} onChange={() => setSelectedOption(PENGECEKAN_MODES.FACTORY_RESET)} />
                <Radio name="option" label="VLAN Lain" checked={selectedOption === PENGECEKAN_MODES.VLAN_LAIN} onChange={() => setSelectedOption(PENGECEKAN_MODES.VLAN_LAIN)} />
                <Radio name="option" label="Cek SSID & Device" checked={selectedOption === PENGECEKAN_MODES.CEK_SSID_DEVICE} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_SSID_DEVICE)} />
              </div>
            </div>
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
