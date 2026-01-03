import React, { useState, useEffect } from "react";

export default function WarningBanner({ onClose }) {
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4 rounded-t-lg flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">HARAP DIBACA DAN DIPAHAMI</h2>
          <button
            onClick={handleClose}
            disabled={countdown > 0}
            className={`p-2 rounded transition ${
              countdown > 0
                ? "cursor-not-allowed opacity-50"
                : "text-white hover:bg-red-700 cursor-pointer"
            }`}
            title={countdown > 0 ? "Tunggu hingga countdown selesai" : "Tutup banner"}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4 text-gray-800 dark:text-gray-200">
          <div className="space-y-3 text-sm">
            <p className="font-semibold">
              KERJAKAN DENGAN TELITI, KETIKA SELESAI PASTE CONFIG SELALU CEK KEMBALI JIKA <span className="font-bold text-red-600">ERROR</span> ATAU <span className="font-bold text-red-600">UNSUCCESSFULLY</span> WAJIB DIULANG.
            </p>

            <p className="font-semibold">
              KERJAKAN KERJAAN DENGAN PENUH KETELITIAN DAN TANGGUNG JAWAB.
            </p>

            <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
              <p className="text-xs italic text-gray-600 dark:text-gray-400 text-center">
                "Sesungguhnya Allah mencintai seseorang yang jika bekerja, ia menyempurnakannya." (HR. Al-Baihaqi)
              </p>
            </div>
          </div>
        </div>

        {/* Footer dengan Countdown */}
        <div className="bg-gray-100 dark:bg-gray-700 px-6 py-4 rounded-b-lg flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Countdown: <span className="font-bold text-red-600">{countdown}</span> detik
          </div>
          <button
            onClick={handleClose}
            disabled={countdown > 0}
            className={`px-4 py-2 rounded font-medium transition ${
              countdown > 0
                ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            }`}
          >
            Tutup Banner
          </button>
        </div>
      </div>
    </div>
  );
}
