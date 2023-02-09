import mongoose from "mongoose";
const planSchema = new mongoose.Schema({
    name: String,
    isActive: {
        type: Boolean,
        default: true
    },
    type: String,
    quota: Number
}, { collection: 'Plan', timestamps: true });

export const Plan = mongoose.model('Plan', planSchema);