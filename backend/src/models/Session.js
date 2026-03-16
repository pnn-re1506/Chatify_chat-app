import mongoose from "mongoose";

const SessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index:true,
    },
    refreshToken: {
        type: String,
        required: true,
        unique:true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
},
{timestamps:true}
);

//create index for expiresAt to automatically delete expired sessions
SessionSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

const Session = mongoose.model("Session", SessionSchema);
export default Session;