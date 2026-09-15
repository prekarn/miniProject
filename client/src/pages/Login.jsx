import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

const Login = ({ onLoginSuccess }) => {
  const [empEmail, setEmpEmail] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("http://localhost:5000/api/login", {
        empEmail,
        empPassword,
      });

      Swal.fire({
        icon: "success",
        title: "เข้าสู่ระบบสำเร็จ!",
        text: `ยินดีต้อนรับ ${res.data.user.empName}`,
        timer: 1500,
        showConfirmButton: false,
      });

      onLoginSuccess(res.data.user, res.data.token);
      navigate("/home");
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เข้าสู่ระบบล้มเหลว",
        text: err.response?.data?.message || "เกิดข้อผิดพลาด",
      });
    }
  };

  return (
    <div className="container mt-5 d-flex justify-content-center">
      <div className="card shadow p-4" style={{ width: "400px" }}>
        <h3 className="text-center mb-4">เข้าสู่ระบบ (Login)</h3>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={empEmail}
              onChange={(e) => setEmpEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={empPassword}
              onChange={(e) => setEmpPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary w-100">
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
