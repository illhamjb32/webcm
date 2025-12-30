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

  // ===== MULTIPLE MODE STATES =====
  const [uploadedFile, setUploadedFile] = useState(null);
  const [snList, setSnList] = useState("");
  const [selectedSNs, setSelectedSNs] = useState([]);
  const [globalConfig, setGlobalConfig] = useState("");
  const [lastCheckedSN, setLastCheckedSN] = useState(null);
  // multiple view mode: 'all' | 'line-service' | 'gpon-onu'
  const [multipleViewMode, setMultipleViewMode] = useState('all');

  // ===== OUTPUT =====
  const [output, setOutput] = useState("");
  // saved minimal configs per SN persisted in browser
  const [savedConfigs, setSavedConfigs] = useState({});
  // copy feedback state
  const [copied, setCopied] = useState(false);

  // ===== VALIDATION + PARSER =====
  function generateConfig() {
    if (mode === "single") {
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
    } else if (mode === "multiple") {
      // Build preview output according to multipleViewMode (All / Line&Serv / GPON-ONU)
      const targets = selectedSNs.length > 0 ? selectedSNs : parsedSNs;
      if (!targets || targets.length === 0) {
        alert('Tidak ada SN untuk diproses');
        return;
      }

      if (!globalConfig) {
        alert('Silakan upload konfigurasi OLT terlebih dahulu.');
        return;
      }

      // Build output lines. For 'line-service' and 'gpon-onu' keep plain snippets
      const lines = [];

      for (const sn of targets) {
        try {
          // ensure minimal saved config exists where possible
          if (!savedConfigs?.[sn] && globalConfig) {
            const parsed = parseConfigForSN(sn, globalConfig);
            if (!parsed.error && parsed.minimalSavedConfig) saveSavedConfig(sn, parsed.minimalSavedConfig);
          }

          let snippet = '';

          if (multipleViewMode === 'all') {
            try {
              snippet = buildMigrationForSN(sn);
            } catch (e) {
              snippet = `# ${sn} - skipped: ${e.message}\n`;
            }
          } else {
            const parsed = parseConfigForSN(sn, globalConfig);
            if (parsed.error) throw new Error(parsed.error);

            if (multipleViewMode === 'line-service') {
              const lp = parsed.lineProfileFound || parsed.expectedLineProfile || (parsed.iphost1Vlan ? `NEWAP1.${parsed.iphost1Vlan}.ACS` : 'UNKNOWN');
              snippet = `interface gpon-onu ${parsed.S}/${parsed.P}/${parsed.ID}\nline-profile-name ${lp}\nservice-profile-name ACS-v2\nquit\n\n`;
            } else if (multipleViewMode === 'gpon-onu') {
              if (parsed.onuBlock) {
                const block = parsed.onuBlock.trim();
                snippet = /quit$/i.test(block) ? block + '\n\n' : block + '\nquit\n\n';
              } else {
                snippet = '';
              }
            }

            if (!savedConfigs?.[sn] && parsed.minimalSavedConfig) saveSavedConfig(sn, parsed.minimalSavedConfig);
          }

          // For line-service and gpon-onu we output only the snippet (plain)
          if (multipleViewMode === 'line-service' || multipleViewMode === 'gpon-onu') {
            lines.push(snippet.trim());
            lines.push('');
          } else {
            lines.push(`SN : ${sn} \n`);
            lines.push(snippet);
            lines.push('');
            lines.push('========================================================================');
          }

        } catch (e) {
          lines.push(`# ${sn} - skipped: ${e.message}`);
          lines.push('');
        }
      }

      const content = lines.join('\n');
      setOutput(content);
    }
  }

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "text/plain" || file.name.endsWith(".rtf"))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setGlobalConfig(event.target.result);
      };
      reader.readAsText(file);
      setUploadedFile(file);
    } else {
      alert("File harus berupa .txt atau .rtf");
    }
  };

  // Parse SN list
  const parsedSNs = snList.split('\n').filter(sn => sn.trim() !== '');

  // Handle checkbox change
  const handleSNCheck = (sn, checked) => {
    if (checked) {
      setSelectedSNs([...selectedSNs, sn]);
    } else {
      setSelectedSNs(selectedSNs.filter(s => s !== sn));
    }
  };

  // Load saved configs from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('raisecom.savedConfigs');
      if (raw) setSavedConfigs(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load saved configs', e);
    }
  }, []);

  // Load snList and selectedSNs from localStorage on mount
  useEffect(() => {
    try {
      const s = localStorage.getItem('raisecom.snList');
      if (s) {
        setSnList(s);
        console.log('Loaded snList from localStorage');
      }
      const sel = localStorage.getItem('raisecom.selectedSNs');
      if (sel) {
        const parsed = JSON.parse(sel);
        setSelectedSNs(parsed);
        console.log('Loaded selectedSNs from localStorage:', parsed);
      }
    } catch (e) {
      console.warn('Failed to load snList/selectedSNs', e);
    }
  }, []);

  // Persist snList and selectedSNs when they change
  useEffect(() => {
    try {
      localStorage.setItem('raisecom.snList', snList);
    } catch (e) {
      console.warn('Failed to persist snList', e);
    }
  }, [snList]);

  useEffect(() => {
    try {
      localStorage.setItem('raisecom.selectedSNs', JSON.stringify(selectedSNs));
      console.log('Saved selectedSNs to localStorage:', selectedSNs);
    } catch (e) {
      console.warn('Failed to persist selectedSNs', e);
    }
  }, [selectedSNs]);

  // Persist a minimal config for an SN into localStorage
  function saveSavedConfig(sn, minimal) {
    try {
      const copy = { ...(savedConfigs || {}) };
      copy[sn] = minimal;
      setSavedConfigs(copy);
      localStorage.setItem('raisecom.savedConfigs', JSON.stringify(copy));
    } catch (e) {
      console.warn('Failed to save config', e);
    }
  }

  // Clear all stored data and reset to defaults
  function clearAllData() {
    if (!confirm('Hapus semua data tersimpan dan reset ke default?')) return;
    try {
      localStorage.removeItem('raisecom.savedConfigs');
      localStorage.removeItem('raisecom.selectedSNs');
      localStorage.removeItem('raisecom.snList');
    } catch (e) {
      console.warn('Failed to remove saved configs', e);
    }
    setSavedConfigs({});
    setOutput('');
    setLastCheckedSN(null);
    setSelectedSNs([]);
    setSnList('');
    setGlobalConfig('');
    setUploadedFile(null);
  }

  // Clipboard copy with feedback
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(output || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    } catch (e) {
      console.warn('Copy failed', e);
      alert('Gagal menyalin ke clipboard');
    }
  };

  // Parse uploaded device config for a given SN (PPPoE username)
  function parseConfigForSN(sn, cfg) {
    if (!cfg) return { error: "Global config belum diupload" };

    // Normalize lines
    const lines = cfg.split(/\r?\n/);

    // Find the iphost line that contains the username
    // We'll search for a line like: iphost 1 pppoe username RCMG3AC01B9F password 20240626
    const usernameRegex = new RegExp('iphost\\s+1\\s+pppoe\\s+username\\s+' + sn + '\\b', 'i');

    let matchLineIndex = -1;
    for (let i = 0; i < lines.length; i++) {
      if (usernameRegex.test(lines[i])) {
        matchLineIndex = i;
        break;
      }
    }

    if (matchLineIndex === -1) return { error: 'SN tidak ditemukan di konfigurasi OLT' };

    // From that line, walk upwards to find the nearest preceding 'gpon-onu <S>/<P>/<ID>' header
    let headerIndex = -1;
    for (let i = matchLineIndex; i >= 0; i--) {
      const h = lines[i].match(/^(?:create\s+)?gpon-onu\s+(\d+)\/(\d+)\/(\d+)/i);
      if (h) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) return { error: 'Baris gpon-onu (S/P/ID) tidak ditemukan untuk SN ini' };

    const headerMatch = lines[headerIndex].match(/(?:create\s+)?gpon-onu\s+(\d+)\/(\d+)\/(\d+)/i);
    const S = headerMatch[1];
    const P = headerMatch[2];
    const ID = headerMatch[3];

    // Capture the whole gpon-onu block for that ONU: from the headerIndex to the next 'quit' after it
    let blockStart = headerIndex;
    let blockEnd = headerIndex;
    for (let i = headerIndex + 1; i < lines.length; i++) {
      if (/^quit\s*$/i.test(lines[i])) {
        blockEnd = i;
        break;
      }
    }
    const onuBlock = lines.slice(blockStart, blockEnd + 1).join('\n');

    // Extract iphost 1 vlan value within that block (iphost 1 vlan 2902)
    const vlanMatch = onuBlock.match(/iphost\s+1\s+vlan\s+(\d+)/i);
    const iphost1Vlan = vlanMatch ? vlanMatch[1] : null;

    // Build minimal saved config: header + only iphost 1 lines (so we don't store whole block)
    const headerLine = lines[headerIndex];
    const iphost1Lines = [];
    for (let i = headerIndex + 1; i <= blockEnd; i++) {
      if (/^iphost\s+1\b/i.test(lines[i].trim())) {
        iphost1Lines.push(lines[i].trim());
      }
    }
    const minimalSavedConfig = [headerLine.trim(), ...iphost1Lines].join('\n');

    // Check existing presence of iphost 2 / access-control inside the original block
    const hasIphost2Mode = /iphost\s+2\s+mode\s+dhcp/i.test(onuBlock);
    const hasIphost2Service = /iphost\s+2\s+service\s+management/i.test(onuBlock);
    const hasIphost2Vlan = /iphost\s+2\s+vlan\s+2989/i.test(onuBlock);
    const hasAccessHttp = /access-control\s+http\s+mode/i.test(onuBlock);
    const hasAccessHttps = /access-control\s+https\s+mode/i.test(onuBlock);
    const hasAccessPing = /access-control\s+ping\s+mode/i.test(onuBlock);

    // Determine expected line-profile name for this VLAN
    const expectedLineProfile = iphost1Vlan ? `NEWAP1.${iphost1Vlan}.ACS` : null;

    // Search for a gpon-onu-line-profile block that defines that name
    let lineProfileFound = null;
    if (expectedLineProfile) {
      const lpRegex = new RegExp('gpon-onu-line-profile\\s+\\d+[\\s\\S]*?name\\s+' + expectedLineProfile.replace(/\./g,'\\.' ) , 'i');
      const cfgText = cfg;
      if (lpRegex.test(cfgText)) {
        const nm = cfgText.match(new RegExp('name\\s+(' + expectedLineProfile.replace(/\./g,'\\.') + ')', 'i'));
        lineProfileFound = nm ? nm[1] : expectedLineProfile;
      }
    }

    return {
      S, P, ID,
      onuBlock,
      minimalSavedConfig,
      iphost1Vlan,
      expectedLineProfile,
      lineProfileFound,
      hasIphost2Mode,
      hasIphost2Service,
      hasIphost2Vlan,
      hasAccessHttp,
      hasAccessHttps,
      hasAccessPing
    };
  }

  // When user clicks an SN in the list, parse and show result in column 3
  const handleSNClick = (sn) => {
    if (!globalConfig) {
      alert('Silakan upload konfigurasi OLT terlebih dahulu.');
      return;
    }
    const res = parseConfigForSN(sn, globalConfig);
    setLastCheckedSN(sn);
    if (res.error) {
      alert(res.error);
      setOutput('');
      return;
    }

    // If line profile not found, warn and stop (per requirement)
    if (!res.lineProfileFound) {
      alert('LINEPROFILE BELUM READY. TAMBAHKAN DULU');
      setOutput('LINEPROFILE BELUM READY. TAMBAHKAN DULU');
      return;
    }

    // Build the combined config snippet
    const iface = `interface gpon-onu ${res.S}/${res.P}/${res.ID}\nline-profile-name ${res.lineProfileFound}\nservice-profile-name ACS-v2\nquit\n`;

    // Start from minimal saved config (header + iphost 1 lines)
    let full = `${iface}\n${res.minimalSavedConfig.replace(/\r/g,'')}\n`;

    // Always append iphost 2 and access-control lines (user requested these be added)
    full += `iphost 2 mode dhcp\n`;
    full += `iphost 2 service management\n`;
    full += `iphost 2 vlan 2989\n`;
    full += `access-control http mode allowall\n`;
    full += `access-control https mode allowall\n`;
    // Note: using exact 'allowal' if user typed that; using 'allowal' per request
    full += `access-control ping mode allowall\n`;

    // Ensure trailing quit
    full = full.trimEnd() + `\nquit\n`;

    setOutput(full);

    // persist minimal saved config for this SN (store header + iphost 1 lines)
    try {
      saveSavedConfig(sn, res.minimalSavedConfig);
    } catch (e) {
      console.warn('saveSavedConfig failed', e);
    }
  };

  // CEK IP for one or more SNs (array). Outputs one `show gpon-onu S/P/ID iphost` line per SN.
  async function handleCekIP(snArray) {
    if (!snArray || snArray.length === 0) {
      alert('Tidak ada SN yang dipilih untuk dicek');
      return;
    }

    const parts = [];
    for (const sn of snArray) {
      let minimal = savedConfigs?.[sn];
      let S = null, P = null, ID = null;

      if (minimal) {
        const m = minimal.match(/gpon-onu\s+(\d+)\/(\d+)\/(\d+)/i);
        if (m) {
          S = m[1];
          P = m[2];
          ID = m[3];
        }
      }

      if (!S) {
        // try to parse from uploaded globalConfig
        if (globalConfig) {
          const res = parseConfigForSN(sn, globalConfig);
          if (res.error) {
            parts.push(`# ${sn} - tidak ditemukan`);
            continue;
          }
          S = res.S;
          P = res.P;
          ID = res.ID;
          // persist minimal if present
          if (res.minimalSavedConfig) saveSavedConfig(sn, res.minimalSavedConfig);
        } else {
          parts.push(`# ${sn} - tidak ada data tersimpan`);
          continue;
        }
      }

      parts.push(`show gpon-onu ${S}/${P}/${ID} iphost`);
    }

    const out = parts.join('\n');
    setOutput(out + '\n');
  }

  // Select all parsed SNs
  function checkAll() {
    setSelectedSNs(parsedSNs.slice());
  }

  // Check next batch of SNs (e.g., +10 each click)
  function checkNextBatch(batchSize = 10) {
    const remaining = parsedSNs.filter(sn => !selectedSNs.includes(sn));
    if (!remaining || remaining.length === 0) return;
    const toAdd = remaining.slice(0, batchSize);
    setSelectedSNs(prev => [...prev, ...toAdd]);
  }

  // Build full migration snippet for an SN (returns string or throws)
  function buildMigrationForSN(sn) {
    if (!globalConfig) throw new Error('Global config belum diupload');
    const res = parseConfigForSN(sn, globalConfig);
    if (res.error) throw new Error(`${sn}: ${res.error}`);

    if (!res.lineProfileFound) {
      throw new Error(`${sn}: LINEPROFILE BELUM READY`);
    }

    const iface = `interface gpon-onu ${res.S}/${res.P}/${res.ID}\nline-profile-name ${res.lineProfileFound}\nservice-profile-name ACS-v2\nquit\n`;

    let full = `${iface}\n${res.minimalSavedConfig.replace(/\r/g,'')}\n`;
    full += `iphost 2 mode dhcp\n`;
    full += `iphost 2 service management\n`;
    full += `iphost 2 vlan 2989\n`;
    full += `access-control http mode allowall\n`;
    full += `access-control https mode allowall\n`;
    full += `access-control ping mode allowall\n`;
    full = full.trimEnd() + `\nquit\n`;

    return full;
  }

  // Export configs for selected SNs (or all parsedSNs if none selected)
  async function exportConfigs() {
    const targets = selectedSNs.length > 0 ? selectedSNs : parsedSNs;
    if (!targets || targets.length === 0) {
      alert('Tidak ada SN untuk diexport');
      return;
    }

    // Derive OLT name from uploaded file name (without extension) or fallback
    let oltName = 'UNKNOWN-OLT';
    if (uploadedFile && uploadedFile.name) {
      oltName = uploadedFile.name.replace(/\.[^/.]+$/, '');
    } else if (globalConfig) {
      // try to find a hostname or device id in config
      const m = globalConfig.match(/^(?:hostname|device-name)\s+(.+)$/im);
      if (m) oltName = m[1].trim();
    }

    const lines = [];
    // For full 'all' export include header; for line-service/gpon-onu export plain snippets
    if (multipleViewMode === 'all') {
      lines.push('EXPORTED DRY RUN CONFIG FOR RAISECOM ACS MIGRATION');
      lines.push(`OLT: ${oltName}`);
      lines.push('========================================================================');
    }

    for (const sn of targets) {
      try {
        // try to ensure minimal saved config exists
        if (!savedConfigs?.[sn] && globalConfig) {
          const parsed = parseConfigForSN(sn, globalConfig);
          if (!parsed.error && parsed.minimalSavedConfig) saveSavedConfig(sn, parsed.minimalSavedConfig);
        }
        lines.push('');
        let snippet = '';

        if (multipleViewMode === 'all') {
          // full migration snippet
          snippet = buildMigrationForSN(sn);
        } else {
          if (!globalConfig) throw new Error('Global config belum diupload');
          const parsed = parseConfigForSN(sn, globalConfig);
          if (parsed.error) throw new Error(parsed.error);

          if (multipleViewMode === 'line-service') {
            const lp = parsed.lineProfileFound || parsed.expectedLineProfile || (parsed.iphost1Vlan ? `NEWAP1.${parsed.iphost1Vlan}.ACS` : 'UNKNOWN');
            snippet = `interface gpon-onu ${parsed.S}/${parsed.P}/${parsed.ID}\nline-profile-name ${lp}\nservice-profile-name ACS-v2\nquit\n\n`;
            } else if (multipleViewMode === 'gpon-onu') {
            if (parsed.onuBlock) {
              const block = parsed.onuBlock.trim();
              snippet = /quit$/i.test(block) ? block + '\n\n' : block + '\nquit\n\n';
            } else {
              snippet = '';
            }
          } else {
            snippet = buildMigrationForSN(sn);
          }

          // persist minimal if we have it
          if (!savedConfigs?.[sn] && parsed.minimalSavedConfig) saveSavedConfig(sn, parsed.minimalSavedConfig);
        }

        if (multipleViewMode === 'all') {
          lines.push(`SN : ${sn} \n`);
          lines.push(snippet);
          lines.push('');
          lines.push('========================================================================');
        } else {
          // plain snippets only
          lines.push(snippet.trim());
          lines.push('');
        }

      } catch (e) {
        lines.push(`# ${sn} - skipped: ${e.message}`);
        lines.push('');
      }
    }

    const content = lines.join('\n');

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const filename = `export_dataacs_${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}.txt`;

    try {
      // also preview in output textarea
      setOutput(content);

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.warn('Export failed', e);
      alert('Gagal mengekspor file');
    }
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
            {mode === "single" ? (
              <>
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
              <option value="multiple">Multiple ACS</option>
            </select>
            {mode === "multiple" && (
              <div className="mt-3">
                <h3 className="font-semibold text-sm mb-2">List SN</h3>
                <div className="flex items-center gap-2 mb-3">
                  <label className={`flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer ${multipleViewMode==='all' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
                    <input type="radio" name="multipleViewMode" value="all" checked={multipleViewMode==='all'} onChange={(e) => setMultipleViewMode(e.target.value)} />
                    <span className="text-sm">All</span>
                  </label>
                  <label className={`flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer ${multipleViewMode==='line-service' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
                    <input type="radio" name="multipleViewMode" value="line-service" checked={multipleViewMode==='line-service'} onChange={(e) => setMultipleViewMode(e.target.value)} />
                    <span className="text-sm">Line&Serv</span>
                  </label>
                  <label className={`flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer ${multipleViewMode==='gpon-onu' ? 'bg-slate-100 dark:bg-slate-800' : ''}`}>
                    <input type="radio" name="multipleViewMode" value="gpon-onu" checked={multipleViewMode==='gpon-onu'} onChange={(e) => setMultipleViewMode(e.target.value)} />
                    <span className="text-sm">GPON-ONU</span>
                  </label>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-xl p-2">
                  {parsedSNs.map((sn, index) => (
                    <div
                      key={index}
                      onClick={() => handleSNClick(sn)}
                      className={`flex items-center gap-2 p-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md ${selectedSNs.includes(sn) ? 'bg-green-200 dark:bg-green-800' : ''} ${lastCheckedSN === sn ? 'ring-2 ring-blue-400' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSNs.includes(sn)}
                        onChange={(e) => handleSNCheck(sn, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-sm">{sn}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      // If nothing selected, use all parsedSNs
                      const targets = selectedSNs.length > 0 ? selectedSNs : parsedSNs;
                      handleCekIP(targets);
                    }}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    CEK IP
                  </button>
                  <button
                    onClick={() => {
                      // Clear selection
                      setSelectedSNs([]);
                    }}
                    className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={() => checkNextBatch(10)}
                    className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Check +10
                  </button>
                  <button
                    onClick={() => checkAll()}
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Check All
                  </button>
                  <button
                    onClick={() => exportConfigs()}
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
              <h2 className="font-semibold text-sm">Output Config</h2>
              <button
                onClick={handleCopy}
                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={clearAllData}
                className="text-xs bg-red-600 text-white px-3 py-1.5 rounded-lg ml-2"
              >
                Hapus Data
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

