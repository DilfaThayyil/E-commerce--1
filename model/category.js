const mongoose = require('mongoose');

// Define the Category schema
const categorySchema = new mongoose.Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    Status: {
        type: String,
        enum: ["active", "blocked"],
        default: "active"
    }
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
