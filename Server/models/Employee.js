const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema(
  {
    empId: { type: String, unique: true, required: true },
    empName: { type: String, required: true },
    empEmail: { type: String, required: true, unique: true },
    empPassword: { type: String, required: true },
    permission: { type: String, default: "0000", length: 4 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Employee", employeeSchema, "employee");
