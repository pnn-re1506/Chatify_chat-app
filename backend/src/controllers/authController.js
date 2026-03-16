import bcrypt from "bcrypt";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import Session from "../models/Session.js";

const ACCESS_TOKEN_TTL = "30m";
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000;

export const signUp = async (req, res) => {
    try {
        const { username, password, email, firstName, lastName } = req.body;

        if (!username || !password || !email || !firstName || !lastName) {
            return res.status(400).json({ message: "All fields are required" });
        }

        //check if user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists" });
        }

        //encrypt password
        const hashedPassword = await bcrypt.hash(password, 10); //salt = 10

        //create new user
        await User.create({
            username,
            hashedPassword,
            email,
            displayName: `${firstName} ${lastName}`,
        });

        //return
        return res.status(204).json({ message: "User created successfully" });

    }
    catch (error) {
        console.error("Error in signUp:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const signIn = async (req, res) => {
    try {
        //get username and password from request body
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        //check if user exists
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        //check if password is valid
        const isPasswordValid = await bcrypt.compare(password, user.hashedPassword);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        //create  access token with JWT
        const accessToken = jwt.sign(
            { userId: user._id },
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_TTL }
        );

        //create refresh token with JWT
        const refreshToken = crypto.randomBytes(64).toString("hex");

        //create new session to save refresh token
        await Session.create({
            userId: user._id,
            refreshToken,
            expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
        });

        //store refresh token in http-only cookie
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none", // backend and front end are on different domains
            maxAge: REFRESH_TOKEN_TTL,
        });

        //return access token
        return res.status(200).json({ message: `User ${user.displayName} signed in successfully`, accessToken });

    }
    catch (error) {
        console.error("Error in signIn:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const signOut = async (req, res) => {
    try {
        //get refresh token from cookie
        const token = req.cookies?.refreshToken;

        if (token) {
            //delete refresh token from database and clear the refresh token cookie
            await Session.deleteOne({ refreshToken: token });
            res.clearCookie("refreshToken");
        }
        return res.sendStatus(204);

    } catch (error) {
        console.error("Error in signOut:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}