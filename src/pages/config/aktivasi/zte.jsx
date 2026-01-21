import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ZTEAktivasi() {
  const navigate = useNavigate();

  // Route guard
  useEffect(() => {
    if (!sessionStorage.getItem("auth")) navigate("/");
  }, [navigate]);

  // Dark mode
  const [theme, setTheme] = useState("system");
  useEffect(() => {
    const saved = localStorage.getItem("cm-theme");
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  const isSystemDark = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const resolvedDark = theme === "dark" || (theme === "system" && isSystemDark());

  // Inputs (ZTE: still has Frame; no Line Profile)
  const [sn, setSn] = useState("");
  const [frame, setFrame] = useState("");
  const [slot, setSlot] = useState("");
  const [port, setPort] = useState("");
  const [ontId, setOntId] = useState("");
  const [sid, setSid] = useState("");
  const [nama, setNama] = useState("");
  const [username, setUsername] = useState("");
  const [vlan, setVlan] = useState("");

  // Default password YYYYMMDD
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

  // Mode + OLT Type
  const MODES = { V1: "v1", V2: "v2", CEK_IP: "cekip", REDAMAN: "cekredaman", HAPUS: "hapus" };
  const [mode, setMode] = useState(MODES.V1);
  const TYPES = { C320: "c320", C610: "c610" };
  const [oltType, setOltType] = useState(TYPES.C320);

  // Pengecekan modes
  const PENGECEKAN_MODES = {
    CEK_ONT_STATUS: "cek_ont_status",
    CEK_REDAMAN: "cek_redaman",
    CEK_WAN_SERVICE: "cek_wan_service",
    CEK_GAMAS: "cek_gamas",
    CEK_LAN_PORT: "cek_lan_port",
    CEK_VERSION: "cek_version",
    REBOOT: "reboot",
    CEK_MAC_ADDRESS: "cek_mac_address",
    CEK_IGMP: "cek_igmp",
    CEK_BNG: "cek_bng",
    LOCK_UNLOCK_PORT: "lock_unlock_port",
    RESET_FACTORY: "reset_factory",
    CEK_VLAN: "cek_vlan",
    CEK_UPTIME_OLT: "cek_uptime_olt",
    CEK_RUNNING_CONFIG: "cek_running_config",
  };

  // Single unified selected option across both Aktivasi and Pengecekan
  const [selectedOption, setSelectedOption] = useState(MODES.V1);

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
  }, [selectedOption, sn, frame, slot, port, ontId, sid, nama, vlan, username, password, oltType]);

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
    setSn("ZTEGD1D8A9C8");
    setFrame("1");
    setSlot("1");
    setPort("2");
    setOntId("59");
    setSid("010305360589");
    setNama("CBN.Tati.ferawati");
    setUsername("ZTEGD1D8A9C8");
    setPassword("20230104");
    setVlan("2920");
    setErrors({});
    setOutput("");
  }

  // Generate Pengecekan Config
  function generatePengecekanConfig(penMode) {
    const FSP_COLON_ONT = `${frame}/${slot}/${port}:${ontId}`;
    const FSP = `${frame}/${slot}/${port}`;

    let config = "";

    if (penMode === PENGECEKAN_MODES.CEK_ONT_STATUS) {
      config = `show gpon onu by sn ${sn}\nshow gpon onu detail-info gpon-onu-${FSP_COLON_ONT}\nshow gpon ont state gpon-olt-${FSP} ${ontId}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_REDAMAN) {
      config = `show pon power attenuation gpon-onu-${FSP_COLON_ONT}\nshow pon power olt-rx gpon-olt-${FSP}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_WAN_SERVICE) {
      config = `show gpon remote-onu wan-ip gpon-onu-${FSP_COLON_ONT}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_GAMAS) {
      config = `show gpon onu state gpon-olt-${FSP}\nshow pon onu information gpon-olt-${FSP}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_LAN_PORT) {
      config = `show gpon remote-onu interface eth gpon-onu-${FSP_COLON_ONT}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_VERSION) {
      config = `show gpon remote-onu equip gpon-onu-${FSP_COLON_ONT}`;
    } else if (penMode === PENGECEKAN_MODES.REBOOT) {
      config = `configure terminal\npon-onu-mng gpon-onu-${FSP_COLON_ONT}\nreboot`;
    } else if (penMode === PENGECEKAN_MODES.CEK_MAC_ADDRESS) {
      config = `show mac vlan ${vlan}\nshow mac gpon olt gpon-olt-${FSP}\nshow mac gpon onu gpon-onu-${FSP_COLON_ONT}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_IGMP) {
      config = `show igmp dynamic-member sn ${sn}`;
    } else if (penMode === PENGECEKAN_MODES.CEK_BNG) {
      config = `show interfaces descriptions\nshow arp interface xe-x/x/x.2886 | match xx:xx (mac address)`;
    } else if (penMode === PENGECEKAN_MODES.LOCK_UNLOCK_PORT) {
      config = `configure terminal\npon-onu-mng gpon-onu-${FSP_COLON_ONT}\ninterface eth eth_01 state lock\ninterface eth eth_01 state unlock`;
    } else if (penMode === PENGECEKAN_MODES.RESET_FACTORY) {
      config = `configure terminal\npon-onu-mng gpon-onu-${FSP_COLON_ONT}\nrestore factory`;
    } else if (penMode === PENGECEKAN_MODES.CEK_VLAN) {
      config = `show vlan summary`;
    } else if (penMode === PENGECEKAN_MODES.CEK_UPTIME_OLT) {
      config = `show system-group`;
    } else if (penMode === PENGECEKAN_MODES.CEK_RUNNING_CONFIG) {
      config = `show running-config interface gpon-onu-${FSP_COLON_ONT}\nshow onu running-config gpon-onu-${FSP_COLON_ONT}`;
    } else {
      setOutput("⚠️ Silakan isi field yang diperlukan untuk pengecekan ini");
      return;
    }

    if (config) {
      setOutput(config);
    }
  }

  // Helpers
  const FSP_COLON_ONT = `${frame}/${slot}/${port}:${ontId}`; // F/S/P:ONT_ID
  const FSP = `${frame}/${slot}/${port}`; // F/S/P
  // Reset form inputs
  function resetForm() {
    setSn("");
    setFrame("");
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

  // Build
  function showConfig(selectedMode) {
    const needsFull = Object.values(MODES).includes(selectedMode) && (selectedMode === MODES.V1 || selectedMode === MODES.V2 || selectedMode === MODES.REDAMAN || selectedMode === MODES.CEK_IP || selectedMode === MODES.HAPUS);
    if (needsFull && !requireAll()) {
      setOutput("⚠️ Silakan isi semua field yang wajib diisi");
      return;
    }

    if (selectedMode === MODES.V1) {
      if (oltType === TYPES.C320) {
        const [fsp, onuId] = String(FSP_COLON_ONT).split(":");

        const tpl = [
          "config terminal",
          `interface gpon-olt_${fsp}`,
          `onu ${onuId} type ZTEG-F609 sn ${sn}`,
          "exit",
          `interface gpon-onu_${fsp}:${onuId}`,
          `description ${sid}-${nama}`,
          "sn-bind enable sn",
          "tcont 1 name HSI profile PPPOE",
          "gemport 1 name HSI tcont 1",
          `service-port 1 vport 1 user-vlan ${vlan} vlan ${vlan}`,
          "exit",
          `pon-onu-mng gpon-onu_${fsp}:${onuId}`,
          `service HSI gemport 1 vlan ${vlan}`,
          `wan-ip 1 mode pppoe username ${username} password ${password} vlan-profile vlan${vlan} host 1`,
          `vlan port eth_0/1 mode tag vlan ${vlan}`,
          `vlan port eth_0/2 mode tag vlan ${vlan}`,
          "wan 1 ssid 1 ethuni 1,2 service internet host 1",
          "end",
          "write\n",
        ].join("\n\n");

        setOutput(tpl);
        return;
      }

      if (oltType === TYPES.C610) {
        const tpl = [
          "config terminal",
          `interface gpon_olt-${FSP}`,
          `onu ${ontId} type ZTEG-F609 sn ${sn}`,
          "exit",
          `interface gpon_onu-${FSP_COLON_ONT}`,
          `description ${sid}-${nama}`,
          "tcont 1 name HSI profile PPPOE",
          "gemport 1 name HSI tcont 1",
          "exit",
          `interface vport-${FSP}.${ontId}:1`,
          `service-port 1 user-vlan ${vlan} vlan ${vlan}`,
          "exit",
          `pon-onu-mng gpon_onu-${FSP_COLON_ONT}`,
          `service HSI gemport 1 vlan ${vlan}`,
          `wan-ip ipv4 mode pppoe username ${username} password ${password} vlan-profile vlan${vlan} host 1`,
          `vlan port eth_0/1 mode tag vlan ${vlan}`,
          `vlan port eth_0/2 mode tag vlan ${vlan}`,
          "wan 1 ssid 1 ethuni 1,2 service internet host 1",
          "end",
        ].join("\n\n");

        setOutput(tpl);
        return;
      }
    }

    if (selectedMode === MODES.V2) {
      if (oltType === TYPES.C320) {
        const [fsp, onuId] = String(FSP_COLON_ONT).split(":");

        const tpl = [
          "configure terminal",
          `interface gpon-onu_${fsp}:${onuId}`,
          `description ${sid}-${nama}`,
          "sn-bind enable sn",
          "Tcont 1 name HIS Profile PPPOE",
          "tcont 2 name ACS profile ACS-v2",
          "gemport 1 name HIS tcont 1",
          "gemport 2 name ACS tcont 2",
          `service-port 1 vport 1 user-vlan 2920 vlan 2920`,
          `service-port 2 vport 2 user-vlan 2989 vlan 2989`,
          "exit",
          `pon-onu-mng gpon-onu_${fsp}:${onuId}`,
          "service HIS gemport 1 vlan 2920",
          "service ACS gemport 2 vlan 2989",
          `wan-ip 1 mode pppoe username ${username} password ${password} vlan-profile vlan2920 host 1`,
          "wan-ip 2 mode dhcp vlan-profile vlan2989 host 2",
          "vlan port eth_0/1 mode tag vlan 2920",
          "vlan port eth_0/2 mode tag vlan 2920",
          "wan 1 ssid 1 ethuni 1,2 service internet host 1",
          "tr069-mgmt 1 state unlock",
          "tr069-mgmt 1 acs http://192.168.30.5:5000/acs/ validate basic username plniconplus password PlnIconPlus!2025",
          "tr069-mgmt 1 tag pri 5 vlan 2989",
          "end",
          "write\n",
        ].join("\n\n");

        setOutput(tpl);
        return;
      }

      if (oltType === TYPES.C610) {
        const tpl = [
          "config t",
          `interface gpon_olt-${FSP}`,
          `onu ${ontId} type ZTEG-F609 sn ${sn}`,
          "exit",
          `interface gpon_onu-${FSP_COLON_ONT}`,
          `description ${sid}-${nama}`,
          "tcont 1 name HSI profile PPPOE",
          "gemport 1 name HSI tcont 1",
          "exit",
          `interface vport-${FSP}.${ontId}:1`,
          `service-port 1 user-vlan ${vlan} vlan ${vlan}`,
          "exit",
          `pon-onu-mng gpon_onu-${FSP_COLON_ONT}`,
          `service HSI gemport 1 vlan ${vlan}`,
          `wan-ip ipv4 mode pppoe username ${username} password ${password} vlan-profile vlan${vlan} host 1`,
          `vlan port eth_0/1 mode tag vlan ${vlan}`,
          `vlan port eth_0/2 mode tag vlan ${vlan}`,
          "wan 1 ssid 1 ethuni 1,2 service internet host 1",
          "end",
          "write",
        ].join("\n\n");

        setOutput(tpl);
        return;
      }
    }

    if (selectedMode === MODES.REDAMAN) {
      setOutput(`show pon power onu-rx gpon-onu_${FSP_COLON_ONT}`);
      return;
    }

    if (selectedMode === MODES.CEK_IP) {
      setOutput(`show gpon remote-onu wan-ip gpon-onu_${FSP_COLON_ONT}`);
      return;
    }

    if (selectedMode === MODES.HAPUS) {
      const tpl = [
        "Conf t",
        `Interface gpon-olt_${FSP}`,
        `No onu ${ontId}`,
        "end",
      ].join("\n\n");
      setOutput(tpl);
      return;
    }
  }

  return (
    <div className={resolvedDark ? "dark" : ""}>
      <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6">
        {/* Header */}
        <div className="mx-auto max-w-7xl flex items-center justify-between mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight">Config · Aktivasi · ZTE</h1>
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

            <Field label="SN ONT" value={sn} onChange={setSn} name="sn" error={errors.sn} placeholder="e.g. ZTEGD1D8A9C8" />
            <div className="grid grid-cols-3 gap-2">
              <Field label="Frame" value={frame} onChange={setFrame} name="frame" error={errors.frame} placeholder="0" />
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

          {/* Card 2: Mode + OLT type */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4 sm:p-5 shadow-sm overflow-y-auto flex flex-col">
            <div className="mb-4">
              <label className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">Tipe OLT</label>
              <select value={oltType} onChange={(e) => setOltType(e.target.value)} className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-3 py-2 text-sm">
                <option value={TYPES.C320}>C320</option>
                <option value={TYPES.C610}>C610</option>
              </select>
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-200">Aktivasi</h2>
              <div className="space-y-1.5 mb-4 pb-4 border-b border-slate-300 dark:border-slate-700">
                <Radio name="option" label="Config V2" checked={selectedOption === MODES.V2} onChange={() => setSelectedOption(MODES.V2)} />
                <Radio name="option" label="Config V1" checked={selectedOption === MODES.V1} onChange={() => setSelectedOption(MODES.V1)} />
                <Radio name="option" label="Cek IP" checked={selectedOption === MODES.CEK_IP} onChange={() => setSelectedOption(MODES.CEK_IP)} />
                <Radio name="option" label="Cek Redaman" checked={selectedOption === MODES.REDAMAN} onChange={() => setSelectedOption(MODES.REDAMAN)} />
                <Radio name="option" label="Hapus Config" checked={selectedOption === MODES.HAPUS} onChange={() => setSelectedOption(MODES.HAPUS)} />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-semibold mb-3 text-slate-700 dark:text-slate-200">Pengecekan</h2>
              <div className="space-y-1.5">
                <Radio name="option" label="Cek ONT Status" checked={selectedOption === PENGECEKAN_MODES.CEK_ONT_STATUS} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_ONT_STATUS)} />
                <Radio name="option" label="Cek Redaman" checked={selectedOption === PENGECEKAN_MODES.CEK_REDAMAN} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_REDAMAN)} />
                <Radio name="option" label="Cek WAN Service" checked={selectedOption === PENGECEKAN_MODES.CEK_WAN_SERVICE} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_WAN_SERVICE)} />
                <Radio name="option" label="Cek GAMAS" checked={selectedOption === PENGECEKAN_MODES.CEK_GAMAS} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_GAMAS)} />
                <Radio name="option" label="Cek LAN Port" checked={selectedOption === PENGECEKAN_MODES.CEK_LAN_PORT} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_LAN_PORT)} />
                <Radio name="option" label="Cek Version" checked={selectedOption === PENGECEKAN_MODES.CEK_VERSION} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_VERSION)} />
                <Radio name="option" label="Reboot" checked={selectedOption === PENGECEKAN_MODES.REBOOT} onChange={() => setSelectedOption(PENGECEKAN_MODES.REBOOT)} />
                <Radio name="option" label="Cek MAC Address" checked={selectedOption === PENGECEKAN_MODES.CEK_MAC_ADDRESS} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_MAC_ADDRESS)} />
                <Radio name="option" label="Cek IGMP" checked={selectedOption === PENGECEKAN_MODES.CEK_IGMP} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_IGMP)} />
                <Radio name="option" label="Cek BNG" checked={selectedOption === PENGECEKAN_MODES.CEK_BNG} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_BNG)} />
                <Radio name="option" label="Lock/Unlock Port LAN" checked={selectedOption === PENGECEKAN_MODES.LOCK_UNLOCK_PORT} onChange={() => setSelectedOption(PENGECEKAN_MODES.LOCK_UNLOCK_PORT)} />
                <Radio name="option" label="Reset Factory ONT" checked={selectedOption === PENGECEKAN_MODES.RESET_FACTORY} onChange={() => setSelectedOption(PENGECEKAN_MODES.RESET_FACTORY)} />
                <Radio name="option" label="Cek VLAN" checked={selectedOption === PENGECEKAN_MODES.CEK_VLAN} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_VLAN)} />
                <Radio name="option" label="Cek Uptime OLT" checked={selectedOption === PENGECEKAN_MODES.CEK_UPTIME_OLT} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_UPTIME_OLT)} />
                <Radio name="option" label="Cek Running Config" checked={selectedOption === PENGECEKAN_MODES.CEK_RUNNING_CONFIG} onChange={() => setSelectedOption(PENGECEKAN_MODES.CEK_RUNNING_CONFIG)} />
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
