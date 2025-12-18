import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import Joi from "joi";

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        trim: true
    },
    email: {
        type: String,
        required: true,
        minlength: 10,
        maxlength: 100,
        trim: true,
        unique: true,
    },
    otp: {
        code: {type: String},
        expiresAt: {type: Date},
        attempts: {type: Number, default: 0},
    },
    role: {
        type: Number,
        enum: [0,1,2], // 0: admin,  1: student 2: instructor,
        default: 1,
    },
    stage: {
        type: String,
        required: function() { return this.role === 1; },
        maxlength: 200,
        trim: true
    },
    subjects: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subject'
    }],
    department: {
        type: String,
        required: false,
        maxlength: 200,
        trim: true
    },
}, {timestamps: true})


//Generate Token
userSchema.methods.generateToken = function(userAgent){
    return jwt.sign({id: this._id, role: this.role, ip: userAgent }, process.env.JWT_SECRET_KEY, {expiresIn: '30d'});
}


const User = mongoose.model("User", userSchema);

export function validateAddUser(obj){
    const schema = Joi.object({
    name: Joi.string().trim().min(3).max(50).required(),
    email: Joi.string().trim().min(10).max(100).required(),
    role: Joi.valid(1, 2).default(1).required(),
    stage: Joi.string().max(200).when('role', { is: 2, then: Joi.optional(), otherwise: Joi.required()}).when('role', { is: 2, then: Joi.allow(""), otherwise: Joi.required()}),
    department: Joi.string().trim().max(200).when('role', { is: 2, then: Joi.optional(), otherwise: Joi.required()}).when('role', { is: 2, then: Joi.allow(""), otherwise: Joi.required()}),
    })
    return schema.validate(obj)
}

export function validateUpdateUser(obj){
    const schema = Joi.object({
    name: Joi.string().trim().min(3).max(50).optional(),
    email: Joi.string().trim().min(10).max(100).optional(),
    role: Joi.valid(1, 2).required(),
    stage: Joi.string().max(200).when('role', { is: 2, then: Joi.allow(""), otherwise: Joi.required()}),
    department: Joi.string().trim().max(200).when('role', { is: 2, then: Joi.allow(""), otherwise: Joi.required()}),
    })
    return schema.validate(obj)
}

export function validateOTP(obj){
    const schema = Joi.object({
    email: Joi.string().trim().min(10).max(100).required(),
    code: Joi.string().length(4).pattern(/^\d{4}$/).required(),
    })
    return schema.validate(obj)
}


export function validateLogin(obj){
    const schema = Joi.object({
    email: Joi.string().trim().min(10).max(100).required(),
    })
    return schema.validate(obj)
}

export default User;