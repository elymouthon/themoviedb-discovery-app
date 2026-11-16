import type { Express, Request, RequestHandler, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_PAGE,
  DEFAULT_REGION,
} from '../utils/constants';
import { tmdbAccessToken } from '../utils/config';
import * as movieQueryParams from '../utils/movie-query-params';
import { registerMoviesApi } from './movies-api';
import type {
  TmdbMovieDetails,
  TmdbMoviesRawResponse,
} from '../types/MoviesTypes';

const { toSupportedMovieMock, toSupportedMovieDetailsMock } = vi.hoisted(
  () => ({
    toSupportedMovieMock: vi.fn(),
    toSupportedMovieDetailsMock: vi.fn(),
  }),
);

vi.mock('../utils/converter', () => ({
  toSupportedMovie: toSupportedMovieMock,
  toSupportedMovieDetails: toSupportedMovieDetailsMock,
}));

vi.mock('../utils/config', () => ({
  tmdbAccessToken: 'test-access-token',
}));

type RouteHandler = (
  req: Request,
  res: Response,
  next: (error?: unknown) => void,
) => void | Promise<void>;

const handlers = new Map<string, RequestHandler>();
const app = {
  get: (path: string, handler: RequestHandler) => handlers.set(path, handler),
} as unknown as Express;

function getHandler(path: string): RouteHandler {
  const handler = handlers.get(path);
  if (!handler) throw new Error(`No handler registered for ${path}`);
  return handler as RouteHandler;
}

function createResponse() {
  const response = { json: vi.fn(), status: vi.fn() };
  response.status.mockReturnValue(response);
  return response as unknown as Response & {
    json: ReturnType<typeof vi.fn>;
    status: ReturnType<typeof vi.fn>;
  };
}

function tmdbResponse(data: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(data),
  } as unknown as Response;
}

