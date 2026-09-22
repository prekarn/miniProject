const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const path = require("path");
const multer = require("multer");
const fs = require("fs");

require("dotenv").config();

const Product = require("./models/Product"); // นำเข้า Product Model
const Employee = require("./models/Employee");

const app = express();
//app.use(cors());
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);

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
    console.log("Emp Data:", newEmp);

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

//===================== Product ====================//
// 1. ตั้งค่า static folder ให้ฝั่ง React เรียกดูไฟล์รูปภาพที่อัปโหลดได้
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 2. ตั้งค่า Multer สำหรับ Save ไฟล์รูปภาพลงโฟลเดอร์ uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = "./uploads";
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir); // สร้างโฟลเดอร์ถ้ายังไม่มี
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // ตั้งชื่อไฟล์ป้องกันซ้ำโดยใช้ Timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ================= PRODUCT APIs ================= //

// 1. READ ALL PRODUCTS
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({
      message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า",
      error: err.message,
    });
  }
});

// 2. CREATE PRODUCT (พร้อม Auto proId และ Upload รูป)
app.post("/api/products", upload.single("img"), async (req, res) => {
  try {
    const { proName, detail, price } = req.body;

    // Logic รัน Auto proId (เช่น Pro001, Pro002)
    const lastProduct = await Product.findOne({
      proId: { $regex: /^Pro\d+$/ },
    }).sort({ createdAt: -1 });
    let nextNum = 1;
    if (lastProduct && lastProduct.proId) {
      const currentNum = parseInt(lastProduct.proId.replace("Pro", ""), 10);
      if (!isNaN(currentNum)) nextNum = currentNum + 1;
    }
    const generatedProId = `Pro${String(nextNum).padStart(3, "0")}`;

    // ชื่อไฟล์รูปถ้ามีการอัปโหลด
    const imgFilename = req.file ? req.file.filename : "";

    const newProduct = new Product({
      proId: generatedProId,
      proName,
      detail,
      price: Number(price),
      img: imgFilename,
    });

    await newProduct.save();
    res.status(201).json({ message: "เพิ่มสินค้าสำเร็จ", data: newProduct });
  } catch (err) {
    console.error("Create Product Error:", err);
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการเพิ่มสินค้า", error: err.message });
  }
});

// 3. UPDATE PRODUCT (แก้ไขข้อมูล/เปลี่ยนรูป)
app.put("/api/products/:id", upload.single("img"), async (req, res) => {
  try {
    const { proName, detail, price } = req.body;
    let updateData = { proName, detail, price: Number(price) };

    // ถ้ามีการเลือกรูปใหม่ ให้เปลี่ยนชื่อรูป และลบรูปเก่าออก
    if (req.file) {
      updateData.img = req.file.filename;

      const oldProduct = await Product.findById(req.params.id);
      if (oldProduct && oldProduct.img) {
        const oldImagePath = path.join(__dirname, "uploads", oldProduct.img);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath); // ลบรูปเก่า
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true },
    );
    res.json({ message: "อัปเดตข้อมูลสินค้าสำเร็จ", data: updatedProduct });
  } catch (err) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการอัปเดตสินค้า", error: err.message });
  }
});

// 4. DELETE PRODUCT (ลบสินค้าพร้อมรูป)
app.delete("/api/products/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (product && product.img) {
      const imagePath = path.join(__dirname, "uploads", product.img);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath); // ลบไฟล์รูปในเซิร์ฟเวอร์ด้วย
      }
    }
    res.json({ message: "ลบสินค้าสำเร็จ" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "เกิดข้อผิดพลาดในการลบสินค้า", error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
