import bcrypt from 'bcrypt'
import User from '../models/user.js'
import jwt from 'jsonwebtoken'
import Resume from '../models/Resume.js'






const generateToken = (userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
    return token;
}


export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // check if required fields are present
        if (!name || !email || !password) {
            return res.status(400).json({
                message: "Missing required fields",
            });
        }

        //(check existing user, save user, etc.)
        const user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ mssg: "user already exist" })
        }

        //if user is not exist
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            name, email, password: hashedPassword
        })


        //return succes message
        const token = generateToken(newUser._id)
        newUser.password = undefined;

        return res.status(201).json({
            message: "User created successfully",
            token,
            user: newUser
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Server error",
        });
    }
};


//controllers for user login 
// post api for login 


export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // check if password is correct
    if (!user.comparePassword(password)) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // generate token
    const token = generateToken(user._id);

    // 🔧 FIX: hide password correctly
    user.password = undefined;

    return res.status(200).json({
      message: "Login successfully",
      token,
      user,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Login Server error",
    });
  }
};


//controllers for get user
// GET: api/user/data

export const getUserById = async (req, res) => {
    try {
       const userId = req.userId;
       const user = await User.findById(userId)

       //check if user exist 
       if(!user)
       {
           return res.status(500).json({
            message: " User not found",
          });
       }
        user.password = undefined
        return res.status(201).json({user});

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            message: " Login Server error",
        });
    }
};

//controller getting any user resume 
export const getUserResumes = async (req, res) => {
  try {
    const userId = req.userId;

    // return user resumes
    const resumes = await Resume.find({ userId })
    return res.status(200).json({ resumes })
  } catch (error) {
    return res.status(400).json({ message: error.message })
  }
}


