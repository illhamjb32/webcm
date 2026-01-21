import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import WarningBanner from "../../components/WarningBanner";

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

  // ===== COMPARE MODE STATES =====
  const [compareConfigBefore, setCompareConfigBefore] = useState("");
  const [compareConfigAfter, setCompareConfigAfter] = useState("");
  const [compareSNList, setCompareSNList] = useState("");
  const [compareResult, setCompareResult] = useState("");
  const [compareResultsData, setCompareResultsData] = useState([]);
  const [compareDisplay, setCompareDisplay] = useState('all');

  // ===== OUTPUT =====
  const [output, setOutput] = useState("");
  // saved minimal configs per SN persisted in browser
  const [savedConfigs, setSavedConfigs] = useState({});
  // copy feedback state
  const [copied, setCopied] = useState(false);

  // ===== BANNER STATES =====
  const [showBanner, setShowBanner] = useState(true);

  // Handle banner close
  const handleBannerClose = () => {
    setShowBanner(false);
  };

  // ===== FIND BEST LINE PROFILE FROM CONFIG =====
  function findBestLineProfile(cfg, vlan) {
    if (!cfg || !vlan) return null;

    // Find all NEWAP patterns for this VLAN: NEWAP1.2910.ACS, NEWAP2.2910.ACS, etc.
    const regex = new RegExp(`(NEWAP\\d+)\\.${vlan}\\.ACS`, 'gi');
    const matches = [];
    let match;
    while ((match = regex.exec(cfg)) !== null) {
      matches.push(match[1]); // e.g., "NEWAP1", "NEWAP2"
    }

    if (matches.length === 0) return null;

    // Extract numbers and find the highest
    const numbers = matches.map(m => parseInt(m.replace('NEWAP', '')));
    const maxNumber = Math.max(...numbers);
    
    return `NEWAP${maxNumber}.${vlan}.ACS`;
  }

  // ===== DETERMINE EXPECTED LINE PROFILE NAME FOR VLAN =====
  function getLineProfileForVlan(cfg, vlan) {
    if (!vlan) return null;

    // Try to find the best NEWAP version from config
    const best = findBestLineProfile(cfg, vlan);
    if (best) return best;

    // Fallback: assume NEWAP1 if not found in config
    return `NEWAP1.${vlan}.ACS`;
  }

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

