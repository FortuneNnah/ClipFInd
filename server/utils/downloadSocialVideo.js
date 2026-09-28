import youtubedl from "youtube-dl-exec";
import path from "path";

export async function downloadSocialVideo(videoUrl, uploadDir) {
  const fileName = `${Date.now()}-social.mp4`;
  const filePath = path.join(uploadDir, fileName);

  console.log(`\n [DOWNLOADER] Starting fetch for: ${videoUrl}`);
  console.log(` [DOWNLOADER] Saving to: ${filePath}`);

  try {
    await youtubedl(videoUrl, {
      output: filePath,
      format: "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best",
    });

    console.log(` [DOWNLOADER] Successfully downloaded!`);
    return filePath;
  } catch (error) {
    console.error(` [DOWNLOADER] Failed to download:`, error.message);
    throw new Error("Could not extract video from the provided link.");
  }
}