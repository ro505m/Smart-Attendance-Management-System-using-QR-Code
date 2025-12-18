import jwt from "jsonwebtoken";
import Attendance from "../models/Attendance.js";
import User from "../models/User.js";
import Subject from "../models/Subject.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


/**
 *  @desc Generate QR Token
 *  @route /api/attendance/generate-session/:id
 *  @method POST
 *  @access public
 */
export const generateQRSession = async (req, res) => {
    try {
    const subjectId = req.params.id; // get subject id from params
    const userId = req.body.userId;

    const subjectName = await Subject.findById(subjectId).select("name");
    if (!subjectName || subjectName.length === 0)
        return  res.status(404).json({ message: "subjectId is not found" });

    const user = await User.findById(userId);
    // check if user is instructor
    if (!user || user.role !== 2)
        return res.status(403).json({ message: "Only instructors can generate QR sessions" });

    // check if attendance already marked today
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        //check if attendance record exists for today
        const exists = await Attendance.findOne({
            subject: subjectId,
            date: { $gte: todayStart, $lte: todayEnd }
        });
        if (exists) {
        return res.status(400).json({ message: "Attendance has already been marked for today" });
        }

        const getAllStudents = await User.find({ subjects: subjectId }); // get all students
        if (getAllStudents.length === 0) {
            return res.status(404).json({ message: "No students found for this subject" });
        }
        const students = getAllStudents.map(s =>(
        {
            student: s._id,
            status: "absent",

        }
        ));

        await getAllStudents.forEach(async (student) => {
        // send email to each student
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: student.email,
        subject: "Lecture Attendance Alert",
        html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; padding: 20px; border-radius: 10px; border: 1px solid #ddd;">
            <p style="font-weight: bold; font-size: 1.1em; color: #333;">Dear ${student.name},</p>
            <p style="color: #555;">
                This is to inform you that attendance for your lecture in the subject <strong>${subjectName.name}</strong> is now open. 
                Please make sure to mark your attendance promptly. You have <strong>30 minutes</strong> to complete it.
            </p>
            <p style="margin-top: 5px; color: #555;">
                Best regards,<br/>
                <span style="font-weight: bold; color: #007acc;">Attendance Management System</span>
            </p>
        </div>
        `,
        });
    });
    // create new attendance record
    const attendance = new Attendance({
        subject: subjectId,
        students: students
    });
    await attendance.save();

    // generate JWT token
    const session = jwt.sign(
        {
        instructorId: userId,
        attendanceId: attendance._id,
        exp: Math.floor(Date.now() / 1000) + 30 * 60,
        },
        process.env.JWT_SECRET_KEY
    );

    res.status(200).json({ session });
    } catch (error) {
    res.status(500).json({ message: error.message });
    }
};



/**
 *  @desc Mark Attendance
 *  @route /api/attendance/mark
 *  @method POST
 *  @access public
 */
export const markAttendance = async (req, res) => {
    try {
        const { session, userId } = req.body;

        const decoded = jwt.verify(session, process.env.JWT_SECRET_KEY);
        const { attendanceId } = decoded;
        
        // check if user is student
        const student = await User.findById(userId);
        if (!student || student.role !== 1)
            return res.status(403).json({ message: "Only students can mark attendance" });

        //check if attendance record exists for today
        const exists = await Attendance.findById(attendanceId);

        // mark student in attendance
        if (exists){
            // add student to existing attendance record
            const studentRecord = exists.students.find(s => s.student.toString() === userId);
            if (!studentRecord)
                return res.status(404).json({ message: "Student not found in attendance record" });

            if (studentRecord.status === "present" || studentRecord.status === "leave") {
                return res.status(200).json({ message: "Attendance already marked for today" });
            }

            studentRecord.status = "present";
            await exists.save();
            return res.status(200).json({ message: "Attendance marked successfully" });
        }

    } catch (error) {
        res.status(400).json({ message: "Invalid or expired QR code" });
    }
};


/**
 *  @desc Mark Attendance
 *  @route /api/attendance/mark/leave
 *  @method POST
 *  @access public
 */
export const markAttendanceForLeave = async (req, res) => {
    try {
        const { attendanceId, userId } = req.body;
        
        // check if user is student
        const student = await User.findById(userId);
        if (!student || student.role !== 1)
            return res.status(403).json({ message: "Only student can mark this attendance" });

        //check if attendance record exists for today
        const exists = await Attendance.findById(attendanceId);

        // mark student in attendance
        if (exists){
            // add student to existing attendance record
            const studentRecord = exists.students.find(s => s.student.toString() === userId);
            if (!studentRecord)
                return res.status(404).json({ message: "Student not found in attendance record" });

            if (studentRecord.status === "present" || studentRecord.status === "leave") {
                return res.status(200).json({ message: "Attendance already marked for today" });
            }

            studentRecord.status = "leave";
            await exists.save();
            return res.status(200).json({ message: "Attendance marked successfully" });
        }

    } catch (error) {
        res.status(400).json({ message: "Invalid or expired QR code" });
    }
};