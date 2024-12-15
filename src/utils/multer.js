import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        console.log("REQ:",req);
        console.log("file multer", file);
        // cb(null, path.resolve(__dirname, "./temp"));
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: function (req, file, cb) {
        console.log("REQ:",req);
        console.log("file multer",file)
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

export {
    upload
};