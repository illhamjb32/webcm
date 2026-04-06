import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WarningBanner from "../../components/WarningBanner";

export default function ZteMigrasi() {
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
  const [snList, setSnList] = useState("");
  const [compareSNList, setCompareSNList] = useState("");
  
  // ===== GPON SFP PARSING =====
  const [gponSfp, setGponSfp] = useState("");
  const [parsedGpon, setParsedGpon] = useState({ F: "", S: "", P: "", ID: "", sn: "" });

  // ===== MULTIPLE MODE STATES =====
  const [globalConfig, setGlobalConfig] = useState("");
  const [oltType, setOltType] = useState("");
  const [selectedSNs, setSelectedSNs] = useState([]);
  const [savedConfigs, setSavedConfigs] = useState({});

  // Parse GPON SFP input
  const handleGponSfpChange = (value) => {
    setGponSfp(value);
    // Parse format like: gpon-onu_1/2/2:1 enable ZTEGC6910AFD
    const regex = /gpon-onu_([0-9]+)\/([0-9]+)\/([0-9]+):([0-9]+)(?:\s+enable\s+([A-Z0-9]+))?/i;
    const match = value.match(regex);
    
    if (match) {
      setParsedGpon({
        F: match[1] || "",
        S: match[2] || "",
        P: match[3] || "",
        ID: match[4] || "",
        sn: match[5] || ""
      });
    } else {
      setParsedGpon({ F: "", S: "", P: "", ID: "", sn: "" });
    }
  };

  // ===== MODE =====
  const [mode, setMode] = useState("single");
  const [multipleViewMode, setMultipleViewMode] = useState("all");

  // ===== FILE STATES (UI ONLY) =====
  const [uploadedFile, setUploadedFile] = useState(null);
  const [compareBeforeFile, setCompareBeforeFile] = useState(null);
  const [compareAfterFile, setCompareAfterFile] = useState(null);

  // ===== OUTPUT (UI ONLY) =====
  const [output, setOutput] = useState("");
  const [compareResult, setCompareResult] = useState("");
  const [copied, setCopied] = useState(false);

  // ===== BANNER =====
  const [showBanner, setShowBanner] = useState(true);
  const handleBannerClose = () => setShowBanner(false);

  const detectOltTypeFromFileName = (fileName) => {
    if (!fileName) return "";

    const upperName = fileName.toUpperCase();

    if (/(^|[^0-9])C?320([^0-9]|$)/.test(upperName)) return "C320";
    if (/(^|[^0-9])C?610([^0-9]|$)/.test(upperName)) return "C610";

    return "";
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && (file.type === "text/plain" || file.name.endsWith(".txt"))) {
      const detectedType = detectOltTypeFromFileName(file.name);
      if (!detectedType) {
        alert("nama OLT salah tipe tidak ditemukan nama olt");
        setUploadedFile(null);
        setGlobalConfig("");
        setOltType("");
        return;
      }
      setOltType(detectedType);

      const reader = new FileReader();
      reader.onload = (event) => {
        setGlobalConfig(event.target.result);
      };
      reader.readAsText(file);
      setUploadedFile(file);
    } else {
      if (file) {
        alert("File harus berupa .txt");
      }
      setUploadedFile(file || null);
    }
  };

  const handleCompareFileUpload = (e, isAfter = false) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const detectedType = detectOltTypeFromFileName(file.name);
      if (!detectedType) {
        alert("nama OLT salah tipe tidak ditemukan nama olt");
        return;
      }

      if (oltType && oltType !== detectedType) {
        alert("Tipe OLT file BEFORE dan AFTER berbeda");
        return;
      }

      setOltType(detectedType);
    }

    if (isAfter) setCompareAfterFile(file || null);
    else setCompareBeforeFile(file || null);
  };

  const handleCopy = () => {
    const textToCopy = mode === "compare" ? compareResult : output;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }
  };

  const clearAllData = () => {
    setLineProfile("");
    setServiceProfile("");
    setVlan("");
    setIphostRaw("");
    setSnList("");
    setCompareSNList("");
    setGponSfp("");
    setParsedGpon({ F: "", S: "", P: "", ID: "", sn: "" });
    setUploadedFile(null);
    setCompareBeforeFile(null);
    setCompareAfterFile(null);
    setOutput("");
    setCompareResult("");
    setGlobalConfig("");
    setOltType("");
    setSelectedSNs([]);
  };

  // Generate Single ACS Config
  const handleGenerateSingleACS = () => {
    const { F, S, P, ID, sn } = parsedGpon;

    if (!oltType) {
      setOutput("Error: Silakan pilih tipe OLT terlebih dahulu");
      return;
    }
    
    if (!F || !S || !P || !ID) {
      setOutput("Error: Please enter a valid GPON SFP format (e.g., gpon-onu_1/2/2:1)");
      return;
    }

    let config;
    
    if (oltType === 'C610') {
      config = `conf t
interface gpon_onu-${F}/${S}/${P}:${ID}
tcont 2 name ACS profile ACS-v2
gemport 2 name ACS tcont 2
exit

interface vport-${F}/${S}/${P}.${ID}:2
service-port 2 user-vlan 2989 vlan 2989
exit

pon-onu-mng gpon_onu-${F}/${S}/${P}:${ID}
service ACS gemport 2 vlan 2989
wan-ip 2 ipv4 mode dhcp vlan-profile vlan2989 host 2
tr069-mgmt 1 state unlock
tr069-mgmt 1 acs http://192.168.30.5:5000/acs/ validate basic username plniconplus password PlnIconPlus!2025
tr069-mgmt 1 tag pri 5 vlan 2989
end`;
    } else {
      config = `conf t
interface gpon-onu_${F}/${S}/${P}:${ID}
sn-bind enable sn
tcont 2 name ACS profile ACS-v2
gemport 2 name ACS tcont 2
service-port 2 vport 2 user-vlan 2989 vlan 2989
exit

pon-onu-mng gpon-onu_${F}/${S}/${P}:${ID}
service ACS gemport 2 vlan 2989
wan-ip 2 mode dhcp vlan-profile vlan2989 host 2
tr069-mgmt 1 state unlock
tr069-mgmt 1 acs http://192.168.30.5:5000/acs/ validate basic username plniconplus password PlnIconPlus!2025
tr069-mgmt 1 tag pri 5 vlan 2989
end`;
    }

    setOutput(config);
  };

  // Parse config for a specific SN
  const parseConfigForSN = (sn, cfg, olt) => {
    if (!cfg) return { error: "Global config belum diupload" };

    const lines = cfg.split(/\r?\n/);
    
    if (olt === 'C610') {
      // C610 format: search for "onu <ID> type ... sn <SN>" under "interface gpon_olt-F/S/P"
      const onuRegex = new RegExp(`^\\s*onu\\s+(\\d+)\\s+type\\s+\\S+\\s+sn\\s+${sn}\\b`, 'i');
      
      let matchLineIndex = -1;
      let onuID = null;
      for (let i = 0; i < lines.length; i++) {
        const match = lines[i].match(onuRegex);
        if (match) {
          matchLineIndex = i;
          onuID = match[1];
          break;
        }
      }

      if (matchLineIndex === -1) return { error: 'SN tidak ditemukan di konfigurasi OLT' };

      // Walk upwards to find "interface gpon_olt-F/S/P"
      let headerIndex = -1;
      for (let i = matchLineIndex; i >= 0; i--) {
        const h = lines[i].match(/^interface\s+gpon_olt-(\d+)\/(\d+)\/(\d+)/i);
        if (h) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) return { error: 'Header interface gpon_olt tidak ditemukan untuk SN ini' };

      const headerMatch = lines[headerIndex].match(/interface\s+gpon_olt-(\d+)\/(\d+)\/(\d+)/i);
      const F = headerMatch[1];
      const S = headerMatch[2];
      const P = headerMatch[3];
      const ID = onuID;

      return { F, S, P, ID, sn };
    } else {
      // C320 format: search for "wan-ip 1 mode pppoe username <SN>" under "pon-onu-mng gpon-onu_F/S/P:ID"
      const usernameRegex = new RegExp(`wan-ip\\s+1\\s+mode\\s+pppoe\\s+username\\s+${sn}\\b`, 'i');
      
      let matchLineIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (usernameRegex.test(lines[i])) {
          matchLineIndex = i;
          break;
        }
      }

      if (matchLineIndex === -1) return { error: 'SN tidak ditemukan di konfigurasi OLT' };

      // Walk upwards to find the nearest "pon-onu-mng gpon-onu_F/S/P:ID"
      let headerIndex = -1;
      for (let i = matchLineIndex; i >= 0; i--) {
        const h = lines[i].match(/^pon-onu-mng\s+gpon-onu_(\d+)\/(\d+)\/(\d+):(\d+)/i);
        if (h) {
          headerIndex = i;
          break;
        }
      }

      if (headerIndex === -1) return { error: 'Header pon-onu-mng tidak ditemukan untuk SN ini' };

      const headerMatch = lines[headerIndex].match(/pon-onu-mng\s+gpon-onu_(\d+)\/(\d+)\/(\d+):(\d+)/i);
      const F = headerMatch[1];
      const S = headerMatch[2];
      const P = headerMatch[3];
      const ID = headerMatch[4];

      return { F, S, P, ID, sn };
    }
  };

  // Generate ACS config for a single SN (for use in list click)
  const buildConfigForSN = (sn) => {
    if (!globalConfig) throw new Error('Global config belum diupload');
    
    const res = parseConfigForSN(sn, globalConfig, oltType);
    if (res.error) throw new Error(res.error);

    const { F, S, P, ID } = res;

    let config;
    
    if (oltType === 'C610') {
      config = `interface gpon_onu-${F}/${S}/${P}:${ID}
tcont 2 name ACS profile ACS-v2
gemport 2 name ACS tcont 2
exit

interface vport-${F}/${S}/${P}.${ID}:2
service-port 2 user-vlan 2989 vlan 2989
exit

pon-onu-mng gpon_onu-${F}/${S}/${P}:${ID}
service ACS gemport 2 vlan 2989
wan-ip 2 ipv4 mode dhcp vlan-profile vlan2989 host 2
tr069-mgmt 1 state unlock
tr069-mgmt 1 acs http://192.168.30.5:5000/acs/ validate basic username plniconplus password PlnIconPlus!2025
tr069-mgmt 1 tag pri 5 vlan 2989
exit`;
    } else {
      config = `interface gpon-onu_${F}/${S}/${P}:${ID}
sn-bind enable sn
tcont 2 name ACS profile ACS-v2
gemport 2 name ACS tcont 2
service-port 2 vport 2 user-vlan 2989 vlan 2989
exit

pon-onu-mng gpon-onu_${F}/${S}/${P}:${ID}
service ACS gemport 2 vlan 2989
wan-ip 2 mode dhcp vlan-profile vlan2989 host 2
tr069-mgmt 1 state unlock
tr069-mgmt 1 acs http://192.168.30.5:5000/acs/ validate basic username plniconplus password PlnIconPlus!2025
tr069-mgmt 1 tag pri 5 vlan 2989
exit`;
    }

    return config;
  };

  // Parse SN list
  const parsedSNs = snList.split('\n').filter(sn => sn.trim() !== '').map(sn => sn.trim());

  // Handle SN click in list
  const handleSNClick = (sn) => {
    if (!globalConfig) {
      alert('Silakan upload konfigurasi OLT terlebih dahulu.');
      return;
    }

    if (!oltType) {
      alert('nama OLT salah tipe tidak ditemukan nama olt');
      return;
    }

    try {
      const parsed = parseConfigForSN(sn, globalConfig, oltType);
      if (!parsed.error) {
        const { F, S, P, ID } = parsed;

        if (multipleViewMode === 'line-service') {
          if (oltType === 'C610') {
            setOutput(`show gpon onu state gpon_olt-${F}/${S}/${P} ${ID}`);
          } else {
            setOutput(`show gpon onu state gpon-olt_${F}/${S}/${P} ${ID}`);
          }
        } else if (multipleViewMode === 'cek-ip') {
          if (oltType === 'C610') {
            setOutput(`show gpon remote-onu wan-ip gpon_onu-${F}/${S}/${P}:${ID}`);
          } else {
            setOutput(`show gpon remote-onu wan-ip gpon-onu_${F}/${S}/${P}:${ID}`);
          }
        } else if (multipleViewMode === 'gpon-onu') {
          if (oltType === 'C610') {
            setOutput(`show gpon remote-onu equip gpon_onu-${F}/${S}/${P}:${ID}`);
          } else {
            setOutput(`show gpon remote-onu equip gpon-onu_${F}/${S}/${P}:${ID}`);
          }
        } else {
          const config = buildConfigForSN(sn);
          setOutput(config);
        }

        setSavedConfigs(prev => ({
          ...prev,
          [sn]: parsed
        }));
      }
    } catch (e) {
      alert(e.message);
      setOutput(`Error for SN ${sn}: ${e.message}`);
    }
  };

  // Handle checkbox change
  const handleSNCheck = (sn, checked) => {
    if (checked) {
      setSelectedSNs([...selectedSNs, sn]);
    } else {
      setSelectedSNs(selectedSNs.filter(s => s !== sn));
    }
  };

  // Generate all configs
  const handleGenerateMultipleACS = () => {
    const targets = selectedSNs.length > 0 ? selectedSNs : parsedSNs;
    
    if (!targets || targets.length === 0) {
      alert('Tidak ada SN untuk diproses');
      return;
    }

    if (!globalConfig) {
      alert('Silakan upload konfigurasi OLT terlebih dahulu.');
      return;
    }

    if (!oltType) {
      alert('nama OLT salah tipe tidak ditemukan nama olt');
      return;
    }

    const lines = [];
    
    for (const sn of targets) {
      try {
        const config = buildConfigForSN(sn);
        
        if (multipleViewMode === 'all') {
          lines.push(config);
          lines.push('');
        } else if (multipleViewMode === 'line-service') {
          const parsed = parseConfigForSN(sn, globalConfig, oltType);
          if (!parsed.error) {
            const { F, S, P, ID } = parsed;
            if (oltType === 'C610') {
              lines.push(`show gpon onu state gpon_olt-${F}/${S}/${P} ${ID}`);
            } else {
              lines.push(`show gpon onu state gpon-olt_${F}/${S}/${P} ${ID}`);
            }
            lines.push('');
          }
        } else if (multipleViewMode === 'cek-ip') {
          const parsed = parseConfigForSN(sn, globalConfig, oltType);
          if (!parsed.error) {
            const { F, S, P, ID } = parsed;
            if (oltType === 'C610') {
              lines.push(`show gpon remote-onu wan-ip gpon_onu-${F}/${S}/${P}:${ID}`);
            } else {
              lines.push(`show gpon remote-onu wan-ip gpon-onu_${F}/${S}/${P}:${ID}`);
            }
            lines.push('');
          }
        } else if (multipleViewMode === 'gpon-onu') {
          const parsed = parseConfigForSN(sn, globalConfig, oltType);
          if (!parsed.error) {
            const { F, S, P, ID } = parsed;
            if (oltType === 'C610') {
              lines.push(`show gpon remote-onu equip gpon_onu-${F}/${S}/${P}:${ID}`);
            } else {
              lines.push(`show gpon remote-onu equip gpon-onu_${F}/${S}/${P}:${ID}`);
            }
            lines.push('');
          }
        }
      } catch (e) {
        lines.push(`# ${sn} - skipped: ${e.message}`);
        lines.push('');
      }
    }

    setOutput(lines.join('\n'));
  };

  // Handle CEK IP
  const handleCekIP = () => {
    const targets = selectedSNs.length > 0 ? selectedSNs : parsedSNs;
    
    if (!targets || targets.length === 0) {
      alert('Tidak ada SN yang dipilih untuk dicek');
      return;
    }

    if (!oltType) {
      alert('nama OLT salah tipe tidak ditemukan nama olt');
      return;
    }

    if (oltType === 'C610') {
      alert('Tipe OLT C610 terdeteksi. Config C610 belum tersedia.');
      return;
    }

    const lines = [];
    for (const sn of targets) {
      try {
        const parsed = parseConfigForSN(sn, globalConfig, oltType);
        if (!parsed.error) {
          const { F, S, P, ID } = parsed;
          lines.push(`show gpon onu state gpon-onu_${F}/${S}/${P}:${ID}`);
        } else {
          lines.push(`# ${sn} - tidak ditemukan`);
        }
      } catch (e) {
        lines.push(`# ${sn} - error: ${e.message}`);
      }
    }

    setOutput(lines.join('\n'));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedSNs([]);
  };

  // Check next 10
  const checkNext10 = () => {
    const remaining = parsedSNs.filter(sn => !selectedSNs.includes(sn));
    if (remaining.length === 0) return;
    const toAdd = remaining.slice(0, 10);
    setSelectedSNs([...selectedSNs, ...toAdd]);
  };

  // Check all
  const checkAll = () => {
    setSelectedSNs([...parsedSNs]);
  };

  return (
    <div className={resolvedDark ? "dark" : ""}>
      {/* Warning Banner */}
      {showBanner && <WarningBanner onClose={handleBannerClose} />}

      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-6">
        {/* HEADER */}
        <div className="max-w-7xl mx-auto flex justify-between items-center mb-6">
          <h1 className="text-xl font-semibold">
            Tools · Migrasi ACS · ZTE
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

        {(mode === "multiple" || mode === "compare") && (
          <div className="max-w-7xl mx-auto mb-4">
            <div className="text-2xl font-bold">
              TIPE OLT : {oltType || "-"}
            </div>
          </div>
        )}

        {/* ===== 3 COLUMNS ===== */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* COLUMN 1 */}
          <section className="rounded-2xl border p-4 bg-white/80 dark:bg-slate-900/60">
            {mode === "single" ? (
              <>
                <h2 className="font-semibold text-sm mb-3">Input Data</h2>
                <div className="mb-3">
                  <label className="block text-xs font-medium mb-1">Tipe OLT</label>
                  <select
                    value={oltType}
                    onChange={(e) => setOltType(e.target.value)}
                    className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950"
                  >
                    <option value="">Pilih tipe OLT</option>
                    <option value="C320">C320</option>
                    <option value="C610">C610</option>
                  </select>
                </div>
                <Field 
                  label="Masukan GPON SFP" 
                  value={gponSfp} 
                  onChange={handleGponSfpChange}
                  placeholder="gpon-onu_F/S/P:ID"
                />
                
                {/* Display Parsed Values */}
                {parsedGpon.F && (
                  <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs">
                    <div className="font-semibold mb-1">Parsed Values:</div>
                    <div className="grid grid-cols-2 gap-1">
                      <span>F = {parsedGpon.F}</span>
                      <span>S = {parsedGpon.S}</span>
                      <span>P = {parsedGpon.P}</span>
                      <span>ID = {parsedGpon.ID}</span>
                      {parsedGpon.sn && <span className="col-span-2">SN = {parsedGpon.sn}</span>}
                    </div>
                  </div>
                )}
              </>
            ) : mode === "compare" ? (
              <>
                <h2 className="font-semibold text-sm mb-3">Upload Config Files</h2>

                <label className="block text-xs font-medium mb-1">
                  Config BEFORE
                </label>
                <input
                  type="file"
                  accept=".txt,.rtf"
                  onChange={(e) => handleCompareFileUpload(e, false)}
                  className="w-full mb-3 text-xs"
                />
                {compareBeforeFile && (
                  <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded text-xs mb-3">
                    ✓ File BEFORE uploaded
                  </div>
                )}

                <label className="block text-xs font-medium mb-1">
                  Config AFTER
                </label>
                <input
                  type="file"
                  accept=".txt,.rtf"
                  onChange={(e) => handleCompareFileUpload(e, true)}
                  className="w-full mb-3 text-xs"
                />
                {compareAfterFile && (
                  <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded text-xs mb-3">
                    ✓ File AFTER uploaded
                  </div>
                )}

                <button
                  type="button"
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm"
                >
                  Compare Config
                </button>
              </>
            ) : (
              <>
                <h2 className="font-semibold text-sm mb-3">Upload Global Config OLT</h2>
                <input
                  type="file"
                  accept=".txt,.rtf"
                  onChange={handleFileUpload}
                  className="w-full mb-3"
                />
                {uploadedFile && (
                  <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded text-xs mb-3">
                    ✓ File uploaded
                  </div>
                )}
                <label className="block text-xs font-medium mb-1">
                  Input SN User
                </label>
                <textarea
                  value={snList}
                  onChange={(e) => setSnList(e.target.value)}
                  rows={12}
                  className="w-full rounded-xl border p-3 font-mono text-sm dark:bg-slate-950"
                  placeholder="Paste SN SN user di sini, satu per baris"
                />
              </>
            )}
            {mode !== "compare" && (
              <button
                type="button"
                onClick={mode === "single" ? handleGenerateSingleACS : handleGenerateMultipleACS}
                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-sm"
              >
                Generate Config
              </button>
            )}
          </section>

          {/* COLUMN 2 */}
          <section className="rounded-2xl border p-4 bg-white/80 dark:bg-slate-900/60">
            <h2 className="font-semibold text-sm mb-3">Mode</h2>
            <select
              value={mode}
              onChange={(e) => {
                const nextMode = e.target.value;
                setMode(nextMode);
                if (nextMode === "compare") {
                  setOltType("");
                }
              }}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950"
            >
              <option value="single">Single ACS</option>
              <option value="multiple">Multiple ACS</option>
              <option value="compare">Compare Before After</option>
            </select>
            {mode === "compare" && (
              <div className="mt-3">
                <h3 className="font-semibold text-sm mb-2">Paste SN</h3>
                <label className="block text-xs font-medium mb-1">
                  SN (optional)
                </label>
                <textarea
                  value={compareSNList}
                  onChange={(e) => setCompareSNList(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border p-3 font-mono text-sm dark:bg-slate-950"
                  placeholder="Paste SN di sini (opsional, untuk referensi)"
                />
              </div>
            )}
            {mode === "multiple" && (
              <div className="mt-3">
                <h3 className="font-semibold text-sm mb-2">List SN</h3>
                <div className="flex items-center gap-2 mb-3">
                  <label className={`flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer ${multipleViewMode === "all" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
                    <input
                      type="radio"
                      name="multipleViewMode"
                      value="all"
                      checked={multipleViewMode === "all"}
                      onChange={(e) => setMultipleViewMode(e.target.value)}
                    />
                    <span className="text-sm">All</span>
                  </label>
                  <label className={`flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer ${multipleViewMode === "line-service" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
                    <input
                      type="radio"
                      name="multipleViewMode"
                      value="line-service"
                      checked={multipleViewMode === "line-service"}
                      onChange={(e) => setMultipleViewMode(e.target.value)}
                    />
                    <span className="text-sm">Cek State</span>
                  </label>
                  <label className={`flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer ${multipleViewMode === "cek-ip" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
                    <input
                      type="radio"
                      name="multipleViewMode"
                      value="cek-ip"
                      checked={multipleViewMode === "cek-ip"}
                      onChange={(e) => setMultipleViewMode(e.target.value)}
                    />
                    <span className="text-sm">Cek IP</span>
                  </label>
                  <label className={`flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer ${multipleViewMode === "gpon-onu" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
                    <input
                      type="radio"
                      name="multipleViewMode"
                      value="gpon-onu"
                      checked={multipleViewMode === "gpon-onu"}
                      onChange={(e) => setMultipleViewMode(e.target.value)}
                    />
                    <span className="text-sm">Cek Type</span>
                  </label>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-xl p-2 text-sm">
                  {parsedSNs.length === 0 ? (
                    <div className="text-slate-500 dark:text-slate-400">Belum ada SN untuk ditampilkan.</div>
                  ) : (
                    parsedSNs.map((sn, idx) => (
                      <div key={idx} className="flex items-center gap-2 mb-1 hover:bg-slate-100 dark:hover:bg-slate-800 px-2 py-1 rounded">
                        <input
                          type="checkbox"
                          checked={selectedSNs.includes(sn)}
                          onChange={(e) => handleSNCheck(sn, e.target.checked)}
                        />
                        <span 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleSNClick(sn)}
                        >
                          {sn}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleCekIP}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    CEK IP
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Clear Selection
                  </button>
                  <button
                    type="button"
                    onClick={checkNext10}
                    className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Check +10
                  </button>
                  <button
                    type="button"
                    onClick={checkAll}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Check All
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerateMultipleACS}
                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Export Config
                  </button>
                </div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  <span>Total: {parsedSNs.length}</span>
                  <span className="ml-4">Checked: {selectedSNs.length}</span>
                </div>
              </div>
            )}
          </section>

          {/* COLUMN 3 */}
          <section className="rounded-2xl border p-4 bg-white/80 dark:bg-slate-900/60 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-semibold text-sm">
                {mode === "compare" ? "Comparison Result" : "Output Config"}
              </h2>
              <div className="flex items-center gap-2">
                {mode === "compare" && (
                  <>
                    <button
                      type="button"
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      Tampilkan Semua
                    </button>
                    <button
                      type="button"
                      className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      Tampilkan Gagal
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={clearAllData}
                  className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg ml-2"
                >
                  Hapus Data
                </button>
              </div>
            </div>
            <textarea
              value={mode === "compare" ? compareResult : output}
              readOnly
              rows={22}
              className="flex-1 rounded-xl border p-3 font-mono text-sm dark:bg-slate-950"
              placeholder={
                mode === "compare"
                  ? "Hasil perbandingan akan muncul di sini"
                  : "Config migrasi akan muncul di sini"
              }
            />
          </section>
        </div>
      </div>
    </div>
  );
}

/* ===== COMPONENTS ===== */

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
