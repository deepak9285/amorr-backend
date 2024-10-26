import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError, handleErr } from "../utils/apiError.js";
import { ChatEventEnum } from "../socket/chatEvents.js";
import generateHash from "../utils/generateHash.js";

const emitSocketEvent = (req, roomId, event, payload) => {
    req.app.get("io").in(roomId).emit(event, payload);
};

const createOrGetAOneOnOneChat = async (req, res) => {
    try {
        const { receiverId } = req.params;

        const userId = req.headers['user-id'];
        if (!userId) {
            return res.status(401).json(new ApiError(401, "User ID is required"));
        }
        const user = await User.findById(userId);
        if (!user) {
            return new ApiError(404, "User not found");
        }
        req.user = user;

        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return new ApiError(404, "Receiver does not exist");
        }

        if (receiver._id.toString() === req.user._id.toString()) {
            return new ApiError(400, "You cannot chat with yourself");
        }

        const chatId = await generateHash(req.user._id.toString() + receiverId);

        const chat = await Chat.findOne({
            chatId: chatId,
            isGroup: false,
            participants: { $all: [req.user._id, receiverId] },
        }).populate("participants", "username profileID email")
            .populate("lastMessage")
            .populate("firstMessage");

        if (chat) {
            return res.status(200).json(new ApiResponse(200, chat, "Chat retrieved successfully"));
        }

        const newChatInstance = await Chat.create({
            chatId: chatId,
            name: "One on one chat",
            participants: [req.user._id, new mongoose.Types.ObjectId(receiverId)],
            admin: req.user._id,
        });

        await newChatInstance.save();
        const createdChat = await Chat.findById(newChatInstance._id)
            .populate("participants", "username profileID email")
            .populate("lastMessage")
            .populate("firstMessage");

        if (!createdChat) {
            return new ApiError(500, "Internal server error");
        }
        console.log('for emit');

        createdChat.participants.forEach((participant) => {
            if (participant._id.toString() !== req.user._id.toString()) {
                emitSocketEvent(
                    req,
                    participant._id.toString(),
                    ChatEventEnum.NEW_CHAT_EVENT,
                    createdChat
                );
            }
        });
        console.log('done emit');

        return res.status(201).json(new ApiResponse(201, createdChat, "Chat created successfully"));
    } catch (err) {
        console.error("Error in createOrGetAOneOnOneChat:", err);
        return handleErr(res, err);
    }
};

const getAllChats = async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return new ApiError(401, "User ID is required");
        }

        const user = await User.findById(userId);
        if (!user) {
            return new ApiError(404, "User not found");
        }

        req.user = user;

        const chats = await Chat.find({
            participants: user._id,
        })
            .sort({ updatedAt: -1 })
            .populate("chatId");

        return res.status(200).json(new ApiResponse(200, chats || [], "User chats fetched successfully!"));

    } catch (err) {
        console.error("Error in getAllChats:", err);
        return handleErr(res, err);
    }
};
//Response
// {
//     "statusCode": 200,
//     "data": [
//       {
//         "_id": "671ce44210e4005d77ba95a1",
//         "chatId": "cc41578a6e6e6605547215962dbf9bf4",
//         "name": "One on one chat",
//         "isGroup": false,
//         "participants": [
//           {
//             "_id": "6715291af72382426fc81b69"
//           },
//           {
//             "_id": "67153924a3711b82fa0e2dec"
//           }
//         ],
//         "userBlocked": false,
//         "__v": 0
//       },
//       {
//         "_id": "671ce5e010e4005d77ba95a7",
//         "chatId": "913e1a7a153b04f248756eddc87b9a5d",
//         "name": "Grp 01",
//         "isGroup": true,
//         "participants": [
//           {
//             "_id": "6715354190ac0c548a3e84e5"
//           },
//           {
//             "_id": "67153924a3711b82fa0e2dec"
//           },
//           {
//             "_id": "6715291af72382426fc81b69"
//           }
//         ],
//         "userBlocked": false,
//         "__v": 0
//       },
//       {
//         "_id": "671ce96bac2b35c92224a838",
//         "chatId": "d5bce9762b2750eece3849b92656328f",
//         "name": "Grp 02",
//         "isGroup": true,
//         "participants": [
//           {
//             "_id": "6715354190ac0c548a3e84e5"
//           },
//           {
//             "_id": "67153924a3711b82fa0e2dec"
//           },
//           {
//             "_id": "6715291af72382426fc81b69"
//           }
//         ],
//         "userBlocked": false,
//         "admin": "2a06c58450b7ef3556edadba60384989",
//         "__v": 0
//       }
//     ],
//     "message": "User chats fetched successfully!",
//     "success": true
//   }

