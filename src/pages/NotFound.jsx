import React from "react";
import { Link, useNavigate } from "react-router-dom";
import wifiIcon from "../assets/wifi.svg";

export default function NotFound() {
  const navigate = useNavigate();

  // Check auth
  React.useEffect(() => {
    if (!sessionStorage.getItem("auth")) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        {/* Icon */}
        <div className="mb-6">
          <div className="h-20 w-20 mx-auto rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* 404 Text */}
        <h1 className="text-6xl font-bold mb-2 text-slate-300 dark:text-slate-700">
          404
        </h1>
        <h2 className="text-2xl font-semibold mb-3">Page Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8">
          Halaman yang kamu cari belum tersedia atau masih dalam pengembangan.
        </p>

        {/* Status */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-4 mb-6 text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <span className="text-amber-600 dark:text-amber-400">🔧</span>
            </div>
            <div>
              <p className="text-sm font-medium">Status: Development</p>
            </div>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Halaman ini sedang dalam pengembangan dan akan segera hadir.
          </p>
        </div>

        {/* Back Button */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
