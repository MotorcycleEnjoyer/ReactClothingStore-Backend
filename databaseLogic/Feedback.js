const mongoose = require("mongoose")

const ratingsAndReviewsSchema = new mongoose.Schema({
    productId: Number, 
    reviewArray: [String],
    ratingArray: [Number]
})
const FeedbackModel = new mongoose.model("feedback", ratingsAndReviewsSchema)

module.exports = { FeedbackModel }