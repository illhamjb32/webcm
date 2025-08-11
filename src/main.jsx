import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import "./index.css";

// Pages
import LoginPage from "./App";
import Dashboard from "./Dashboard";

// Config → Aktivasi (vendors)
import HuaweiAktivasi from "./pages/config/aktivasi/huawei";
import RaisecomAktivasi from "./pages/config/aktivasi/raisecom";
import BDCOMAktivasi from "./pages/config/aktivasi/bdcom";
import ZTEAktivasi from "./pages/config/aktivasi/zte";
// Jika halaman Fiberhome sudah ada, un-comment baris di bawah:
// import FiberhomeAktivasi from "./pages/config/aktivasi/Fiberhome";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        {/* Auth */}
        <Route path="/" element={<LoginPage />} />

        {/* Dashboard home */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Config → Aktivasi */}
        <Route path="/dashboard/config/aktivasi/huawei" element={<HuaweiAktivasi />} />
        <Route path="/dashboard/config/aktivasi/raisecom" element={<RaisecomAktivasi />} />
        <Route path="/dashboard/config/aktivasi/bdcom" element={<BDCOMAktivasi />} />
        <Route path="/dashboard/config/aktivasi/zte" element={<ZTEAktivasi />} />
        {/* <Route path="/dashboard/config/aktivasi/fiberhome" element={<FiberhomeAktivasi />} /> */}
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
