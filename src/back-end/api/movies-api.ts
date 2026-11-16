import type { Express } from 'express';
import express from 'express';
import { createDiscoverMovieQueryParams } from '../utils/discover-movie-query-params';
import { createMovieQueryParams } from '../utils/movie-query-params';
import { toSupportedMovie, toSupportedMovieDetails } from '../utils/converter';
import { tmdbAccessToken } from '../utils/config';
import type {
  MovieDetails,
  MoviesApiResponse,
  TmdbMovieDetails,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';

export { createMovieQueryParams } from '../utils/movie-query-params';
export { createDiscoverMovieQueryParams } from '../utils/discover-movie-query-params';

/**
 * Registers the movies API routes (popular movies and movie details) on the given Express application instance.
 * @param app - The Express application instance to register the movies API routes on.
 */
export function registerMoviesApi(app: Express): void {
  app.get(
    '/api/discover/movies',
    async (_req: express.Request, res: express.Response) => {
      let queryParams: URLSearchParams;

      try {
        queryParams = createDiscoverMovieQueryParams(_req.query);
      } catch (error) {
        res.status(400).json({
          error: (error as Error).message,
        });
        return;
      }

      try {
        console.log('Discover query params:', queryParams.toString());

        const response = await fetch(
          `https://api.themoviedb.org/3/discover/movie?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${tmdbAccessToken}`,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        const rawData = (await response.json()) as TmdbMoviesRawResponse;
        const data: MoviesApiResponse = {
          page: rawData.page,
          results: rawData.results.map(toSupportedMovie),
          total_pages: rawData.total_pages,
          total_results: rawData.total_results,
        };

        res.json(data);
      } catch (error) {
        console.error('Error discovering movies:', error);
        res.status(500).json({ error: 'Failed to discover movies' });
      }
    },
  );

  // Define a route handler for fetching popular movies from TMDB API
  app.get(
    '/api/movies/popular',
    async (_req: express.Request, res: express.Response) => {
      try {
        // Create the query parameters for the TMDB API request
        const queryParams = createMovieQueryParams(_req.query);

        // log the query parameters for debugging purposes
        console.log('Query Params:', queryParams.toString());

        const response = await fetch(
          `https://api.themoviedb.org/3/movie/popular?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${tmdbAccessToken}`,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        // Parse the raw response from the TMDB API
        const rawData = (await response.json()) as TmdbMoviesRawResponse;

        // Transform the raw data into the supported format for our application
        const data: MoviesApiResponse = {
          page: rawData.page,
          results: rawData.results.map(toSupportedMovie),
          total_pages: rawData.total_pages,
          total_results: rawData.total_results,
        };

        res.json(data);
      } catch (error) {
        console.error('Error fetching popular movies:', error);
        res.status(500).json({ error: 'Failed to fetch popular movies' });
      }
    },
  );

  // Define a route handler for fetching movie details by ID from TMDB API
  app.get(
    '/api/movies/:id',
    async (_req: express.Request, res: express.Response) => {
      // Extract the movie ID from the request parameters
      const movieId = _req.params.id;

      // Create the query parameters for the TMDB API request
      const queryParams = createMovieQueryParams(_req.query);

      // log the query parameters for debugging purposes
      console.log('Query Params:', queryParams.toString());

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?${queryParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${tmdbAccessToken}`,
              'Content-Type': 'application/json;charset=utf-8',
            },
          },
        );

        if (!response.ok) {
          throw new Error(
            `TMDB API request failed with status ${response.status}`,
          );
        }

        // Parse the raw response from the TMDB API
        const rawData = (await response.json()) as TmdbMovieDetails;

        // Transform the raw data into the supported format for our application
        const data: MovieDetails = toSupportedMovieDetails(rawData);

        // Send the transformed data as a JSON response
        res.json(data);
      } catch (error) {
        console.error(`Error fetching movie with ID ${movieId}:`, error);
        res
          .status(500)
          .json({ error: `Failed to fetch movie with ID ${movieId}` });
      }
    },
  );
}
