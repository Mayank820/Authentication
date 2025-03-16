import User from "../model/User.model.js"
import crypto from "crypto"
import nodemailer from "nodemailer"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const registerUser = async (req, res) => {
    // step 1:- get data 
    const { name, email, password, phoneNumber } = req.body
    // step 2:- validate
    if (!name || !email || !password || !phoneNumber) {
        return res.status(400).json({
            message: "All field are required"
        })
    }
    console.log(req.body);

    // step 3:- check if user already exist
    try {
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return res.status(400).json({
                error: "User already exists"
            })
        }

        // step 4:- create a user in database
        const user = await User.create({
            name, email, password, phoneNumber
        })

        console.log(user);

        if (!user) {
            return res.status(400).json({
                error: "User not register"
            })
        }

        // random token generator
        const token = crypto.randomBytes(32).toString("hex")
        console.log(token);
        // step 5:- create an verification token, one for user and another for database
        user.verificationToken = token
        await user.save()
        // step 7:- send token as email to user
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false, // true for port 465, false for other ports
            auth: {
                user: process.env.MAILTRAP_USERNAME,
                pass: process.env.MAILTRAP_PASSWORD,
            },
        });

        const mailOption = {
            from: process.env.MAILTRAP_SENDEREMAIL, // sender address
            to: user.email, // list of receivers
            subject: "Verify your email", // Subject line
            text: `Please click on the following link: 
            ${process.env.BASE_URL}/api/v1/users/verify/${token}
            `, // plain text body
            html: "<b>Please verify your email using the link. You can find verification link in this email. The link will expires within 24 hours </b>", // html body
        }

        await transporter.sendMail(mailOption)

        res.status(200).json({
            message: "User registered successfull",
            success: true
        })


    } catch (error) {
        res.status(400).json({
            message: "User not registerd",
            error,
            success: false
        })
    }
    // step 6:- send success status to user

}

const verifyUser = async (req, res) => {
    // // step 1:- get token from url
    // const { token } = req.params
    // // step 2:- validate token
    // if (!token) {
    //     return res.status(400).json({
    //         message: "Invalid token"
    //     })
    // }
    // // stpe 3:- find user based on token
    // const user = await User.findOne({ verificationToken: token })
    // // step 4:- if user not found   
    // if (!user) {
    //     return res.status(400).json({
    //         message: "Invalid token"
    //     })
    // }
    // // strp 5:- if user found then set isVerified field from User.model.js true
    // user.isVerified = true
    // // step 6:- remove verification token
    // user.verificationToken = null
    // // step 7:- retrun response
    // await user.save()

    const { token } = req.params;

    if (!token) {
        return res.status(400).json({ message: "Invalid token" });
    }
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
        return res.status(400).json({ message: "Invalid token" });
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
}

const loginUser = async (req, res) => {
    const { email, password } = req.body

    if (!email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        })
    }

    try {
        const user = await User.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: "Invaild email or password"
            })
        }

        const isMatch = await bcrypt.compare(password, user.password)  // 1. password:- The password that user gives, 2. user.password:- The passwrod that comes from database
        console.log(isMatch);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invaild email or password"
            })
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' })
        const cookieOptions = {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000
        }
        res.cookie("token", token, cookieOptions)
        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                phoneNumber: user.phoneNumber,
                role: user.role
            }
        })
        // console.log(req);

    } catch (error) {
        console.log("Login error", error);

        res.status(400).json({
            message: "Could not login",
            error,
            success: false
        })
    }

}

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-_id name phoneNumber role')

        if (!user) {
            return res.status(400).json({
                message: "User not found",
                success: false
            })
        }

        // console.log(res);


        res.status(200).json({
            success: true,
            user
        })

    } catch (error) {
        console.log("cannot get user profile", error.message);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error
        })
    }
}

const logoutUser = async (req, res) => {
    try {
        res.cookie("token", "", {})
        res.status(200).json({
            success: true,
            message: "Logged out successfully"
        })
    } catch (error) {
        console.log("cannot logout user profile", error.message);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error
        })
    }
}

const requestResetPassword = async (req, res) => {
    try {
        // step 1: - get email from user req.body
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }
        // step 2: - find user based on email 
        const user = await User.findOne({ email })
        console.log(user);
        
        // checking if user exists or not
        if (!user) {
            return res.status(400).json({
                message: "User not exists with this email"
            })
        }
        // step 3: - set the resetPasswordToken and resetPasswordExpires => Date.now() 10*60*1000:-  10 min
        // random token generator
        const token = crypto.randomBytes(32).toString("hex")
        console.log(token);

        user.resetPasswordToken = token
        user.resetPasswordExpires = Date.now() + 10 * 60 * 1000

        // step 4: - user.save()
        user.save()
        // step 5: - send email with token
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_PORT,
            secure: false, // true for port 465, false for other ports
            auth: {
                user: process.env.MAILTRAP_USERNAME,
                pass: process.env.MAILTRAP_PASSWORD,
            },
        });

        const mailOption = {
            from: process.env.MAILTRAP_SENDEREMAIL, // sender address
            to: user.email, // list of receivers
            subject: "Verify your email", // Subject line
            text: `Please click on the following link: 
            ${process.env.BASE_URL}/api/v1/users/reset-password/${token}
            `, // plain text body
            html: "<b>Please verify your email using the link. You can find verification link in this email. The link will expires within 10 minutes and reset your passowrd </b>", // html body
        }
        await transporter.sendMail(mailOption)

        res.status(200).json({ message: "Password reset link sent to your email" });

    } catch (error) {
        console.log("Password cannot reset", error.message);
        res.status(400).json({
            message: "Cannot send reset password token",
            error,
            success: false
        })
    }

}

const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: "Token and new password are required" });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
        });

        if (!user) {
            return res.status(400).json({ message: "Invalid or expired token" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // Clear reset token fields
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        res.status(200).json({ message: "Password reset successful" });
    } catch (error) {
        res.status(500).json({ message: "Error resetting password", error });
    }
}

const forgotPassword = async (req, res) => {
    // step 1: - collect token from params
    const { token } = req.params
    // step 2: - collect password from req.body 
    const { password } = req.body
    // step 3: - find user
    try {
        // $gt: it is an operator of mongodb as greater than operator
        const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: Date.now() } })

        // step 4: - set password in user

        // step 5: - reset the field: - 1. resetPasswordToken, 2. resetPasswordExpires

        // step 6: - user.save

    } catch (error) {
        console.log("cannot logout user profile", error.message);
        return res.status(500).json({
            message: "Internal server error",
            success: false,
            error
        })
    }

}

export { registerUser, verifyUser, loginUser, getProfile, logoutUser, resetPassword, forgotPassword, requestResetPassword }