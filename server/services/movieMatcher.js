const findBestMatch = (movieResults) => {
  const movieCount = {};

  const dialogueResult = movieResults.find(c => c.name === 'dialogue/vision' || c.name === 'dialogue');
  const actorResults = movieResults.filter(c => c.name !== 'dialogue/vision' && c.name !== 'dialogue');

  for (const celebrity of movieResults) {
    const points = (celebrity.name === 'dialogue/vision' || celebrity.name === 'dialogue') ? 10 : 1;

    for (const movie of celebrity.movies) {
      const title = movie.title || movie.name; 
      
      if (movieCount[title]) {
        movieCount[title] += points;
      } else {
        movieCount[title] = points;
      }
    }
  }

  
  if (actorResults.length > 0 && dialogueResult && dialogueResult.movies.length > 0) {
    const aiTitle = dialogueResult.movies[0].title || dialogueResult.movies[0].name;
    
    let aiMovieHasActor = false;
    for (const actor of actorResults) {
      if (actor.movies.some(m => (m.title === aiTitle || m.name === aiTitle))) {
        aiMovieHasActor = true;
        break;
      }
    }
    
   
    if (!aiMovieHasActor && actorResults.length > 1) {
      console.log(` AI Hallucination Caught: Stripping points from "${aiTitle}" because multiple recognized actors don't match.`);
      movieCount[aiTitle] -= 10; 
    }
  }


  const sortedMovies = Object.entries(movieCount).sort((a, b) => b[1] - a[1]);
  
  if (sortedMovies.length === 0 || sortedMovies[0][1] <= 0) return null;

  const topTitle = sortedMovies[0][0];

  if (dialogueResult) {
    const found = dialogueResult.movies.find(m => (m.title === topTitle || m.name === topTitle));
    if (found) return { ...found, matchCount: sortedMovies[0][1] };
  }

 
  for (const celebrity of movieResults) {
    const found = celebrity.movies.find(m => (m.title === topTitle || m.name === topTitle));
    if (found) return { ...found, matchCount: sortedMovies[0][1] };
  }
};

export { findBestMatch };