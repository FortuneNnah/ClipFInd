import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const tmdbGenreMap = {
  12: "Adventure", 14: "Fantasy", 16: "Animation", 18: "Drama", 27: "Horror",
  28: "Action", 35: "Comedy", 36: "History", 37: "Western", 53: "Thriller",
  80: "Crime", 99: "Documentary", 878: "Science Fiction", 9648: "Mystery",
  10402: "Music", 10749: "Romance", 10751: "Family", 10752: "War",
  10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk",
  10768: "War & Politics", 10770: "TV Movie"
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const prompt = `
  Watch this video carefully. Identify the single most accurate movie or TV show.
  You are strictly forbidden from providing a list.
  Return ONLY a strict JSON object with this exact structure, nothing else:
  {
    "title": "Movie Title",
    "year": "Release Year",
    "director": "Director Name",
    "foundMatch": true
  }
  If you are not 100% certain, set foundMatch to false and leave the others empty.
`;

// Helper function to retry Gemini requests if the server is busy or network drops
const generateWithRetry = async (requestConfig, retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await ai.models.generateContent(requestConfig);
    } catch (error) {
      // Check for 503, 429, or raw network errors (fetch failed / ECONNRESET)
      const isRetryable = error.status === 503 || error.status === 429 || (error.message && error.message.includes('fetch failed'));
      
      if (isRetryable && i < retries - 1) {
        const waitTime = (i + 1) * 4000; // Wait 4s, 8s, 12s...
        console.log(`[GEMINI] Connection issue or server busy. Retrying in ${waitTime/1000}s...`);
        await sleep(waitTime);
      } else {
        throw error; // If we are out of retries, throw it
      }
    }
  }
};


const enrichWithTMDB = async (aiResult) => {
  if (!aiResult.foundMatch || !aiResult.title) return aiResult;

  try {
    console.log(`Fetching TMDB metadata for: ${aiResult.title}`);
    const tmdbUrl = `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(aiResult.title)}`;
    const tmdbRes = await fetch(tmdbUrl);
    const tmdbData = await tmdbRes.json();
    const exactMatch = tmdbData.results?.[0];

    if (exactMatch) {
      aiResult.poster_path = exactMatch.poster_path
        ? `https://image.tmdb.org/t/p/w500${exactMatch.poster_path}`
        : null;
      aiResult.movie_type = exactMatch.media_type || "movie";
      aiResult.genre = (exactMatch.genre_ids || []).map(id => tmdbGenreMap[id] || "Unknown");
    }
  } catch (err) {
    console.error("TMDB Metadata Fetch Error:", err);
  }

  return aiResult;
};

// For uploaded video files
export const identifyVideoWithGemini = async (videoPath) => {
  try {
    console.log("Uploading video to Gemini...");

    let uploadResult = await ai.files.upload({
      file: videoPath,
      config: { mimeType: "video/mp4" }
    });

    while (!uploadResult.state || uploadResult.state.toString() !== "ACTIVE") {
      console.log("Processing video on Google's servers...");
      await sleep(4000);
      uploadResult = await ai.files.get({ name: uploadResult.name });
    }

    console.log("Video ready. Asking Gemini...");

    const response = await generateWithRetry({
     model: 'gemini-3.5-flash-lite',
      contents: [
        {
          fileData: {
            fileUri: uploadResult.uri,
            mimeType: uploadResult.mimeType
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const aiResult = JSON.parse(response.text);
    await ai.files.delete({ name: uploadResult.name });

    return await enrichWithTMDB(aiResult);

  } catch (error) {
    console.error("Gemini File Upload Error:", error);
    throw error;
  }
};

// For YouTube URLs only
export const identifyUrlWithGemini = async (videoUrl) => {
  try {
    console.log(`Sending YouTube URL to Gemini: ${videoUrl}`);

    const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
      contents: [
        {
          fileData: {
            fileUri: videoUrl,
            mimeType: "video/mp4"
          }
        },
        prompt
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const aiResult = JSON.parse(response.text);
    return await enrichWithTMDB(aiResult);

  } catch (error) {
    console.error("Gemini URL Error:", error);
    throw error;
  }
};