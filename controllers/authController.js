import User, { validateOTP, validateLogin} from "../models/User.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();


/**
 * @desc verify OTP
 * @route /api/auth/verify-otp
 * @method POST
 * @access public 
 */
export const verifyOTP = async (req, res) => {
    try {
    const { error } = validateOTP(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    const { email, code } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({message: "user not found."});

    if (!user.otp || !user.otp.code)
        return res.status(400).json({message: "no OTP code found. Please request a new one."});

    if (new Date() > user.otp.expiresAt){
        user.otp = undefined;
        await user.save();
        return res.status(400).json({message: "expired OTP code. Please request a new one."});
    }
    const maxAttempts = 5; // maximum number of allowed attempts
    if (user.otp.attempts >= maxAttempts){
            user.otp = undefined;
            await user.save();
            return res.status(400).json({message: "too many incorrect attempts. Please request a new OTP code."});
    }

    if (user.otp.code !== code) {
        user.otp.attempts += 1;
        await user.save();
        return res.status(400).json({message: "invalid OTP code."});
    }

    user.otp = undefined;
    await user.save();
    const token = user.generateToken(req.headers['user-agent']);
    res.status(200).json({message: "your account has been verified successfully.", userId: user._id, userRole: user.role, token: token});
    } catch (error) {
    res.status(500).json({message: error.message});
    }
}

/**
 *  @desc Login User
 *  @route /api/auth/login
 *  @method POST
 *  @access public
 */
export const login = async (req, res)=>{
    const {error} = validateLogin(req.body)
    if (error)
        return res.status(400).json({message: error.details[0].message})

    try{
        let user = await User.findOne({email: req.body.email});
        if (!user)
            return res.status(400).json({message: "wrong data."});
        const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
        const expiresAt = new Date(Date.now() + 2 * 60 * 1000);
        user.otp = { code: otpCode, expiresAt, attempts: 0 };
        await user.save();
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
        to: user.email,
        subject: "Your Security Code",
        html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #eef1f6; padding: 40px;">
        <div style="max-width: 420px; margin: auto; background: #fff; border-radius: 14px; padding: 25px 30px; text-align: center; box-shadow: 0 6px 20px rgba(0,0,0,0.08);">
        <h2 style="color: #0f57ff; font-size: 22px; margin-bottom: 15px;">رمز التحقق الأمني</h2>
        <p style="font-size: 15px; color: #444; margin-bottom: 20px;">يرجى استخدام الرمز أدناه لإتمام عملية تسجيل الدخول الخاصة بك:</p>
        <div style="font-size: 34px; letter-spacing: 10px; font-weight: bold; margin: 25px 0; color: #0f57ff; background-color: #f1f5ff; padding: 10px 0; border-radius: 8px;">
        ${otpCode}
        </div>
        <p style="color: #777; font-size: 14px;">هذا الرمز صالح لمدة <strong>دقيقتين</strong> فقط، يرجى عدم مشاركته مع أي شخص.</p>
        </div>
        </div>
        `,
        });
        res.status(200).json({message: "A verification code has been sent to your email. Please verify your account using the code."});
    } catch(error){
        res.status(500).json({message: error.message});
    }
}