import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

const Employee = () => {
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({
    empName: "",
    empEmail: "",
    empPassword: "",
  });

  // เก็บ State สำหรับ Checkbox แต่ละเมนู
  const [permissions, setPermissions] = useState({
    employee: false,
    customer: false,
    product: false,
    report: false,
  });

  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ---------- Pagination State ----------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchEmployees = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/employees");
      setEmployees(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // จัดการการติ๊ก Checkbox แต่ละตัว
  const handleCheckboxChange = (e) => {
    setPermissions({
      ...permissions,
      [e.target.name]: e.target.checked,
    });
  };

  // ฟังก์ชันแปลง Object Checkbox เป็น String 4 หลัก (เช่น "1100")
  const permObjectToString = (permObj) => {
    const p1 = permObj.employee ? "1" : "0";
    const p2 = permObj.customer ? "1" : "0";
    const p3 = permObj.product ? "1" : "0";
    const p4 = permObj.report ? "1" : "0";
    return `${p1}${p2}${p3}${p4}`;
  };

  // ฟังก์ชันแปลง String 4 หลัก (เช่น "1100") กลับเป็น Object Checkbox
  const permStringToMap = (permStr = "0000") => {
    return {
      employee: permStr[0] === "1",
      customer: permStr[1] === "1",
      product: permStr[2] === "1",
      report: permStr[3] === "1",
    };
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (emp) => {
    setEditId(emp._id);
    setForm({
      empName: emp.empName,
      empEmail: emp.empEmail,
      empPassword: "",
    });
    // แปลง String permission เช่น "1100" กลับมาติ๊กที่ Checkbox
    setPermissions(permStringToMap(emp.permission));
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // แปลง Checkbox เป็น String ตัวเลข 4 หลักก่อนส่ง API
      const permissionString = permObjectToString(permissions);
      const payload = { ...form, permission: permissionString };

      if (editId) {
        await axios.put(
          `http://localhost:5000/api/employees/${editId}`,
          payload,
        );
        Swal.fire("สำเร็จ", "อัปเดตข้อมูลพนักงานเรียบร้อย", "success");
      } else {
        await axios.post("http://localhost:5000/api/employees", payload);
        Swal.fire(
          "สำเร็จ",
          "เพิ่มพนักงานเรียบร้อย (ระบบรัน empId อัตโนมัติ)",
          "success",
        );
      }
      setShowModal(false);
      resetForm();
      fetchEmployees();
    } catch (err) {
      Swal.fire(
        "เกิดข้อผิดพลาด",
        err.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้",
        "error",
      );
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: "ยืนยันการลบ?",
      text: "ข้อมูลนี้จะถูกลบออกจากระบบอย่างถาวร!",
      icon: "warning",
      showCancelButton: true,
      confirmColor: "#d33",
      cancelColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/employees/${id}`);
          Swal.fire("ลบแล้ว!", "ข้อมูลถูกลบเรียบร้อยแล้ว", "success");
          fetchEmployees();
        } catch (err) {
          Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลได้", "error");
        }
      }
    });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ empName: "", empEmail: "", empPassword: "" });
    setPermissions({
      employee: false,
      customer: false,
      product: false,
      report: false,
    });
  };

  // ---------- Logic การแบ่งหน้า (Pagination) ----------
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEmployees = employees.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(employees.length / itemsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2>จัดการข้อมูลพนักงาน (Employee Management)</h2>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          + เพิ่มพนักงานใหม่
        </button>
      </div>

      {/* ตารางแสดงข้อมูล */}
      <div className="table-responsive">
        <table className="table table-striped table-hover table-bordered align-middle">
          <thead className="table-dark">
            <tr>
              <th style={{ width: "10%" }}>Emp ID</th>
              <th style={{ width: "25%" }}>ชื่อ-นามสกุล</th>
              <th style={{ width: "25%" }}>อีเมล</th>
              <th style={{ width: "25%" }}>สิทธิ์ใช้งาน (Permission)</th>
              <th style={{ width: "15%" }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {currentEmployees.length > 0 ? (
              currentEmployees.map((emp) => {
                const p = permStringToMap(emp.permission);
                return (
                  <tr key={emp._id}>
                    <td>
                      <span className="badge bg-primary">{emp.empId}</span>
                    </td>
                    <td>{emp.empName}</td>
                    <td>{emp.empEmail}</td>
                    <td>
                      {/* แสดง Badge ชื่อเมนูตามสิทธิ์ที่มี */}
                      <div className="d-flex gap-1 flex-wrap">
                        {p.employee && (
                          <span className="badge bg-info text-dark">
                            Employee
                          </span>
                        )}
                        {p.customer && (
                          <span className="badge bg-success">Customer</span>
                        )}
                        {p.product && (
                          <span className="badge bg-warning text-dark">
                            Product
                          </span>
                        )}
                        {p.report && (
                          <span className="badge bg-secondary">Report</span>
                        )}
                        {!p.employee &&
                          !p.customer &&
                          !p.product &&
                          !p.report && (
                            <span className="badge bg-light text-muted border">
                              ไม่มีสิทธิ์
                            </span>
                          )}
                      </div>
                    </td>
                    <td>
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => handleOpenEditModal(emp)}
                      >
                        แก้ไข
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(emp._id)}
                      >
                        ลบ
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  ไม่พบข้อมูลพนักงาน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="d-flex justify-content-end">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage - 1)}
              >
                ย้อนกลับ
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <li
                  key={number}
                  className={`page-item ${currentPage === number ? "active" : ""}`}
                >
                  <button
                    className="page-link"
                    onClick={() => handlePageChange(number)}
                  >
                    {number}
                  </button>
                </li>
              ),
            )}
            <li
              className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
            >
              <button
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
              >
                ถัดไป
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Modal เพิ่ม/แก้ไข */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editId ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      name="empName"
                      className="form-control"
                      value={form.empName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">อีเมล</label>
                    <input
                      type="email"
                      name="empEmail"
                      className="form-control"
                      value={form.empEmail}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      รหัสผ่าน{" "}
                      {editId && (
                        <span className="text-muted fs-7">
                          (ว่างไว้ถ้าไม่เปลี่ยน)
                        </span>
                      )}
                    </label>
                    <input
                      type="password"
                      name="empPassword"
                      className="form-control"
                      value={form.empPassword}
                      onChange={handleChange}
                      required={!editId}
                    />
                  </div>

                  {/* สิทธิ์เข้าถึงเมนูแบบ Checkbox */}
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      การกำหนดสิทธิ์เข้าถึงเมนู
                    </label>
                    <div className="card p-3 bg-light">
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permEmployee"
                          name="employee"
                          checked={permissions.employee}
                          onChange={handleCheckboxChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="permEmployee"
                        >
                          เมนู Employee (พนักงาน)
                        </label>
                      </div>
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permCustomer"
                          name="customer"
                          checked={permissions.customer}
                          onChange={handleCheckboxChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="permCustomer"
                        >
                          เมนู Customer (ลูกค้า)
                        </label>
                      </div>
                      <div className="form-check mb-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permProduct"
                          name="product"
                          checked={permissions.product}
                          onChange={handleCheckboxChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="permProduct"
                        >
                          เมนู Product (สินค้า)
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="permReport"
                          name="report"
                          checked={permissions.report}
                          onChange={handleCheckboxChange}
                        />
                        <label
                          className="form-check-label"
                          htmlFor="permReport"
                        >
                          เมนู Report (รายงาน)
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    ยกเลิก
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editId ? "อัปเดตข้อมูล" : "บันทึกข้อมูล"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employee;
