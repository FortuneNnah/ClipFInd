import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';

ffmpeg.setFfmpegPath(ffmpegPath);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const extractAudio = (videoPath, audioPath) => {
    const extractAudio = (videoPath, audioPath) => {
        return new Promise((resolve, reject) => {
            ffmpeg(videoPath)
                .output(audioPath)
                .noVideo()
                .audioCodec('mp3')
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .run();
        });
    };
};

const transcribeAudio = async (videoPath) => {
 const audioPath = videoPath.replace(/\.[^/.]+$/, '.mp3');
 await extractAudio(videoPath, audioPath);
 const transcript = await openai.audio.transcriptions.create({
    file: fs.createReadStream(audioPath),
    model: 'whisper-1'
  });
  return transcript.text;
};

export { transcribeAudio };