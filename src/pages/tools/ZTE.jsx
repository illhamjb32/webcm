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

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    setUploadedFile(file || null);
  };

  const handleCompareFileUpload = (e, isAfter = false) => {
    const file = e.target.files && e.target.files[0];
    if (isAfter) setCompareAfterFile(file || null);
    else setCompareBeforeFile(file || null);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const clearAllData = () => {
    setLineProfile("");
    setServiceProfile("");
    setVlan("");
    setIphostRaw("");
    setSnList("");
    setCompareSNList("");
    setUploadedFile(null);
    setCompareBeforeFile(null);
    setCompareAfterFile(null);
    setOutput("");
    setCompareResult("");
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
                    <span className="text-sm">Line&Serv</span>
                  </label>
                  <label className={`flex items-center gap-2 px-2 py-1 rounded-xl cursor-pointer ${multipleViewMode === "gpon-onu" ? "bg-slate-100 dark:bg-slate-800" : ""}`}>
                    <input
                      type="radio"
                      name="multipleViewMode"
                      value="gpon-onu"
                      checked={multipleViewMode === "gpon-onu"}
                      onChange={(e) => setMultipleViewMode(e.target.value)}
                    />
                    <span className="text-sm">GPON-ONU</span>
                  </label>
                </div>

                <div className="max-h-64 overflow-y-auto border rounded-xl p-2 text-sm text-slate-500 dark:text-slate-400">
                  Belum ada SN untuk ditampilkan.
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    type="button"
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    CEK IP
                  </button>
                  <button
                    type="button"
                    className="text-xs bg-gray-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Clear Selection
                  </button>
                  <button
                    type="button"
                    className="text-xs bg-yellow-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Check +10
                  </button>
                  <button
                    type="button"
                    className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Check All
                  </button>
                  <button
                    type="button"
                    className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg"
                  >
                    Export Config
                  </button>
                </div>
                <div className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  <span>Total: 0</span>
                  <span className="ml-4">Checked: 0</span>
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
