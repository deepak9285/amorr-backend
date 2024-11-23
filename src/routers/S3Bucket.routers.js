import express from "express";
import{uploadFile,getObjectUrl,deleteFile,listFiles} from "./utils/aws.js";
import { UploadObject } from "../controllers/S3bucket.controllers.js";
const router=express.Router();
router.post("/upload",UploadObject);
router.get("/files/:key",getObjectUrl);
router.delete("/files/:key",deleteFile);
router.get("files",listFiles);
export default router;