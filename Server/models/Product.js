const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    proId: { type: String, unique: true },
    proName: { type: String, required: true },
    detail: { type: String, default: "" },
    img: { type: String, default: "" }, // เก็บชื่อไฟล์รูป เช่น "1690000000000-image.jpg"
    price: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", productSchema, "product");
