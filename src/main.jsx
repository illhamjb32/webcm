import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import "./index.css";

// Pages
import LoginPage from "./App";
import Dashboard from "./Dashboard";

// Config → Aktivasi vendors
import HuaweiAktivasi from "./pages/config/aktivasi/huawei";
import RaisecomAktivasi from "./pages/config/aktivasi/raisecom";
import BDCOMAktivasi from "./pages/config/aktivasi/bdcom";
import ZTEAktivasi from "./pages/config/aktivasi/zte";
//import FiberhomeAktivasi from "./pages/config/aktivasi/Fiberhome";

// (Optional) menu lain jika sudah ada file-nya
// import FlowKerja from "./pages/FlowKerja";
// import LinkKerja from "./pages/LinkKerja";
// import Tools from "./pages/Tools";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* Auth */}
      <Route path="/" element={<LoginPage />} />

      {/* Dashboard home */}
      <Route path="/dashboard" element={<Dashboard />} />

      {/* Config → Aktivasi (vendors) */}
      <Route path="/dashboard/config/aktivasi/huawei" element={<HuaweiAktivasi />} />
      <Route path="/dashboard/config/aktivasi/raisecom" element={<RaisecomAktivasi />} />
      <Route path="/dashboard/config/aktivasi/bdcom" element={<BDCOMAktivasi />} />
      <Route path="/dashboard/config/aktivasi/zte" element={<ZTEAktivasi />} />
    

      {/* (Optional) menu lain */}
      {/* <Route path="/dashboard/flow-kerja" element={<FlowKerja />} /> */}
      {/* <Route path="/dashboard/link-kerja" element={<LinkKerja />} /> */}
      {/* <Route path="/dashboard/tools" element={<Tools />} /> */}
    </Routes>
  </BrowserRouter>
);
