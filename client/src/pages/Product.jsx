import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import "bootstrap/dist/css/bootstrap.min.css";

const Product = () => {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ proName: "", detail: "", price: "" });
  const [file, setFile] = useState(null);
  const [previewImg, setPreviewImg] = useState("");

  const [editId, setEditId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // ---------- Pagination State ----------
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // ปรับจำนวนต่อหน้าเป็น 8 ชิ้น (แสดงผลพอดี 2 แถว แถวละ 4 ชิ้น)

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/products");
      setProducts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // จัดการการเลือกไฟล์รูปภาพ
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewImg(URL.createObjectURL(selectedFile));
    }
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (pro) => {
    setEditId(pro._id);
    setForm({
      proName: pro.proName,
      detail: pro.detail || "",
      price: pro.price,
    });
    setFile(null);
    setPreviewImg(pro.img ? `http://localhost:5000/uploads/${pro.img}` : "");
    setShowModal(true);
  };

  // บันทึก / อัปเดต ข้อมูล
  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("proName", form.proName);
    formData.append("detail", form.detail);
    formData.append("price", form.price);
    if (file) {
      formData.append("img", file);
    }

    try {
      if (editId) {
        await axios.put(
          `http://localhost:5000/api/products/${editId}`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        Swal.fire("สำเร็จ", "อัปเดตข้อมูลสินค้าเรียบร้อย", "success");
      } else {
        await axios.post("http://localhost:5000/api/products", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        Swal.fire("สำเร็จ", "เพิ่มสินค้าเรียบร้อยแล้ว", "success");
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (err) {
      Swal.fire(
        "เกิดข้อผิดพลาด",
        err.response?.data?.message || "ไม่สามารถบันทึกข้อมูลได้",
        "error",
      );
    }
  };

  // ลบข้อมูล
  const handleDelete = (id) => {
    Swal.fire({
      title: "ยืนยันการลบสินค้า?",
      text: "ข้อมูลนี้และรูปภาพจะถูกลบออกจากระบบ!",
      icon: "warning",
      showCancelButton: true,
      confirmColor: "#d33",
      cancelColor: "#3085d6",
      confirmButtonText: "ใช่, ลบเลย!",
      cancelButtonText: "ยกเลิก",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`http://localhost:5000/api/products/${id}`);
          Swal.fire("ลบแล้ว!", "ข้อมูลสินค้าถูกลบเรียบร้อยแล้ว", "success");
          fetchProducts();
        } catch (err) {
          Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถลบข้อมูลได้", "error");
        }
      }
    });
  };

  const resetForm = () => {
    setEditId(null);
    setForm({ proName: "", detail: "", price: "" });
    setFile(null);
    setPreviewImg("");
  };

  // ---------- Pagination Logic ----------
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(products.length / itemsPerPage);

  return (
    <div className="container mt-4 mb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>รายการสินค้า (Product Gallery)</h2>
        <button className="btn btn-success" onClick={handleOpenAddModal}>
          + เพิ่มสินค้าใหม่
        </button>
      </div>

      {/* ================= Grid แสดงสินค้า 4 ชิ้น/แถว ================= */}
      {currentProducts.length > 0 ? (
        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4">
          {currentProducts.map((pro) => (
            <div className="col" key={pro._id}>
              <div className="card h-100 shadow-sm border-0 position-relative">
                {/* Badge แสดง Pro ID บนมุมรูป */}
                <span className="badge bg-secondary position-absolute top-0 start-0 m-2">
                  {pro.proId}
                </span>

                {/* รูปภาพสินค้า */}
                <div
                  style={{ height: "200px", overflow: "hidden" }}
                  className="bg-light d-flex align-items-center justify-content-center rounded-top"
                >
                  {pro.img ? (
                    <img
                      src={`http://localhost:5000/uploads/${pro.img}`}
                      alt={pro.proName}
                      className="card-img-top h-100 w-100"
                      style={{ objectFit: "contain" }} // ถ้า objectFit : "cover" รูปจะเต็มกรอบและจะถูกตัดบางส่วนออกไป
                    />
                  ) : (
                    <span className="text-muted">ไม่มีรูปภาพ</span>
                  )}
                </div>

                {/* รายละเอียดสินค้า */}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title text-truncate" title={pro.proName}>
                    {pro.proName}
                  </h5>
                  <p
                    className="card-text text-muted small flex-grow-1"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {pro.detail || "ไม่มีรายละเอียดเพิ่มเติม"}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <span className="fs-5 fw-bold text-success">
                      ฿{Number(pro.price).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* ปุ่มจัดการ Edit / Delete */}
                <div className="card-footer bg-transparent border-top-0 d-flex gap-2 mb-2">
                  <button
                    className="btn btn-outline-warning btn-sm w-50"
                    onClick={() => handleOpenEditModal(pro)}
                  >
                    แก้ไข
                  </button>
                  <button
                    className="btn btn-outline-danger btn-sm w-50"
                    onClick={() => handleDelete(pro._id)}
                  >
                    ลบ
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-5 text-muted bg-light rounded">
          <h4>ไม่พบข้อมูลสินค้า</h4>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="d-flex justify-content-end mt-4">
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
              <button
                className="page-link"
                onClick={() => setCurrentPage(currentPage - 1)}
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
                    onClick={() => setCurrentPage(number)}
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
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                ถัดไป
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Modal เพิ่ม/แก้ไข สินค้า */}
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
                  {editId ? "แก้ไขข้อมูลสินค้า" : "เพิ่มสินค้าใหม่"}
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
                    <label className="form-label">ชื่อสินค้า</label>
                    <input
                      type="text"
                      name="proName"
                      className="form-control"
                      value={form.proName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">ราคา (บาท)</label>
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="any"
                      className="form-control"
                      value={form.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">รายละเอียดสินค้า</label>
                    <textarea
                      name="detail"
                      rows="3"
                      className="form-control"
                      value={form.detail}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">รูปภาพสินค้า</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="form-control"
                      onChange={handleFileChange}
                    />
                  </div>

                  {/* Preview รูปภาพ */}
                  {previewImg && (
                    <div className="text-center my-2">
                      <p className="mb-1 text-muted fs-7">ตัวอย่างรูปภาพ:</p>
                      <img
                        src={previewImg}
                        alt="Preview"
                        className="img-thumbnail"
                        style={{ maxHeight: "150px" }}
                      />
                    </div>
                  )}
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
                    {editId ? "อัปเดตสินค้า" : "บันทึกสินค้า"}
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

export default Product;
