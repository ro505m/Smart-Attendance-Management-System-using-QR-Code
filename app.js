import express from "express";
import { logger } from "./middlewares/logger.js";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import {notFound, errorHandler} from "./middlewares/errors.js";
import { connectDB } from "./config/db.js";
import authRouter from "./routes/authRoutes.js";
import attendanceRouter from "./routes/attendanceRoutes.js";
import subjectRouter from "./routes/subjectRoutes.js";
import reportRouter from "./routes/reportRoutes.js";
import userRouter from "./routes/userRoutes.js";

// init env
dotenv.config();

//connect to db
connectDB();

// init app
const app = express();

// Cores policy
app.use(cors())

// Apply middlaweres
app.use(express.json());
app.use(logger);

// Helmet
app.use(helmet());

//Routes
app.get("/api/test", (req, res) => {
  res.json({ message: "Server is live!" });
});

app.use("/api/auth", authRouter);
app.use("/api/attendance", attendanceRouter);
app.use("/api/subject", subjectRouter);
app.use("/api/reports", reportRouter);
app.use("/api/users", userRouter);


// Error middlawere
app.use(notFound);
app.use(errorHandler);
const PORT = process.env.PORT || 8000;

// Start server
app.listen(PORT, "0.0.0.0",()=>{
    console.log(`Server running in ${process.env.MODE_ENV} mode, on port: ${PORT}`);
})
