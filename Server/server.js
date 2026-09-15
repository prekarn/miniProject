const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const Employee = require("./models/Employee");

const app = express();
app.use(cors());
app.use(express.json());

// เชื่อมต่อ MongoDB
mongoose
  .connect(process.env.MONGO_URI || "mongodb://localhost:27017/miniProject")
  .then(() => console.log("MongoDB Connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// ================= API ROUTES ================= //

// 1. API REGISTER / CREATE EMPLOYEE (จัดการ autoID ในนี้)
app.post("/api/employees", async (req, res) => {
  try {
    const { empName, empEmail, empPassword, permission } = req.body;

    // ตรวจสอบค่าที่ส่งเข้ามา
    if (!empName || !empEmail || !empPassword) {
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
    }

    // ตรวจสอบอีเมลซ้ำ
    const existingUser = await Employee.findOne({ empEmail });
    if (existingUser) {
      return res.status(400).json({ message: "อีเมลนี้ถูกใช้งานแล้ว" });
    }

    // ==========================================
    // LOGIC สร้าง Auto ID (Emp001, Emp002, ...)
    // ==========================================
    // ดึงพนักงานคนล่าสุดโดยเรียงจาก createdAt ล่าสุด
    const lastEmp = await Employee.findOne().sort({ createdAt: -1 });

    let nextNum = 1;
    if (lastEmp && lastEmp.empId) {
      // ดึงตัวเลขหลังคำว่า 'Emp' ออกมาเปลี่ยนเป็น Integer
      const currentNum = parseInt(lastEmp.empId.replace("Emp", ""), 10);
      if (!isNaN(currentNum)) {
        nextNum = currentNum + 1;
      }
    }

    // เติม 0 ด้านหน้าให้ครบ 3 หลัก เช่น Emp001
    const generatedEmpId = `Emp${String(nextNum).padStart(3, "0")}`;

    // พิมพ์ตรวจสอบค่าใน Terminal
    console.log("Generated Auto ID:", generatedEmpId);

    // ==========================================
    // เข้ารหัส Password และบันทึกข้อมูล
    // ==========================================
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(empPassword, salt);

    const newEmp = new Employee({
      empId: generatedEmpId, // ใส่ empId ที่คำนวณได้ตรงนี้
      empName,
      empEmail,
      empPassword: hashedPassword,
      permission: permission || "0000",
    });

    await newEmp.save();
    res
      .status(201)
      .json({ message: "เพิ่มข้อมูลพนักงานเรียบร้อยแล้ว", data: newEmp });
  } catch (err) {
    console.error("Create Employee Error:", err);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล", error: err.message });
  }
});

// 2. API LOGIN
app.post("/api/login", async (req, res) => {
  try {
    const { empEmail, empPassword } = req.body;

    const user = await Employee.findOne({ empEmail });
    if (!user) {
      return res.status(400).json({ message: "ไม่พบบัญชีผู้ใช้นี้ในระบบ" });
    }

    const isMatch = await bcrypt.compare(empPassword, user.empPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "รหัสผ่านไม่ถูกต้อง" });
    }

    // สร้าง Token
    const token = jwt.sign(
      {
        id: user._id,
        empId: user.empId,
        empName: user.empName,
        permission: user.permission,
      },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "1d" },
    );

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      token,
      user: {
        empId: user.empId,
        empName: user.empName,
        empEmail: user.empEmail,
        permission: user.permission,
      },
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ", error: err.message });
  }
});

// 3. API READ ALL EMPLOYEES
app.get("/api/employees", async (req, res) => {
  try {
    const employees = await Employee.find({}, "-empPassword"); // ปิดไม่ส่ง password กลับไป
    res.json(employees);
  } catch (err) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูล", error: err.message });
  }
});

// 4. API UPDATE EMPLOYEE
app.put("/api/employees/:id", async (req, res) => {
  try {
    const { empName, empEmail, empPassword, permission } = req.body;
    let updateData = { empName, empEmail, permission };

    // ถ้ามีการแก้ไขรหัสผ่าน ให้ทำการ Hash ใหม่
    if (empPassword) {
      const salt = await bcrypt.genSalt(10);
      updateData.empPassword = await bcrypt.hash(empPassword, salt);
    }

    const updatedEmp = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    ).select("-empPassword");
    res.json({ message: "อัปเดตข้อมูลสำเร็จ", data: updatedEmp });
  } catch (err) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูล", error: err.message });
  }
});

// 5. API DELETE EMPLOYEE
app.delete("/api/employees/:id", async (req, res) => {
  try {
    await Employee.findByIdAndDelete(req.params.id);
    res.json({ message: "ลบข้อมูลสำเร็จ" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการลบข้อมูล", error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
