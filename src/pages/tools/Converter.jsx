import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Converter() {
  const navigate = useNavigate();
  const [sn, setSn] = useState("");
  const [result, setResult] = useState("");
  const [mac, setMac] = useState("");
  const [macResult, setMacResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [macCopied, setMacCopied] = useState(false);

  const snPrefixes = {
    BDCM: "4244434D",
    ZTEG: "5A544547",
    ELWG: "5A544547",
    ZIXC: "5A544547",
    AISF: "41495346",
    RCMG: "52434D47"
  };

  const convertToHex = () => {
    if (!sn) return;
    
    const upperSN = sn.toUpperCase();
    
    for (const [prefix, hexPrefix] of Object.entries(snPrefixes)) {
      if (upperSN.startsWith(prefix)) {
        const remaining = upperSN.slice(prefix.length);
        setResult(hexPrefix + remaining);
        return;
      }
    }
    
    setResult(upperSN);
  };

  const convertMac = () => {
    if (!mac) return;
    
    const cleaned = mac.replace(/[^a-fA-F0-9]/g, '');
    const formatted = cleaned.match(/.{1,2}/g)?.join(':') || '';
    setMacResult(formatted);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyMacToClipboard = () => {
    navigator.clipboard.writeText(macResult);
    setMacCopied(true);
    setTimeout(() => setMacCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/70 backdrop-blur">
        <nav className="mx-auto max-w-6xl px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
          >
            ← Back
          </button>
          <h1 className="font-semibold">Converter</h1>
        </nav>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* HEXA SN Converter */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold">HEXA SN Converter</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">Serial Number</label>
            <input
              type="text"
              value={sn}
              onChange={(e) => setSn(e.target.value)}
              placeholder="Masukan SN"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            onClick={convertToHex}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
          >
            Convert to Hexa
          </button>

          {result && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Result</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={result}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-mono"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}

          <div className="text-xs text-slate-500 space-y-1 pt-4 border-t border-slate-200 dark:border-slate-800">
            <p className="font-semibold">Prefix Mapping:</p>
            <p>BDCM → 4244434D</p>
            <p>ZTEG/ELWG/ZIXC → 5A544547</p>
            <p>AISF → 41495346</p>
            <p>RCMG → 52434D47</p>
          </div>
        </div>

        {/* MAC Address Converter */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
          <h2 className="text-lg font-semibold">MAC Address Converter</h2>
          
          <div>
            <label className="block text-sm font-medium mb-2">MAC Address</label>
            <input
              type="text"
              value={mac}
              onChange={(e) => setMac(e.target.value)}
              placeholder="Masukan MAC Address"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950/60 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <button
            onClick={convertMac}
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium py-3"
          >
            Convert MAC
          </button>

          {macResult && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Result</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={macResult}
                  readOnly
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-mono"
                />
                <button
                  onClick={copyMacToClipboard}
                  className="px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm"
                >
                  {macCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
