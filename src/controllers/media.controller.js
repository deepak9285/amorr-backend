import https from 'https';
import fs, { fdatasync } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import axios from 'axios';
dotenv.config();

const REGION = '';
const BASE_HOSTNAME = 'storage.bunnycdn.com';
const HOSTNAME = REGION ? `${REGION}.${BASE_HOSTNAME}` : BASE_HOSTNAME;
const STORAGE_ZONE_NAME = 'amorr';
const ACCESS_KEY = process.env.BUNNY_ACCESS_KEY;

const uploadImage = async (req, res) => {
    
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const { amorrID } = req.body;
        console.log(req.file);

        const fileUp = await handleFileUpload(req.file, amorrID);

        res.status(200).json({
            message: 'File uploaded successfully',
            fileUp,
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while uploading the file' });
    }
};

export const handleFileUpload = async (file, email) => {
    const fileStream = fs.createReadStream(file.path);
    const uniqueFilename = `${Date.now()}-${file.filename}-${file.originalname}`;

    const response = await axios.put(
        `https://storage.bunnycdn.com/${STORAGE_ZONE_NAME}/amorr/users/${email}/${uniqueFilename}`,
        fileStream,
        {
            headers: {
                AccessKey: ACCESS_KEY,
            },
        }
    );

    if (response.data) {
        fs.unlink(file.path, (err) => {
            if (err) {
                console.error(err);
            }
            else {
                console.log('File deleted successfully');
            }
        });
        return `https://amorr.b-cdn.net/amorr/users/${email}/${uniqueFilename}`;
    } else {
        return false;
    }
};


export default uploadImage;
