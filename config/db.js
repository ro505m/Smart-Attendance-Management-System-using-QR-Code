import mongoose from "mongoose";

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to mongodb...");
    } catch (error) {
        console.log("Connection failed to mongodb!", error);
    }
}