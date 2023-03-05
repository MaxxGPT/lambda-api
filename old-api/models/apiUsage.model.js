import mongoose from "mongoose";
const apiUsageSchema = new mongoose.Schema({
    totalRequest: {
        type: Number,
        default: 0
    },
    usage: {
        type: Number,
        default: 0
    },
    day: String,
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { collection: 'ApiUsage', timestamps: true });

export const ApiUsage = mongoose.model('ApiUsage', apiUsageSchema);