describe('movies API', () => {
  beforeEach(() => {
    handlers.clear();
    registerMoviesApi(app);
    toSupportedMovieMock.mockReset();
    toSupportedMovieDetailsMock.mockReset();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('GET /api/discover/movies', () => {
    it('passes the year to Discover and converts the returned movies', async () => {
      // Arrange
      const rawMovie = { id: 1 };
      const rawData = {
        page: 1,
        results: [rawMovie],
        total_pages: 2,
        total_results: 1,
      } as unknown as TmdbMoviesRawResponse;
      const supportedMovie = { id: 1, title: 'Movie' };
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      toSupportedMovieMock.mockReturnValue(supportedMovie);
      const response = createResponse();

      // Act
      await getHandler('/api/discover/movies')(
        { query: { year: '2020' } } as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/discover/movie?primary_release_year=2020&language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${tmdbAccessToken}`,
          }),
        }),
      );
      expect(toSupportedMovieMock).toHaveBeenCalledWith(rawMovie, 0, [
        rawMovie,
      ]);
      expect(response.json).toHaveBeenCalledWith({
        page: 1,
        results: [supportedMovie],
        total_pages: 2,
        total_results: 1,
      });
    });

    it('passes custom options and returns an empty result page', async () => {
      // Arrange
      const rawData = {
        page: 2,
        results: [],
        total_pages: 2,
        total_results: 0,
      } as unknown as TmdbMoviesRawResponse;
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      const response = createResponse();

      // Act
      await getHandler('/api/discover/movies')(
        {
          query: {
            year: '2015',
            language: 'en-US',
            page: '2',
            region: 'US',
          },
        } as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.themoviedb.org/3/discover/movie?primary_release_year=2015&language=en-US&page=2&region=US',
        expect.anything(),
      );
      expect(response.json).toHaveBeenCalledWith({
        page: 2,
        results: [],
        total_pages: 2,
        total_results: 0,
      });
    });

    it('rejects invalid years without calling TMDB', async () => {
      // Arrange
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);
      const invalidQueries = [
        {},
        { year: '20' },
        { year: '10000' },
        { year: ['2020'] },
      ];

      // Act and assert
      for (const query of invalidQueries) {
        const response = createResponse();
        await getHandler('/api/discover/movies')(
          { query } as unknown as Request,
          response,
          vi.fn(),
        );
        expect(response.status).toHaveBeenCalledWith(400);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Year must be a four-digit string between 1000 and 9999.',
        });
      }
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('returns HTTP 500 and logs HTTP, network and JSON errors', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(tmdbResponse({}, false, 503))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: vi.fn().mockRejectedValueOnce(new Error('Invalid JSON')),
        });
      vi.stubGlobal('fetch', fetchMock);
      const errorSpy = vi.spyOn(console, 'error');

      // Act and assert
      for (let index = 0; index < 3; index += 1) {
        const response = createResponse();
        await getHandler('/api/discover/movies')(
          { query: { year: '2020' } } as Request,
          response,
          vi.fn(),
        );
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Failed to discover movies',
        });
      }
      expect(errorSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('GET /api/movies/popular', () => {
    it('returns popular movies', async () => {
      // Arrange
      const rawMovie = { id: 1 };
      const rawData = {
        page: 1,
        results: [rawMovie],
        total_pages: 2,
        total_results: 1,
      } as unknown as TmdbMoviesRawResponse;
      const supportedMovie = { id: 1, title: 'Movie' };
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      toSupportedMovieMock.mockReturnValue(supportedMovie);
      const response = createResponse();
      const createMovieQueryParamsSpy = vi.spyOn(
        movieQueryParams,
        'createMovieQueryParams',
      );

      // Act
      await getHandler('/api/movies/popular')(
        { query: {} } as Request,
        response,
        vi.fn(),
      );

      // Assert
      // Assert that the createMovieQueryParams function was called with the correct query parameters
      expect(createMovieQueryParamsSpy).toHaveBeenCalledWith({});

      // Assert that the fetch function was called with the correct URL and headers
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/movie/popular?language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${tmdbAccessToken}`,
          }),
        }),
      );

      // Assert that the response contains the transformed movie data
      expect(response.json).toHaveBeenCalledWith({
        page: DEFAULT_PAGE,
        results: [supportedMovie],
        total_pages: 2,
        total_results: 1,
      });
    });

    it('returns errors for unsuccessful and rejected popular movie requests', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(tmdbResponse({}, false, 503))
        .mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', fetchMock);
      const unsuccessfulResponse = createResponse();
      const rejectedResponse = createResponse();

      // Act
      await getHandler('/api/movies/popular')(
        { query: {} } as Request,
        unsuccessfulResponse,
        vi.fn(),
      );
      await getHandler('/api/movies/popular')(
        { query: {} } as Request,
        rejectedResponse,
        vi.fn(),
      );

      // Assert
      for (const response of [unsuccessfulResponse, rejectedResponse]) {
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Failed to fetch popular movies',
        });
      }
    });
  });

  describe('GET /api/movies/:id', () => {
    it('returns movie details', async () => {
      // Arrange
      const rawData = { id: 42 } as unknown as TmdbMovieDetails;
      const supportedDetails = { id: 42, title: 'Movie details' };
      const fetchMock = vi.fn().mockResolvedValueOnce(tmdbResponse(rawData));
      vi.stubGlobal('fetch', fetchMock);
      toSupportedMovieDetailsMock.mockReturnValue(supportedDetails);
      const response = createResponse();

      // Act
      await getHandler('/api/movies/:id')(
        { params: { id: '42' }, query: {} } as unknown as Request,
        response,
        vi.fn(),
      );

      // Assert
      expect(fetchMock).toHaveBeenCalledWith(
        `https://api.themoviedb.org/3/movie/42?language=${DEFAULT_LANGUAGE}&page=${DEFAULT_PAGE}&region=${DEFAULT_REGION}`,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${tmdbAccessToken}`,
          }),
        }),
      );
      expect(toSupportedMovieDetailsMock).toHaveBeenCalledWith(rawData);
      expect(response.json).toHaveBeenCalledWith(supportedDetails);
    });

    it('returns errors for unsuccessful and rejected movie detail requests', async () => {
      // Arrange
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(tmdbResponse({}, false, 404))
        .mockRejectedValueOnce(new Error('Network error'));
      vi.stubGlobal('fetch', fetchMock);
      const unsuccessfulResponse = createResponse();
      const rejectedResponse = createResponse();

      // Act
      await getHandler('/api/movies/:id')(
        { params: { id: '42' }, query: {} } as unknown as Request,
        unsuccessfulResponse,
        vi.fn(),
      );
      await getHandler('/api/movies/:id')(
        { params: { id: '42' }, query: {} } as unknown as Request,
        rejectedResponse,
        vi.fn(),
      );

      // Assert
      for (const response of [unsuccessfulResponse, rejectedResponse]) {
        expect(response.status).toHaveBeenCalledWith(500);
        expect(response.json).toHaveBeenCalledWith({
          error: 'Failed to fetch movie with ID 42',
        });
      }
    });
  });
});
