import youtubedl from "youtube-dl-exec";
import fs from "fs";
import path from "path";

export async function downloadSocialVideo(videoUrl, uploadDir) {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${Date.now()}-social.mp4`;
  const filePath = path.join(uploadDir, fileName);

  console.log(`\n [DOWNLOADER] Starting fetch for: ${videoUrl}`);
  console.log(` [DOWNLOADER] Saving to: ${filePath}`);

  try {
    await youtubedl(videoUrl, {
      output: filePath,
      format: "bestvideo+bestaudio/best",
      mergeOutputFormat: "mp4",
      noPlaylist: true,
      retries: 3,
    });

    console.log(` [DOWNLOADER] Successfully downloaded!`);
    return filePath;
  } catch (error) {
    console.error(` [DOWNLOADER] Failed to download:`, error.message);
    console.error(error.stderr?.slice(-2000) ?? error.shortMessage ?? error);
    throw new Error(`Could not extract video from the provided link: ${error.stderr?.slice(-500) ?? error.message}`);
  }
}