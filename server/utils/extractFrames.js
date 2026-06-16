import ffmpeg from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import path from "path";

ffmpeg.setFfmpegPath(ffmpegPath);

export const extractFrames = (videoPath, outputFolder) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .output(path.join(outputFolder, "frame-%03d.png"))
      .outputOptions("-vf", "fps=1")

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
