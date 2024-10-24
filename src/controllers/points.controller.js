import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
const pointscredited = async (req, res) => {
    const { userID, credit } = req.body;
    console.log("Request Body:", req.body); 
    try {
        const user = await User.findById(userID);
        if (!user) {
            return res.json(new ApiResponse(404, null, 'User does not exist'));
        }

        user.points += credit;
        const updatedUser = await user.save();

        return res.json(new ApiResponse(200, null, {
            message: 'Balance updated successfully',
            User: updatedUser
        }));
    } 
    catch (err) {
        return res.json(new ApiResponse(500, null, 'Internal server error'));
    }
};

const pointsdebited = async(req,res)=>{
    const {userID,debit} = req.body;
    try{
        const user = await User.findById(userID);
 
        if(!user)
        return res.json(new ApiResponse(404, null, 'User does not exist'));
    if(debit>user.points)
    return res.json(new ApiResponse(404, null, 'insuffiecient balnace'));

        user.points -=debit;
const updatedbalance = await user.save();
return res.json(new ApiResponse(200, null, {message:'balance Updated Successfully',
User:updatedbalance}));
    }
    catch(err){
        return res.json(new ApiResponse(500, null, 'Internal server error'));
    }
}

const pointsredeem = async(req,res)=>{
    const {userID,debit,feature} = req.body;
    try{
        const user = await User.findById(userID);
 
        if(!user)
        return res.json(new ApiResponse(404, null, 'User does not exist'));
        if(debit>user.points)
    return res.json(new ApiResponse(404, null, 'insuffiecient balnace'));

        user.points -=debit;
//change state state of that feature to unlock
const updatedbalance = await user.save();
return res.json(new ApiResponse(200, null, {message:'balance Updated Successfully',
User:updatedbalance}));
    }
    catch(err){
        return res.json(new ApiResponse(500, null, 'Internal server error'));
    }
}

export{pointscredited,pointsdebited,pointsredeem}

