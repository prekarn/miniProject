import React from "react";

const Home = ({ user }) => {
  return (
    <div className="container mt-5">
      <div className="p-5 mb-4 bg-light rounded-3 shadow-sm">
        <div className="container-fluid py-3">
          <h1 className="display-5 fw-bold">ยินดีต้อนรับสู่ระบบ Dashboard</h1>
          <p className="col-md-8 fs-4">
            สวัสดีคุณ <strong>{user?.empName || "ผู้ใช้งาน"}</strong> (
            {user?.empId})
          </p>
          <hr />
          <p>
            สิทธิ์การใช้งานปัจจุบันของคุณคือ <code>{user?.permission}</code>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