access-control http mode allowlan
access-control telnet mode blockall
access-control ping mode allowwan
access-control https mode allowlan

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
                let block = parsed.onuBlock.trim();
                // Remove trailing quit if present to rebuild it
                block = block.replace(/\nquit\s*$/i, '');

                // Validate iphost 1 configuration
                const validation = validateIphost1Config(block);
                let validationMsg = '';
                if (validation.warnings.length > 0) {
                  validationMsg += validation.warnings.join('\n') + '\n';
                }

                // Apply fixes for missing iphost 1 configurations
                // Add iphost 1 mode pppoe if missing
                if (!/iphost\s+1\s+mode\s+pppoe/i.test(block)) {
                  block = 'iphost 1 mode pppoe\n' + block;
                }

                // Add iphost 1 service Internet if missing
                if (!/iphost\s+1\s+service\s+Internet/i.test(block)) {
                  block += `\niphost 1 service Internet`;
                }

                // Add iphost 1 service mode route nat enable... if missing
                if (!/iphost\s+1\s+service\s+mode\s+route\s+nat\s+enable\s+cos\s+0\s+portlist\s+\S+/i.test(block)) {
                  block += `\niphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1`;
                }

                // Append iphost 2 and access-control if not present
                if (!/iphost\s+2\s+mode\s+dhcp/i.test(block)) {
                  block += `\niphost 2 mode dhcp`;
                }
                if (!/iphost\s+2\s+service\s+management/i.test(block)) {
                  block += `\niphost 2 service management`;
                }
                if (!/iphost\s+2\s+vlan\s+2989/i.test(block)) {
                  block += `\niphost 2 vlan 2989`;
                }
                if (!/access-control\s+http/i.test(block)) {
                  block += `\naccess-control http mode allowlan`;
                }
                if (!/access-control\s+telnet/i.test(block)) {
                  block += `\naccess-control telnet mode blockall`;
                }
                if (!/access-control\s+ping/i.test(block)) {
                  block += `\naccess-control ping mode allowwan`;
                }
                 if (!/access-control\s+https/i.test(block)) {
                  block += `\naccess-control https mode allowlan`;
                }

                // Ensure quit at end
                snippet = block + '\nquit\n\n';

                // Add validation warnings as comment at the end
                if (validationMsg) {
                  snippet = validationMsg + '\n' + snippet;
                }
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

  // Handle compare file upload
  const handleCompareFileUpload = (e, isAfter = false) => {
    const file = e.target.files[0];
    if (file && (file.type === "text/plain" || file.name.endsWith(".rtf"))) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (isAfter) {
          setCompareConfigAfter(event.target.result);
        } else {
          setCompareConfigBefore(event.target.result);
        }
      };
      reader.readAsText(file);
    } else {
      alert("File harus berupa .txt atau .rtf");
    }
  };

  // Extract config block for a specific SN from config text
  function extractSNConfig(sn, configText) {
    if (!sn || !configText) return null;

    // Find the line that contains this SN username
    const lines = configText.split(/\r?\n/);
    let snLineIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const regex = new RegExp(`iphost\\s+1\\s+pppoe\\s+username\\s+${sn}\\b`, 'i');
      if (regex.test(lines[i])) {
        snLineIndex = i;
        break;
      }
    }

    if (snLineIndex === -1) return null;

    // Find the gpon-onu header before this line
    let headerIndex = -1;
    for (let i = snLineIndex; i >= 0; i--) {
      if (/^(?:create\s+)?gpon-onu\s+\d+\/\d+\/\d+/i.test(lines[i])) {
        headerIndex = i;
        break;
      }
    }

    if (headerIndex === -1) return null;

    // Find the quit after this block
    let quitIndex = -1;
    for (let i = snLineIndex + 1; i < lines.length; i++) {
      if (/^quit\s*$/i.test(lines[i])) {
        quitIndex = i;
        break;
      }
    }

    if (quitIndex === -1) {
      // If no quit found, take until next gpon-onu
      for (let i = snLineIndex + 1; i < lines.length; i++) {
        if (/^(?:create\s+)?gpon-onu\s+\d+\/\d+\/\d+/i.test(lines[i])) {
          quitIndex = i - 1;
          break;
        }
      }
      if (quitIndex === -1) quitIndex = lines.length - 1;
    }

    // Extract the block as normalized lines
    const blockLines = lines.slice(headerIndex, quitIndex + 1)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    return blockLines;
  }

  // Check which required iphost 1 configs are missing from BEFORE config block
  function checkMissingIphost1ConfigsBefore(block) {
    const requiredConfigs = [
      { regex: /iphost\s+1\s+mode\s+pppoe/i, line: 'iphost 1 mode pppoe' },
      { regex: /iphost\s+1\s+pppoe\s+username\s+\S+\s+password\s+\S+/i, line: 'iphost 1 pppoe username XXXX password YYYY' },
      { regex: /iphost\s+1\s+vlan\s+\d+/i, line: 'iphost 1 vlan XXXX' },
      { regex: /iphost\s+1\s+service\s+Internet/i, line: 'iphost 1 service Internet' },
      { regex: /iphost\s+1\s+service\s+mode\s+route\s+nat\s+enable\s+cos\s+0\s+portlist\s+\S+/i, line: 'iphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1' }
    ];

    const missing = [];
    for (const config of requiredConfigs) {
      if (!config.regex.test(block)) {
        missing.push(config.line);
      }
    }
    return missing;
  }

  // Check which required iphost 1 and iphost 2 configs are missing from AFTER config block
  function checkMissingIphost1ConfigsAfter(block) {
    const requiredConfigs = [
      { regex: /iphost\s+1\s+mode\s+pppoe/i, line: 'iphost 1 mode pppoe' },
      { regex: /iphost\s+1\s+pppoe\s+username\s+\S+\s+password\s+\S+/i, line: 'iphost 1 pppoe username XXXX password YYYY' },
      { regex: /iphost\s+1\s+vlan\s+\d+/i, line: 'iphost 1 vlan XXXX' },
      { regex: /iphost\s+1\s+service\s+Internet/i, line: 'iphost 1 service Internet' },
      { regex: /iphost\s+1\s+service\s+mode\s+route\s+nat\s+enable\s+cos\s+0\s+portlist\s+\S+/i, line: 'iphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1' },
      { regex: /iphost\s+2\s+mode\s+dhcp/i, line: 'iphost 2 mode dhcp' },
      { regex: /iphost\s+2\s+service\s+management/i, line: 'iphost 2 service management' },
      { regex: /iphost\s+2\s+vlan\s+2989/i, line: 'iphost 2 vlan 2989' }
    ];

    const missing = [];
    for (const config of requiredConfigs) {
      if (!config.regex.test(block)) {
        missing.push(config.line);
      }
    }
    return missing;
  }

  function performComparison() {
    if (!compareConfigBefore.trim()) {
      alert('Silakan upload config BEFORE terlebih dahulu');
      return;
    }
    if (!compareConfigAfter.trim()) {
      alert('Silakan upload config AFTER terlebih dahulu');
      return;
    }
    if (!compareSNList.trim()) {
      alert('Silakan masukkan daftar SN di text area');
      return;
    }

    // Extract SNs from text area input
    const snMatches = compareSNList.split('\n').map(sn => sn.trim()).filter(sn => sn.length > 0);

    if (snMatches.length === 0) {
      alert('Tidak ada SN yang ditemukan di text area');
      setCompareResult('Tidak ada SN yang ditemukan di text area');
      setCompareResultsData([]);
      return;
    }

    const isAllowedNewLine = (line) => {
      return /^iphost\s+2\b/i.test(line) || /^access-control\s+/i.test(line) || /^quit$/i.test(line);
    };

    const data = [];
    for (const sn of snMatches) {
      const beforeBlock = extractSNConfig(sn, compareConfigBefore) || [];
      const afterBlock = extractSNConfig(sn, compareConfigAfter) || [];

      const header = beforeBlock.length > 0 ? beforeBlock[0] : null; // gpon-onu header
      const beforeBlockStr = beforeBlock.join('\n');
      const afterBlockStr = afterBlock.join('\n');

      // Check for missing iphost 1 configs in before and after
      const missingInBefore = checkMissingIphost1ConfigsBefore(beforeBlockStr);
      const missingInAfter = checkMissingIphost1ConfigsAfter(afterBlockStr);

      // Determine before status
      const beforeStatus = missingInBefore.length === 0 ? 'OK' : 'NOK';
      // Determine after status
      const afterStatus = missingInAfter.length === 0 ? 'OK' : 'NOK';

      // missing = lines in beforeBlock (excluding header) not present in afterBlock
      const missingLines = [];
      for (let i = 1; i < beforeBlock.length; i++) {
        const line = beforeBlock[i];
        if (!afterBlock.includes(line)) missingLines.push(line);
      }

      // unexpected lines in after (excluding allowed ones and header)
      const unexpected = [];
      for (const line of afterBlock) {
        if (line === header) continue;
        if (!beforeBlock.includes(line) && !isAllowedNewLine(line)) unexpected.push(line);
      }

      const status = (beforeStatus === 'OK' && afterStatus === 'OK' && missingLines.length === 0 && unexpected.length === 0) ? 'OK' : 'NOK';

      data.push({ 
        sn, 
        header, 
        beforeBlock, 
        afterBlock, 
        beforeStatus,
        afterStatus,
        missingInBefore,
        missingInAfter,
        missingLines, 
        unexpected, 
        status 
      });
    }

    setCompareResultsData(data);
    // set initial display (current compareDisplay)
    updateCompareDisplay(compareDisplay, data);
  }

  // Format structured compare results into text for textarea according to display mode
  function updateCompareDisplay(mode, dataArg) {
    const data = dataArg || compareResultsData || [];
    const lines = [];
    for (const item of data) {
      if (mode === 'failed' && item.beforeStatus === 'OK' && item.afterStatus === 'OK') continue;

      lines.push(`SN : ${item.sn}`);
      
      // Show BEFORE status with emoji
      const beforeEmoji = item.beforeStatus === 'OK' ? '✅' : '❌';
      lines.push(`Before : ${beforeEmoji} ${item.beforeStatus}`);
      if (item.beforeStatus === 'NOK' && item.missingInBefore.length > 0) {
        lines.push('Missing config:');
        if (item.header) lines.push(item.header);
        item.missingInBefore.forEach(l => lines.push(l));
      }
      
      // Show AFTER status with emoji
      const afterEmoji = item.afterStatus === 'OK' ? '✅' : '❌';
      lines.push(`After : ${afterEmoji} ${item.afterStatus}`);
      if (item.afterStatus === 'NOK' && item.missingInAfter.length > 0) {
        lines.push('Missing config:');
        if (item.header) lines.push(item.header);
        
        // Check if any iphost 2 config is missing
        const hasIphost2Missing = item.missingInAfter.some(l => /^iphost\s+2/i.test(l));
        
        // Add all missing configs
        item.missingInAfter.forEach(l => lines.push(l));
        
        // If iphost 2 is missing, also add access-control configs
        if (hasIphost2Missing) {
          lines.push('access-control http mode allowlan');
          lines.push('access-control telnet mode blockall');
          lines.push('access-control ping mode allowwan');
          lines.push('access-control https mode allowlan');
        }
      }
      
      lines.push('');
    }

    setCompareResult(lines.join('\n'));
  }

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

  // Validate iphost 1 configuration for GPON-ONU mode
  function validateIphost1Config(onuBlock) {
    const issues = [];
    const warnings = [];

    // Check iphost 1 mode pppoe
    const hasModePppoe = /iphost\s+1\s+mode\s+pppoe/i.test(onuBlock);
    if (!hasModePppoe) {
      issues.push('⚠️ iphost 1 mode pppoe TIDAK DITEMUKAN - Akan ditambahkan');
    }

    // Check iphost 1 pppoe username and password (format: iphost 1 pppoe username XXX password YYY)
    const hasPppoeUserPass = /iphost\s+1\s+pppoe\s+username\s+\S+\s+password\s+\S+/i.test(onuBlock);
    if (!hasPppoeUserPass) {
      warnings.push('❌ USER PASS TIDAK ADA DI CONFIG CEK ULANG');
    }

    // Check iphost 1 vlan
    const vlanMatch = onuBlock.match(/iphost\s+1\s+vlan\s+(\d+)/i);
    if (!vlanMatch) {
      warnings.push('❌ VLAN GAADA');
    }

    // Check iphost 1 service Internet
    const hasServiceInternet = /iphost\s+1\s+service\s+Internet/i.test(onuBlock);
    if (!hasServiceInternet) {
      issues.push('⚠️ iphost 1 service Internet TIDAK DITEMUKAN - Akan ditambahkan');
    }

    // Check iphost 1 service mode route nat enable cos 0 portlist
    const hasServiceMode = /iphost\s+1\s+service\s+mode\s+route\s+nat\s+enable\s+cos\s+0\s+portlist\s+\S+/i.test(onuBlock);
    if (!hasServiceMode) {
      issues.push('⚠️ iphost 1 service mode route nat enable cos 0 portlist TIDAK DITEMUKAN - Akan ditambahkan');
    }

    return { issues, warnings };
  }

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
    const hasAccessTelnet = /access-control\s+telnet\s+mode/i.test(onuBlock);
    const hasAccessPing = /access-control\s+ping\s+mode/i.test(onuBlock);
    const hasAccessHttps = /access-control\s+https\s+mode/i.test(onuBlock);

    // Determine expected line-profile name for this VLAN using smart detection
    const expectedLineProfile = iphost1Vlan ? getLineProfileForVlan(cfg, iphost1Vlan) : null;

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
      hasAccessTelnet,
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

    // Validate iphost 1 configuration
    const validation = validateIphost1Config(res.onuBlock);
    let validationOutput = '';
    if (validation.warnings.length > 0) {
      validationOutput = validation.warnings.join('\n') + '\n\n';
    }

    // Build the combined config snippet
    const iface = `interface gpon-onu ${res.S}/${res.P}/${res.ID}\nline-profile-name ${res.lineProfileFound}\nservice-profile-name ACS-v2\nquit\n`;

    // Start from minimal saved config and apply fixes
    let block = res.minimalSavedConfig.replace(/\r/g,'');

    // Add iphost 1 mode pppoe if missing
    if (!/iphost\s+1\s+mode\s+pppoe/i.test(block)) {
      block = 'iphost 1 mode pppoe\n' + block;
    }

    // Add iphost 1 service Internet if missing
    if (!/iphost\s+1\s+service\s+Internet/i.test(block)) {
      block += `\niphost 1 service Internet`;
    }

    // Add iphost 1 service mode route nat enable... if missing
    if (!/iphost\s+1\s+service\s+mode\s+route\s+nat\s+enable\s+cos\s+0\s+portlist\s+\S+/i.test(block)) {
      block += `\niphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1`;
    }

    let full = `${iface}\n${block}\n`;

    // Always append iphost 2 and access-control lines (user requested these be added)
    full += `iphost 2 mode dhcp\n`;
    full += `iphost 2 service management\n`;
    full += `iphost 2 vlan 2989\n`;
    full += `access-control http mode allowlan\n`;
    full += `access-control telnet mode blockall\n`;
    full += `access-control ping mode allowwan\n`;
    full += `access-control https mode allowlan\n`;
    // Ensure trailing quit
    full = full.trimEnd() + `\nquit\n`;

    // Add validation warnings at the beginning
    if (validationOutput) {
      full = validationOutput + full;
    }

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

    // Validate iphost 1 configuration
    const validation = validateIphost1Config(res.onuBlock);
    let validationMsg = '';
    if (validation.warnings.length > 0) {
      validationMsg = validation.warnings.join('\n') + '\n\n';
    }

    const iface = `interface gpon-onu ${res.S}/${res.P}/${res.ID}\nline-profile-name ${res.lineProfileFound}\nservice-profile-name ACS-v2\nquit\n`;

    // Start with minimalSavedConfig and apply fixes
    let block = res.minimalSavedConfig.replace(/\r/g,'');

    // Add iphost 1 mode pppoe if missing
    if (!/iphost\s+1\s+mode\s+pppoe/i.test(block)) {
      block = 'iphost 1 mode pppoe\n' + block;
    }

    // Add iphost 1 service Internet if missing
    if (!/iphost\s+1\s+service\s+Internet/i.test(block)) {
      block += `\niphost 1 service Internet`;
    }

    // Add iphost 1 service mode route nat enable... if missing
    if (!/iphost\s+1\s+service\s+mode\s+route\s+nat\s+enable\s+cos\s+0\s+portlist\s+\S+/i.test(block)) {
      block += `\niphost 1 service mode route nat enable cos 0 portlist 1,2 ssidlist 1`;
    }

    let full = `${iface}\n${block}\n`;
    full += `iphost 2 mode dhcp\n`;
    full += `iphost 2 service management\n`;
    full += `iphost 2 vlan 2989\n`;
    full += `access-control http mode allowlan\n`;
    full += `access-control telnet mode blockall\n`;
    full += `access-control ping mode allowwan\n`;
    full += `access-control https mode allowlan\n`;
    full = full.trimEnd() + `\nquit\n`;

    // Add validation warnings at the beginning
    if (validationMsg) {
      full = validationMsg + full;
    }

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
              let block = parsed.onuBlock.trim();
              // Remove trailing quit if present to rebuild it
              block = block.replace(/\nquit\s*$/i, '');
              // Append iphost 2 and access-control if not present
              if (!/iphost\s+2\s+mode\s+dhcp/i.test(block)) {
                block += `\niphost 2 mode dhcp`;
              }
              if (!/iphost\s+2\s+service\s+management/i.test(block)) {
                block += `\niphost 2 service management`;
              }
              if (!/iphost\s+2\s+vlan\s+2989/i.test(block)) {
                block += `\niphost 2 vlan 2989`;
              }
              if (!/access-control\s+http/i.test(block)) {
                block += `\naccess-control http mode allowlan`;
              }
              if (!/access-control\s+telnet/i.test(block)) {
                block += `\naccess-control telnet mode blockall`;
              }
              if (!/access-control\s+ping/i.test(block)) {
                block += `\naaccess-control ping mode allowwan`;
              }
               if (!/access-control\s+https/i.test(block)) {
                block += `\naccess-control https mode allowlan`;
              }
              // Ensure quit at end
              snippet = block + '\nquit\n\n';
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
      {/* Warning Banner */}
      {showBanner && (
        <WarningBanner 
          onClose={handleBannerClose}
        />
      )}
      
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
                {compareConfigBefore && (
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
                {compareConfigAfter && (
                  <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 px-2 py-1 rounded text-xs mb-3">
                    ✓ File AFTER uploaded
                  </div>
                )}

                <button
                  onClick={performComparison}
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
                onClick={generateConfig}
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
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950"
            >
              <option value="single">Single ACS</option>
              <option value="multiple" >Multiple ACS</option>
              <option value="compare" >Compare Before After</option>
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
              <h2 className="font-semibold text-sm">{mode === "compare" ? "Comparison Result" : "Output Config"}</h2>
              <div className="flex items-center gap-2">
                {mode === 'compare' && (
                  <>
                    <button
                      onClick={() => { setCompareDisplay('all'); updateCompareDisplay('all'); }}
                      className={`text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg`}
                    >
                      Tampilkan Semua
                    </button>
                    <button
                      onClick={() => { setCompareDisplay('failed'); updateCompareDisplay('failed'); }}
                      className={`text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg`}
                    >
                      Tampilkan Gagal
                    </button>
                  </>
                )}
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
            </div>
            <textarea
              value={mode === "compare" ? compareResult : output}
              readOnly
              rows={22}
              className="flex-1 rounded-xl border p-3 font-mono text-sm dark:bg-slate-950"
              placeholder={mode === "compare" ? "Hasil perbandingan akan muncul di sini" : "Config migrasi akan muncul di sini"}
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

