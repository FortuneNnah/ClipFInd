import fs from "fs";
import path from "path";
import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// TikTok downloader using TIKWM
const downloadTikTok = async (url, outputPath) => {
  console.log('[DOWNLOADER] Using TIKWM for TikTok...');
  const apiRes = await fetch(`https://www.tikwm.com/api/?url=${encodeURIComponent(url)}`);
  const data = await apiRes.json();

  if (!data.data?.play) throw new Error('TIKWM extraction failed');

  const videoRes = await fetch(data.data.play);
  const buffer = await videoRes.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(buffer));

  console.log('[DOWNLOADER] TikTok download complete.');
  return outputPath;
};

// yt-dlp downloader for Twitter/X and other platforms
const downloadWithYtDlp = async (url, outputPath) => {
  console.log('[DOWNLOADER] Using yt-dlp for:', url);
  const command = `yt-dlp --js-runtimes nodejs -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`;
  
  const { stdout, stderr } = await execAsync(command);
  if (stdout) console.log('[yt-dlp]', stdout);
  if (stderr) console.warn('[yt-dlp warn]', stderr);

  if (!fs.existsSync(outputPath)) {
    throw new Error('yt-dlp completed but file not found.');
  }

  console.log('[DOWNLOADER] yt-dlp download complete.');
  return outputPath;
};

export async function downloadSocialVideo(videoUrl, uploadDir) {
  const fileName = `${Date.now()}-social.mp4`;
  const filePath = path.join(uploadDir, fileName);

  console.log(`\n[DOWNLOADER] Starting fetch for: ${videoUrl}`);

  try {
    if (videoUrl.includes('tiktok.com')) {
      await downloadTikTok(videoUrl, filePath);
    } else {
      // Twitter/X and everything else
      await downloadWithYtDlp(videoUrl, filePath);
    }

    return filePath;

  } catch (error) {
    console.error('[DOWNLOADER] Failed:', error.message);
    throw new Error('Could not extract video from the provided link.');
  }
}