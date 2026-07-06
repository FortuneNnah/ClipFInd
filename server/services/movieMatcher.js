const findBestMatch = (movieResults) => {
  const movieCount = {};

  for (const celebrity of movieResults) {
    for (const movie of celebrity.movies) {
      const title = movie.title;
      if (movieCount[title]) {
        movieCount[title]++;
      } else {
        movieCount[title] = 1;
      }
    }
  }

  // sort by count and return the one with the highest count
  const sortedMovies = Object.entries(movieCount).sort((a, b) => b[1] - a[1]);
  
  if (sortedMovies.length === 0) return null;

  const topTitle = sortedMovies[0][0];

  // find the movie object corresponding to the top title
  for (const celebrity of movieResults) {
    const found = celebrity.movies.find(m => m.title === topTitle);
    if (found) return { ...found, matchCount: sortedMovies[0][1] };
  }
};

export { findBestMatch };