import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const perm = user?.permission || "0000";

  // เช็คตำแหน่งตัวเลขใน permission
  const canAccessEmployee = perm[0] === "1";
  const canAccessCustomer = perm[1] === "1";
  const canAccessProduct = perm[2] === "1";
  const canAccessReport = perm[3] === "1";

  const handleLogout = () => {
    onLogout();
    navigate("/login");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/home">
          MiniProject
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Home แสดงเสมอ */}
            <li className="nav-item">
              <Link className="nav-link" to="/home">
                Home
              </Link>
            </li>

            {/* แสดงเมนูตาม Permission 4 หลัก */}
            {canAccessEmployee && (
              <li className="nav-item">
                <Link className="nav-link" to="/employee">
                  Employee
                </Link>
              </li>
            )}
            {canAccessCustomer && (
              <li className="nav-item">
                <Link className="nav-link" to="#">
                  Customer
                </Link>
              </li>
            )}
            {canAccessProduct && (
              <li className="nav-item">
                <Link className="nav-link" to="/product">
                  Product
                </Link>
              </li>
            )}
            {canAccessReport && (
              <li className="nav-item">
                <Link className="nav-link" to="#">
                  Report
                </Link>
              </li>
            )}
          </ul>
          {user && (
            <div className="d-flex align-items-center gap-3">
              <span className="text-light">
                👤 {user.empName} ({user.empId}) [Perm: {user.permission}]
              </span>
              <button
                className="btn btn-outline-danger btn-sm"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
