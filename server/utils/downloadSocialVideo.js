import fs from "fs";
import path from "path";
import axios from "axios";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// TikTok downloader using RapidAPI proxy
const downloadTikTok = async (url, outputPath) => {
  console.log('[DOWNLOADER] Fetching TikTok via RapidAPI proxy...');
  
  const options = {
    method: 'GET',
    url: 'https://social-media-video-downloader.p.rapidapi.com/tiktok/v3/post/details',
    params: { url },
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com'
    }
  };

  const response = await axios.request(options);
  const data = response.data;

  // Extract direct video URL from API response
  const directUrl =
    data?.contents?.[0]?.videos?.[0]?.url ||
    data?.contents?.[0]?.renderableVideos?.[0]?.url ||
    data?.data?.play ||
    data?.play;

  if (!directUrl) {
    console.error('[DOWNLOADER] RapidAPI TikTok response:', JSON.stringify(data).slice(0, 300));
    throw new Error('RapidAPI returned no playable video URL.');
  }

  // Stream video directly to disk to prevent RAM exhaustion
  const videoRes = await axios({
    url: directUrl,
    method: 'GET',
    responseType: 'stream'
  });

  const writer = fs.createWriteStream(outputPath);
  videoRes.data.pipe(writer);

  await new Promise((resolve, reject) => {
    writer.on('finish', resolve);
    writer.on('error', reject);
  });

  console.log('[DOWNLOADER] TikTok download complete via RapidAPI.');
  return outputPath;
};

// yt-dlp downloader for Twitter/X and other platforms
const downloadWithYtDlp = async (url, outputPath) => {
  console.log('[DOWNLOADER] Using yt-dlp for:', url);
  const command = `yt-dlp --js-runtimes node -f "best[ext=mp4]/best" -o "${outputPath}" "${url}"`;
  
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
    if (videoUrl.toLowerCase().includes('tiktok.com')) {
      await downloadTikTok(videoUrl, filePath);
    } else {
      await downloadWithYtDlp(videoUrl, filePath);
    }

    return filePath;
  } catch (error) {
    console.error('[DOWNLOADER] Failed:', error.message);
    throw new Error('Could not extract video from the provided link.');
  }
}