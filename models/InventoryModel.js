// Import mongoose
const mongoose = require('mongoose');

// Schema
const InventorySchema = new mongoose.Schema(
    {
        ItemType: {
            type: String,
            required: true
        },
        StockAvailable: {
            type: Number,
            required: true
        }
        
    }
)

// Model
const InventoryModel = mongoose.model('Inventory', InventorySchema);

// Export
module.exports = InventoryModel;