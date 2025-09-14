import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {

    //Get Inputs from Request
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query   // page one and the no of comments should be not more than 10

    // Validate Inputs
    if(!videoId){
        throw new ApiError(404,"Video is invalid")
    }

    //Check if video exists
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    //Fetch comments
    




    


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }
