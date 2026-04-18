import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Conversation",
        required: true,
        index: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
        trim: true,
    },
    imgUrl: {
        type: String,
    },
    reactions: [{
        emoji: { type: String, required: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        _id: false,
    }],
    replyTo: {
        type: {
            messageId: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
            content: { type: String, default: null },
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            senderName: { type: String, default: null },
        },
        default: undefined,
    },
    forwardedFrom: {
        type: {
            originalSenderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            originalSenderName: { type: String, default: null },
        },
        default: undefined,
    },
    deletedFor: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: "User",
        default: [],
    },
    deletedAt: {
        type: Date,
        default: null,
    },
},
    { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;