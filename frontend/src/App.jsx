import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Flights from "./pages/Flights";
import Schedule from "./pages/Schedule";
import Approvals from "./pages/Approvals";
import Resources from "./pages/Resources";
import Agents from "./pages/Agents";
import Audit from "./pages/Audit";

function Protected({ children }) {
  return localStorage.getItem("airport_token") ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<Protected><Layout /></Protected>}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/flights" element={<Flights />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/agents" element={<Agents />} />
        <Route path="/audit" element={<Audit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
