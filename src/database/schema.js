const mongoose = require("mongoose")

const veriData = mongoose.model("userInfo", mongoose.Schema({ userEmail: String, userName: String, userPassword: String }))

module.exports = { veriData }