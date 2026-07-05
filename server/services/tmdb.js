const searchMoviesByCelebrity = async (celebrityName) => {

    const apiKey = process.env.TMDB_API_KEY;
    const searchRes = await fetch(`https://api.themoviedb.org/3/search/person?query=${celebrityName}&api_key=${apiKey}`);
    const searchData = await searchRes.json();

    const person = searchData.results[0];
    if(!person) return [];

    const personId = person.id;
    const moviesRes = await fetch(`https://api.themoviedb.org/3/person/${personId}/movie_credits?api_key=${apiKey}`);
    const moviesData = await moviesRes.json();

    return moviesData.cast.map(movie => ({
        title: movie.title,
        year: movie.release_date ? movie.release_date.split('-')[0] : 'N/A',
        character: movie.character,
        poster_path: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null
    }))
};

export { searchMoviesByCelebrity }; 