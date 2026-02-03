import mongoose from "mongoose";
import Joi from "joi";

const subjectSchema = new mongoose.Schema({
    name: {
    type: String,
    required: true,
    trim: true,
    },
    instructor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    },
    stage: {
    type: String,
    required: true
    },
    department: {
    type: String,
    required: true
    }
}, { timestamps: true });


export function validateSubject(obj) {
const schema = Joi.object({
    name: Joi.string().trim().min(3).max(100).required(),
    instructor: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).required(),
    stage: Joi.string().trim().required(),
    department: Joi.string().trim().required()
});

return schema.validate(obj);
}

export default mongoose.model("Subject", subjectSchema);