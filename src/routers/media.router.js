// // import { Router } from "express";
// // import {
// //     uploadToBunny
// // } from "../controllers/media.controller.js";

// // const router = Router();

// // router.route("/upload").post(uploadToBunny);

// // export default router;


// // import express from 'express';
// // import multer from 'multer';
// // import { uploadToBunny } from '../controllers/media.controller.js';

// // const storage = multer.memoryStorage();
// // // const upload = multer({ storage }).single('file'); // Accept a single file named 'file'
// // const upload = multer({
// //     storage,
// //     limits: { fileSize: 10 * 1024 * 1024 }, // Set file size limit to 10MB
// // }).single('file');

// // const router = express.Router();

// // router.post('/upload', upload, uploadToBunny); // Ensure multer middleware is applied before your controller

// // export default router;

// import express, { Router } from 'express';
// import uploadToBunny from '../controllers/media.controller.js';
// import { upload } from '../utils/multer.js';

// const router = express.Router();

// router.post('/upload', upload.single('file'), uploadToBunny);

// export default router;




// import express from 'express';
// import uploadImage from '../controllers/media.controller.js';
// import multer from 'multer';
// import path from 'path';

// // Multer configuration
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         cb(null, 'uploads/'); // Folder to store images
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//         cb(null, `${uniqueSuffix}-${file.originalname}`);
//     },
// });

// const upload = multer({
//     storage,
//     fileFilter: (req, file, cb) => {
//         const fileTypes = /jpeg|jpg|png|gif/;
//         const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
//         const mimeType = fileTypes.test(file.mimetype);
//         if (extName && mimeType) {
//             cb(null, true);
//         } else {
//             cb(new Error('Only images are allowed!'));
//         }
//     },
// });

// const router = express.Router();

// // Route to upload a single image
// router.post('/', upload.single('image'), uploadImage);

// export default router;


import express from "express";
import multer from "multer";
import path from "path";
import uploadImage from "../controllers/media.controller.js";
import { fileURLToPath } from "url";

const __filename=fileURLToPath(import.meta.url);

//const __dirname = path.dirname(new URL(import.meta.url).pathname);
const __dirname=path.dirname(__filename)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, "..", "uploads");
        console.log("Upload Path:", uploadPath);  
        cb(null, path.join(__dirname, "../uploads"));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);
        if (extName && mimeType) {
            cb(null, true);
        } else {
            cb(new Error("Only images are allowed!"));
        }
    },
});

const router = express.Router();

router.post("/upload", upload.single("image"), uploadImage);

export default router;
