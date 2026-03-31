import mongoose from "mongoose";
 const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique:true,
        trim:true,
        lowercase:true,
    },

    hashedPassword: {
        type: String,
        required: false,
    },

    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },

    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local",
    },

    email: {
        type: String,
        required: true,
        unique:true,
        trim:true,
        lowercase:true,
    },

    displayName: {
        type: String,
        required: true,
        trim:true,
    },

    avatarUrl: {
        type: String,
    },

    avatarId: {
        type: String,
    },

    bio: {
        type: String,
        maxlength: 500,
    },
    phoneNumber: {
        type: String,
        sparse:true,
    },
 }, {
    timestamps:true,
    
 });

 const User = mongoose.model("User", UserSchema);
 export default User;