import { Router } from "express";

import {
    createAGroupChat,
    createOrGetAOneOnOneChat,
    addUserToGroup,
    editGroupDetails,
    deleteGroup,
    getAllChats,
    getUserStatus,
    blockUser,
    unblockUser,
    checkBlockStatus,
    removeUserFromGroup
} from "../controllers/chat.controllers.js";

const router = Router();


router.route("/oneOnone/:receiverId").post(createOrGetAOneOnOneChat);
router.route("/group").post(createAGroupChat);
router.route("/allchats").post(getAllChats);
router.route("/status/:userId").get(getUserStatus);
router.route("/group/:groupId/add/:newUserId").post(addUserToGroup);
router.route('/groups/:groupId/edit').put(editGroupDetails);
router.route('/group/:groupId/remove/:userToRemoveId').delete(removeUserFromGroup);
router.route("/group/:groupId").delete(deleteGroup);

router.route("/block/:userToBlockId").post(blockUser);
router.route("/unblock/:userToUnblockId").post(unblockUser);
router.route("/checkblock/:userToCheckId").get(checkBlockStatus);
export default router;

