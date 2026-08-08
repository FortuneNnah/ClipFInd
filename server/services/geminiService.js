import { GoogleGenAI } from '@google/genai';

// Initialize the Gemini client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Dictionary to translate TMDB genre IDs into text
const tmdbGenreMap = {
  12: "Adventure", 14: "Fantasy", 16: "Animation", 18: "Drama", 27: "Horror",
  28: "Action", 35: "Comedy", 36: "History", 37: "Western", 53: "Thriller",
  80: "Crime", 99: "Documentary", 878: "Science Fiction", 9648: "Mystery",
  10402: "Music", 10749: "Romance", 10751: "Family", 10752: "War", 
  10759: "Action & Adventure", 10762: "Kids", 10763: "News", 10764: "Reality",
  10765: "Sci-Fi & Fantasy", 10766: "Soap", 10767: "Talk", 10768: "War & Politics", 10770: "TV Movie"
};

// Helper function to pause the loop for a few seconds
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const identifyVideoWithGemini = async (videoPath) => {
  try {
    console.log("Uploading video directly to Gemini...");
    
    //  Upload the raw .mp4 file to Google
    let uploadResult = await ai.files.upload({ 
      file: videoPath,
      config: { mimeType: "video/mp4" }
    });
    console.log(`Uploaded video file: ${uploadResult.name}`);

    // Wait for Google to finish processing the video
    while (!uploadResult.state || uploadResult.state.toString() !== "ACTIVE") {
      console.log("Processing video on Google's servers...");
      await sleep(4000); // Wait 4 seconds before checking again
      uploadResult = await ai.files.get({ name: uploadResult.name });
    }
    console.log("Video processing complete. Asking Gemini for a match...");

    // Ask Gemini to analyze the video and force a strict JSON response
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

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          // Pass ONLY the URI and MIME type to avoid metadata errors
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
    
    // Delete the file from Google's servers 
    await ai.files.delete({ name: uploadResult.name });

    // HYBRID METADATA ENRICHMENT: Fetch missing fields from TMDB
    if (aiResult.foundMatch && aiResult.title) {
      try {
        console.log(`Match found by Gemini: ${aiResult.title}. Fetching official metadata...`);
        
        // Use Node's built-in fetch to search TMDB for the exact title
        const tmdbUrl = `https://api.themoviedb.org/3/search/multi?api_key=${process.env.TMDB_API_KEY}&query=${encodeURIComponent(aiResult.title)}`;
        const tmdbRes = await fetch(tmdbUrl);
        const tmdbData = await tmdbRes.json();
        
        // Grab the top search result
        const exactMatch = tmdbData.results && tmdbData.results[0];
        
        if (exactMatch) {
          // Attach the official poster URL and media type
          aiResult.poster_path = exactMatch.poster_path ? `https://image.tmdb.org/t/p/w500${exactMatch.poster_path}` : null;
          aiResult.movie_type = exactMatch.media_type || "movie";
          
          // Translate the array of numbers into an array of readable strings!
          aiResult.genre = (exactMatch.genre_ids || []).map(id => tmdbGenreMap[id] || "Unknown");
        }
      } catch (err) {
        console.error("TMDB Metadata Fetch Error:", err);
      }
    }

    return aiResult;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw error;
  }
};