const createAGroupChat = async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        if (!userId) {
            return new ApiError(401, "User ID is required");
        }

        const user = await User.findById(userId);
        if (!user) {
            return new ApiError(404, "User not found");
        }
        req.user = user;

        const { name, participants } = req.body;

        if (participants.includes(req.user._id.toString())) {
            return res.status(400).json(new ApiError(400, "Participants array should not contain the group creator"));
        }

        const members = [...new Set([...participants, req.user._id.toString()])];

        if (members.length < 3) {
            return res.status(400).json(new ApiError(400, "Group chat must have at least 3 members including the admin."));
        }

        const groupId = await generateHash(members);
        const hashedAdminId = await generateHash(req.user._id.toString()); // Hashing the admin's ID

        const groupChat = await Chat.create({
            chatId: groupId,
            name,
            isGroup: true,
            participants: members,
            admin: hashedAdminId, // Storing the hashed admin ID
        });

        const chat = await Chat.findById(groupChat._id)
            .populate("participants", "username profileID email")
            .populate("lastMessage")
            .populate("firstMessage");

        if (!chat) {
            return res.status(500).json(new ApiError(500, "Internal server error"));
        }

        chat.participants.forEach((participant) => {
            if (participant._id.toString() !== req.user._id.toString()) {
                emitSocketEvent(
                    req,
                    participant._id.toString(),
                    ChatEventEnum.NEW_CHAT_EVENT,
                    chat
                );
            }
        });

        return res.status(201).json(new ApiResponse(201, chat, "Group chat created successfully"));
    } catch (err) {
        console.error("Error in createAGroupChat:", err);
        return handleErr(res, err);
    }
};



const getUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const userStatus = {
            isOnline: user.isOnline,
            lastActive: user.lastActive || null,
        };

        return res.status(200).json(new ApiResponse(200, userStatus, "User status fetched successfully"));

    } catch (err) {
        console.error("Error in getUserStatus:", err);
        return handleErr(res, err);
    }
};

const blockUser = async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { userToBlockId } = req.params;

        if (!userId) {
            return res.status(401).json(new ApiError(401, "User ID is required"));
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        req.user = user; 

        const userToBlock = await User.findById(userToBlockId);
        if (!userToBlock) {
            return res.status(404).json(new ApiError(404, "User to block not found"));
        }

        await User.findByIdAndUpdate(userToBlockId, {
            userBlocked: true,
            whoBlocked: req.user._id
        });

        console.log("for emit");

        emitSocketEvent(req, userToBlockId, ChatEventEnum.USER_BLOCKED, { userId: req.user._id });

        console.log("done emit");

        return res.status(200).json(new ApiResponse(200, null, "User blocked successfully"));
    } catch (err) {
        console.error("Error in blockUser:", err);
        return handleErr(res, err);
    }
};


const unblockUser = async (req, res) => {
    try {
        const userId = req.headers['user-id'];
        const { userToUnblockId } = req.params;

        if (!userId) {
            return res.status(401).json(new ApiError(401, "User ID is required"));
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        const userToUnblock = await User.findById(userToUnblockId);
        if (!userToUnblock) {
            return res.status(404).json(new ApiError(404, "User to unblock not found"));
        }

        await User.findByIdAndUpdate(userToUnblockId, {
            userBlocked: false,
            whoBlocked: null
        });

        return res.status(200).json(new ApiResponse(200, null, "User unblocked successfully"));
    } catch (err) {
        console.error("Error in unblockUser:", err);
        return handleErr(res, err);
    }
};

const checkBlockStatus = async (req, res) => {
    try {
        const { userToCheckId } = req.params;
        const userId = req.headers['user-id'];

        if (!userId) {
            return res.status(401).json(new ApiError(401, "User ID is required"));
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }
        
        const userToCheck = await User.findById(userToCheckId);
        if (!userToCheck) {
            return res.status(404).json(new ApiError(404, "User to check not found"));
        }

        const isBlocked = userToCheck.userBlocked && userToCheck.whoBlocked?.toString() === req.user._id.toString();
        console.log(isBlocked);
        
        return res.status(200).json(new ApiResponse(200, { isBlocked }, "Block status checked successfully"));
    } catch (err) {
        console.error("Error in checkBlockStatus:", err);
        return handleErr(res, err);
    }
};


export {
    createAGroupChat,
    createOrGetAOneOnOneChat,
    getAllChats,
    getUserStatus,
    blockUser,
    unblockUser,
    checkBlockStatus
};
