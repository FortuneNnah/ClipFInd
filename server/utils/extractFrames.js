import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath);

export const extractFrames = (videoPath, outputFolder, duration) => {
  return new Promise((resolve, reject) => {
    
    // Calculate exactly what frame rate is needed to spread 30 frames across the entire duration
    const dynamicFps = `30/${duration}`;

    ffmpeg(videoPath)
      .output(path.join(outputFolder, "frame-%03d.png"))
      .outputOptions("-vf", `fps=${dynamicFps}`, "-frames:v", "30")
      .on("start", (commandLine) => {
        console.log("FFmpeg started:");
        console.log(commandLine);
      })
      .on("end", () => {
        console.log("FFmpeg finished");
        resolve();
      })
      .on("error", (err) => {
        console.error("FFmpeg error:");
        console.error(err);
        reject(err);
      })
      .run();
  });
};