import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
    S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";


const Bucket = process.env.AWS_BUCKET_NAME;

const s3Client = new S3Client({
    region: "eu-north-1",
    credentials: {
        accessKeyId: process.env.ACCESS_KEY,
        secretAccessKey: process.env.SECRET_KEY,
    },
});

async function getObjectUrl() {
    const command = new GetObjectCommand({
        Bucket,
        Key: key,
    });

    const url = await getSignedUrl(s3Client, command);
    console.log(url);
    return url;
}

async function uploadObject(
    fileName,
    folder,
    ContentType
) {
    try {
        const filename = `img-${Date.now()}`
        const key = `uploads/${folder}/${filename}`;
        const folderNames = ["ProfileImages", "ProductImages", "userDocuments", "test_folder"];
        if (!folderNames.includes(folder)) {
            return {
                error: "invalid folder name",
            };
        }

        const command = new PutObjectCommand({
            Bucket,
            Key: `uploads/${folder}/${filename}`,
            ContentType: ContentType,
        });

        const url = await getSignedUrl(s3Client, command, { expiresIn: 300 });
        console.log(filename)
        return {
            url,
            key,
        };
    }
    catch (err) {
        return {
            error: `Error while uploading the image to ${folder}`,
        };
    }
}

async function deleteObject(key) {
    const command = new DeleteObjectCommand({
        Bucket,
        Key: key,
    });
    const deleted = await s3Client.send(command);
    return deleted;
}

async function uploadFile(fileName, folderName, contentType, image) {
    try {

        // const data = await fetch("/api/media",{
        //   method:"POST",
        //   headers:{
        //     "Content-Type":"application/json"
        //   },
        //   body:JSON.stringify({
        //     fileName,
        //     folderName,
        //     contentType
        //   })
        // });

        const data = await uploadObject(fileName, folderName, contentType)

        // console.log(data);

        const { url, key } = data;

        const upload = await fetch(url ? url : "", {
            method: "PUT",
            headers: {
                "Content-Type": contentType
            },
            body: image
        })

        return upload;

    }
    catch (err) {
        return {
            error: err
        }
    }
}

// console.log(await uploadObject("Picture2.png", "image/png"))








export { getObjectUrl, uploadObject, deleteObject, uploadFile };