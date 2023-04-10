const mongoose = require("mongoose")

const anonymousCartSchema = new mongoose.Schema({
    temporaryAnonCookie: String,
    shoppingCart: []
})
const AnonModel = new mongoose.model("AnonCart", anonymousCartSchema)