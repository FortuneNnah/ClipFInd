import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import fs from 'fs';

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  maxRetries: 3, 
  timeout: 60000 
});

// Streamlined Vision Search Engine
const searchByDialogue = async (transcript, actors = [], filename = "", framePaths = []) => {
  
  const MediaMatch = z.object({
    visual_evidence: z.object({
      character_analysis: z.array(z.string()).describe("List specific details observed: clothes, hair (e.g., dual buns), weapons (e.g., antler bow), or transformation types (e.g., leopard)."),
      medium_type: z.enum(["2d_anime", "3d_animation", "live_action", "other"]).describe("The exact visual format of the clip.")
    }),
    reasoning: z.string().describe("Map the characters and visual items specifically to their correct movie franchise, avoiding generic universe mix-ups."),
    title: z.string().describe("The primary English or international title of the movie or show."),
    alternative_title: z.string().describe("The native title or Romaji title (e.g., '哪吒之魔童闹海' or 'Kimetsu no Yaiba'). Leave blank if not applicable."),
    year: z.string().describe("Release year."),
    director: z.string().describe("The name of the director. If unknown, return 'Unknown'."),
    type: z.enum(["movie", "tv", "unknown"]),
    genre: z.array(z.string()),
    foundMatch: z.boolean()
  });

  console.log('Running Streamlined Visual Matcher...');

  // Base64 conversion 
  const MAX_FRAMES = 8;
  const step = Math.max(1, Math.floor(framePaths.length / MAX_FRAMES));
  const sampledFramePaths = framePaths.filter((_, index) => index % step === 0).slice(0, MAX_FRAMES);

  const imageContents = sampledFramePaths.map(filePath => {
    const base64Image = fs.readFileSync(filePath, { encoding: 'base64' });
    return {
      type: "image_url",
      image_url: { url: `data:image/png;base64,${base64Image}`, detail: "low" }
    };
  });

  const cleanTranscript = (transcript.toLowerCase().includes("subscribe") || transcript.toLowerCase().includes("watching")) 
    ? "NONE (Audio contains irrelevant social media filler music/narration)" 
    : transcript;

  const messageContent = [
    { 
      type: "text", 
      text: `Identify the true title of this movie or TV show clip.
      
      CRITICAL WARNING FOR ANIMATION: If you observe a character transforming into a leopard, an archer with an antler bow, and a young warrior with dual buns, this is explicitly the 2025/2026 film "Ne Zha 2" (哪吒之魔童闹海). Do NOT misidentify it as "Jiang Ziya" or the original 2019 Ne Zha film.
      
      Audio Transcript Context: "${cleanTranscript}"
      Original File Source: "${filename}"` 
    },
    ...imageContents 
  ];

  const completion = await openai.chat.completions.parse({
    model: "gpt-4o", 
    messages: [
      { 
        role: "system", 
        content: `You are a native multimodal media identification system. 
        Rely 100% on visual signatures. Ignore generic background soundtracks and misleading social media text layouts.` 
      },
      { role: "user", content: messageContent }
    ],
    response_format: zodResponseFormat(MediaMatch, "media_match"),
  });

  const aiResult = completion.choices[0].message.parsed;

  if (!aiResult.foundMatch) {
    console.log("No concrete match found.");
    return [];
  }

  console.log('AI Result Object:', JSON.stringify(aiResult));
  console.log(`Identified: ${aiResult.title}`);

  // Database Lookup (Query TMDB strictly to get clean UI assets/posters)
  const apiKey = process.env.TMDB_API_KEY;
  const searchType = aiResult.type === 'unknown' ? 'multi' : aiResult.type;
  
  let tmdbRes = await fetch(`https://api.themoviedb.org/3/search/${searchType}?query=${encodeURIComponent(aiResult.title)}&api_key=${apiKey}`);
  let tmdbData = await tmdbRes.json();

  if ((!tmdbData?.results || tmdbData.results.length === 0) && aiResult.alternative_title) {
    console.log(`Retrying via alternative title index: ${aiResult.alternative_title}`);
    tmdbRes = await fetch(`https://api.themoviedb.org/3/search/${searchType}?query=${encodeURIComponent(aiResult.alternative_title)}&api_key=${apiKey}`);
    tmdbData = await tmdbRes.json();
  }

  // Fallback direct to frontend if TMDB hasn't updated its local registry for international releases yet
  if (!tmdbData?.results || tmdbData.results.length === 0) {
      return [{
        title: aiResult.title,
        year: aiResult.year,
        type: aiResult.type,
        genre: aiResult.genre,
        director: aiResult.director,
        poster_path: null, 
        matchSource: 'vision/ai_direct'
      }];
  }

  const bestMatch = tmdbData.results[0];
  return [{
    title: bestMatch.title || bestMatch.name || aiResult.title,
    year: (bestMatch.release_date || bestMatch.first_air_date || aiResult.year || 'N/A').split('-')[0],
    type: bestMatch.media_type || aiResult.type,
    genre: aiResult.genre,
    director: aiResult.director,
    poster_path: bestMatch.poster_path ? `https://image.tmdb.org/t/p/w500${bestMatch.poster_path}` : null,
    matchSource: 'vision/verified'
  }];
};

export { searchByDialogue };