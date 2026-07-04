import { RekognitionClient, RecognizeCelebritiesCommand } from "@aws-sdk/client-rekognition";
import fs from 'fs';


const client = new RekognitionClient ({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const recognizeCelebrities = async (imagePath) => {
    const imageBytes = fs.readFileSync(imagePath);
    const command = new RecognizeCelebritiesCommand({
        Image: { Bytes: imageBytes }
    });

    try {
        const response = await client.send(command);
       return response.CelebrityFaces.map(celebrity => ({
        name: celebrity.Name,
        confidence: celebrity.MatchConfidence,
        urls: celebrity.Urls
       }));
    }
    catch (error) {
        console.error('Error recognizing celebrities:', error);
        throw error;
    }
};

export {recognizeCelebrities};