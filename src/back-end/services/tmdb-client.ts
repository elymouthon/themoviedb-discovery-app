import { DEFAULT_LANGUAGE } from '../utils/constants';
import type {
  Country,
  Genre,
  TmdbCountry,
  TmdbMovieSyncDetails,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';

const TMDB_API_URL = 'https://api.themoviedb.org/3';

/** Client used to read the TMDB endpoints needed by the movie synchronization. */
export type TmdbClient = {
  discoverMovies(year: number, page: number): Promise<TmdbMoviesRawResponse>;
  getMovieDetails(id: number): Promise<TmdbMovieSyncDetails>;
  getGenres(): Promise<Genre[]>;
  getCountries(): Promise<Country[]>;
};

export type TmdbClientOptions = {
  accessToken: string;
  language?: string;
  fetchFn?: typeof fetch;
};

/**
 * Creates a TMDB client that authenticates every request with the server token.
 * @param options The access token, the language of the labels and an optional fetch implementation.
 * @returns The TMDB client.
 */
export function createTmdbClient({
  accessToken,
  language = DEFAULT_LANGUAGE,
  fetchFn = fetch,
}: TmdbClientOptions): TmdbClient {
  async function request<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const queryParams = new URLSearchParams({ ...params, language });
    const response = await fetchFn(`${TMDB_API_URL}${path}?${queryParams}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json;charset=utf-8',
      },
    });

    if (!response.ok) {
      throw new Error(
        `TMDB API request ${path} failed with status ${response.status}`,
      );
    }

    return (await response.json()) as T;
  }

  return {
    discoverMovies: (year, page) =>
      request<TmdbMoviesRawResponse>('/discover/movie', {
        primary_release_year: String(year),
        page: String(page),
        sort_by: 'popularity.desc',
      }),
    getMovieDetails: (id) => request<TmdbMovieSyncDetails>(`/movie/${id}`),
    getGenres: async () =>
      (await request<{ genres: Genre[] }>('/genre/movie/list')).genres,
    getCountries: async () =>
      (await request<TmdbCountry[]>('/configuration/countries')).map(
        (country) => ({
          code: country.iso_3166_1,
          name: country.native_name || country.english_name,
        }),
      ),
  };
}
