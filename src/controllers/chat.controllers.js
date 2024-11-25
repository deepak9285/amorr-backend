import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Chat } from "../models/chat.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { ChatEventEnum } from "../socket/chatEvents.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { emitSocketEvent } from "../socket/socket.js";
import generateHash from "../utils/generateHash.js";

const getAllChats = asyncHandler(async (req, res) => {

    const { userId } = req.body;
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

});

const getUserStatus = asyncHandler(async (req, res) => {

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


});

const createOrGetAOneOnOneChat = asyncHandler(async (req, res) => {

    const {receiverId, userId } = req.body;

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

    //If you don't want chat with yourself
    // if (receiver._id.toString() === req.user._id.toString()) {
    //     return new ApiError(400, "You cannot chat with yourself");
    // }

    const existingChat = await Chat.findOne({
        isGroup: false,
        participants: { $all: [req.user._id, receiverId] },
    }).populate("participants", "username profileID email")
        .populate("lastMessage")
        .populate("firstMessage");

    if (existingChat) {
        return res.status(200).json(new ApiResponse(200, existingChat, "Chat already exists"));
    }

    const chatId = await generateHash(req.user._id.toString() + receiverId);

    const chat = await Chat.findOne({
        chatId: chatId,
        isGroup: false,
        participants: { $all: [req.user._id, receiverId] },
        firstMessage: "6728f387bea894365495266b" //new msg for new connection as default
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
});

const createAGroupChat = asyncHandler(async (req, res) => {

    const { userId } = req.body;
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

    const existingGroupChat = await Chat.findOne({
        isGroup: true,
        participants: { $size: members.length, $all: members }
    })
        .populate("participants", "username profileID email")
        .populate("lastMessage")
        .populate("firstMessage");

    if (existingGroupChat) {
        return res.status(200).json(new ApiResponse(200, existingGroupChat, "Group chat already exists"));
    }

    const groupId = await generateHash(members);
    const hashedAdminId = await generateHash(req.user._id.toString());

    const groupChat = await Chat.create({
        chatId: groupId,
        name,
        isGroup: true,
        participants: members,
        admin: hashedAdminId,
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

});

const addUserToGroup = asyncHandler(async (req, res) => {

    const { groupId, newUserId } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(401).json(new ApiError(401, "User ID is required"));
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new ApiError(404, "User not found"));
    }

    const groupChat = await Chat.findById(groupId);
    if (!groupChat) {
        return res.status(404).json(new ApiError(404, "Group chat not found"));
    }

    if (groupChat.admin.toString() !== userId.toString()) {
        return res.status(403).json(new ApiError(403, "Only the admin can add users to the group"));
    }

    if (groupChat.participants.includes(newUserId)) {
        return res.status(400).json(new ApiError(400, "User is already a participant in the group"));
    }

    groupChat.participants.push(new mongoose.Types.ObjectId(newUserId));
    await groupChat.save();

    emitSocketEvent(
        req,
        newUserId,
        ChatEventEnum.USER_ADDED_TO_GROUP,
        { groupId: groupChat._id }
    );

    return res.status(200).json(new ApiResponse(200, null, "User added to group successfully"));

});

const editGroupDetails = asyncHandler(async (req, res) => {

    const { groupId } = req.params;
    const { userId } = req.headers;
    const { name, participants } = req.body;

    if (!userId) {
        return res.status(401).json(new ApiError(401, "User ID is required"));
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new ApiError(404, "User not found"));
    }

    const groupChat = await Chat.findById(groupId);
    if (!groupChat) {
        return res.status(404).json(new ApiError(404, "Group chat not found"));
    }

    if (groupChat.admin.toString() !== userId.toString()) {
        return res.status(403).json(new ApiError(403, "Only the admin can edit group details"));
    }

    if (name) {
        groupChat.name = name;
    }

    if (participants) {
        const uniqueParticipants = [...new Set(participants.map((id) => id.toString()))];

        if (uniqueParticipants.length < 3) {
            return res.status(400).json(new ApiError(400, "Group must have at least 3 members, including the admin"));
        }

        if (!uniqueParticipants.includes(groupChat.admin.toString())) {
            uniqueParticipants.push(groupChat.admin.toString());
        }

        groupChat.participants = uniqueParticipants;
    }

    await groupChat.save();

    groupChat.participants.forEach((participant) => {
        emitSocketEvent(
            req,
            participant.toString(),
            ChatEventEnum.GROUP_UPDATED,
            { groupId: groupChat._id, name: groupChat.name, participants: groupChat.participants }
        );
    });

    return res.status(200).json(new ApiResponse(200, groupChat, "Group details updated successfully"));

});

const removeUserFromGroup = asyncHandler(async (req, res) => {

    const { groupId, userIdToRemove } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return res.status(401).json(new ApiError(401, "User ID is required"));
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new ApiError(404, "User not found"));
    }

    const groupChat = await Chat.findById(groupId);
    if (!groupChat) {
        return res.status(404).json(new ApiError(404, "Group chat not found"));
    }

    if (groupChat.admin.toString() !== userId.toString()) {
        return res.status(403).json(new ApiError(403, "Only the admin can remove users"));
    }

    if (!groupChat.participants.includes(userIdToRemove)) {
        return res.status(400).json(new ApiError(400, "User is not a participant of this group"));
    }

    groupChat.participants = groupChat.participants.filter(participant => participant.toString() !== userIdToRemove);
    await groupChat.save();

    return res.status(200).json(new ApiResponse(200, null, "User removed from group successfully"));

});

const deleteGroup = asyncHandler(async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    const groupChat = await Chat.findOne({ chatId: groupId });

    if (!groupChat) {
        return res.status(404).json({ message: "Group not found" });
    }

    if (groupChat.admin.toString() !== userId) {
        return res.status(403).json({ message: "Only the admin can delete the group" });
    }

    groupChat.isDeleted = true;
    await groupChat.save();

    return res.status(200).json({ message: "Group marked as deleted successfully" });

});

const blockUser = asyncHandler(async (req, res) => {

    const { userId } = req.body;
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

});

const unblockUser = asyncHandler(async (req, res) => {

    const { userId } = req.body;
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

});

const checkBlockStatus = asyncHandler(async (req, res) => {

    const { userToCheckId } = req.params;
    const { userId } = req.body;

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

});


export {
    createAGroupChat,
    createOrGetAOneOnOneChat,
    getAllChats,
    getUserStatus,
    addUserToGroup,
    editGroupDetails,
    removeUserFromGroup,
    deleteGroup,
    blockUser,
    unblockUser,
    checkBlockStatus
};
