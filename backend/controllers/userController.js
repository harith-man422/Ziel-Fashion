import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import userModel from "../models/userModel.js";

const smtpPassword = (process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: smtpPassword,
  },
});

const createToken = (id) => {
  return jwt.sign({id}, process.env.JWT_SECRET)
}

// Route for user login
const loginUser = async (req,res) => {
  try {  
    const {email, password} = req.body;
    const user = await userModel.findOne({email});

    if(!user) {
      return res.json({success:false, message: "User doesn't exist"})
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if(isMatch) {
      const token = createToken(user._id)
      res.json({success:true, token})
    }

    else {
      res.json({success:false, message: "Invalid credentials"})
    }
  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
 
}



// Route for user registration
const registerUser = async (req,res) => {
  try {
   const { name, email, password } = req.body;

   // Checking user already exists or not
   const exists = await userModel.findOne({email});
   if(exists) {
      return res.json({success:false, message: "User already exists"})
   }

   // Validating email format & strong password
   if(!validator.isEmail(email)) {
    return res.json({success:false, message: "Please enter a valid email"})
   }

   if(password.length < 8) {
    return res.json({success:false, message: "Password must be at least 8 characters long"})
   }

   // Hashing User password
   const salt = await bcrypt.genSalt(10);
   const hashedpassword = await bcrypt.hash(password, salt);

   const newUser = new userModel({
    name,
    email,
    password: hashedpassword
   })

   const user = await newUser.save()

   const token = createToken(user._id)

   res.json({success:true, token})

  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}



// Route for Admin login
const adminLogin = async (req,res) => {
  try {
    const {email, password} = req.body;

    if(email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      const token = jwt.sign(email+password, process.env.JWT_SECRET);
      res.json({success:true, token})
    } else {
      res.json({success:false, message: "Invalid credentials"});
    }
  } catch (error) {
    console.log(error);
    res.json({success:false, message: error.message})
  }
}

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email || !email.trim()) {
      return res.json({ success: false, message: 'Please enter your email address' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await userModel.findOne({ email: cleanEmail });

    if (!user) {
      return res.json({ success: false, message: 'No account found with this email' });
    }

    if (!process.env.SMTP_EMAIL || !process.env.SMTP_PASSWORD) {
      return res.json({
        success: false,
        message: 'Email sending is not configured. Add SMTP_EMAIL and SMTP_PASSWORD in the backend .env file.',
      });
    }

    const temporaryPassword = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6) + '!';
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(temporaryPassword, salt);
    await user.save();

    await transporter.sendMail({
      from: process.env.SMTP_EMAIL,
      to: user.email,
      subject: 'Your Forever Store Temporary Password',
      text: `Your temporary password is: ${temporaryPassword}\n\nPlease login and change it immediately after signing in.`,
    });

    return res.json({
      success: true,
      message: 'A temporary password has been sent to your email address.',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

export { loginUser, registerUser, adminLogin, forgotPassword }