import mongoose from "mongoose";

export async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI,{
            serverSelectionTimeoutMS: 5000
        });
        console.log("Connected to mongodb...");
    } catch (error) {
        console.log("Connection failed to mongodb!", error);
    }
}