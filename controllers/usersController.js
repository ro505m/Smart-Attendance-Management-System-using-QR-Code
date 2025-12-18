import mongoose from "mongoose";
import User, { validateAddUser, validateUpdateUser } from "../models/User.js"



/**
 *  @desc Get all students
 *  @route /api/users/students
 *  @method GET
 *  @access private (only admin)
 */
export const getAllStudents = async (req, res)=>{
    try{
        const users = await User.find({role: 1}).select('-otp -createdAt -updatedAt -subjects -__v -role');
        if (!users || users.length === 0)
            return res.status(404).json({message: "users is not found"})

        res.status(200).json(users)
    } catch(error){
        res.status(400).json({message: error.message})
    }
}

/**
 *  @desc Get all instructors
 *  @route /api/users/instructors
 *  @method GET
 *  @access private (only admin)
 */
export const getAllInstructors = async (req, res)=>{
    try{
        const users = await User.find({role: 2}).select('-otp -createdAt -updatedAt -subjects -__v -role');
        if (!users || users.length === 0)
            return res.status(404).json({message: "users is not found"})

        res.status(200).json(users)
    } catch(error){
        res.status(400).json({message: error.message})
    }
}

/**
 * @desc Add user
 * @route /api/auth/register
 * @method POST
 * @access public 
 */
export const AddUser = async (req, res) => {
    const {error} = validateAddUser(req.body)
    if(error)
        return res.status(400).json({message: error.details[0].message})

    try{

        let user = await User.findOne({email: req.body.email})
        if(user)
            return res.status(400).json({message: 'this is user already registered'})
        
        user = new User(req.body);
        await user.save();

        res.status(200).json({message: "user registered successfully."});
    } catch(error){
        res.status(500).json({message: error.message})
    }
}


/**
 *  @desc Get user by id
 *  @route /api/users/:id
 *  @method GET
 *  @access private (any)
 */
export const getUserById = async (req, res)=>{
    try{
        const users = await User.findById(req.params.id).select('-otp -createdAt -updatedAt -subjects -__v -_id');
        if (users === null || users.length === 0)
            return res.status(404).json({message: "user is not found"})
        res.status(200).json(users)
    } catch(error){
        res.status(400).json({message: error.message})
    }
}

/**
 *  @desc Update user
 *  @route /api/users/:id
 *  @method Put
 *  @access protected
 */
export const updateUser = async (req, res)=>{
    const {error} = validateUpdateUser(req.body)
    if (error)
        return res.status(400).json({message: error.details[0].message});

    try {
        const userId = req.params.id;
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid or missing user id in params" });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const existing = await User.findOne({ email: req.body.email });
        if (existing && existing._id.toString() !== userId) {
            return res.status(409).json({ message: "Email already in use by another account" });
        }

        if (req.body.stage && user.stage !== req.body.stage) {
            user.subjects = [];
        };
        user.name = req.body.name;
        user.email = req.body.email;
        user.stage = req.body.stage;
        user.department = req.body.department;

        const saved = await user.save();
        const safe = saved.toObject();
        delete safe.otp;
        delete safe.role;
        delete safe.subjects;
        delete safe.__v;
        delete safe.createdAt;
        delete safe.updatedAt;
        return res.status(200).json({ safe });

    } catch (error) {
        res.status(500).json({message: error.message})
    }
}

/**
 *  @desc Delete user
 *  @route /api/users/:id
 *  @method DELETE
 *  @access protected
 */
export const deleteUser = async (req, res)=>{
    try {
        let user = await User.findById(req.params.id);
        if(!user)
            return res.status(404).json({message: "the user is not found."})

        user = await User.findByIdAndDelete(req.params.id);
        res.status(200).json({message: "the user have been deleted successfully."})

    } catch (error) {
        res.status(500).json({message: error.message})
    }
}