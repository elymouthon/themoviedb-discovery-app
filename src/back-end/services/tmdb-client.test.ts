// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createTmdbClient } from './tmdb-client';

/**
 * Creates a fetch stub that resolves with the given JSON body.
 * @param body The JSON body returned by the stub.
 * @param status The HTTP status of the response.
 */
function createFetchStub(body: unknown, status = 200) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: vi.fn().mockResolvedValue(body),
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

describe('tmdb-client.ts', () => {
  it('interroge Discover avec l’année, la page et le jeton serveur', async () => {
    // Arrange
    const body = { page: 2, results: [], total_pages: 3, total_results: 45 };
    const fetchFn = createFetchStub(body);
    const client = createTmdbClient({
      accessToken: 'secret-token',
      language: 'en-US',
      fetchFn,
    });

    // Act
    const response = await client.discoverMovies(2020, 2);

    // Assert
    expect(response).toEqual(body);
    const [url, init] = fetchFn.mock.calls[0];
    const requestUrl = new URL(url);
    expect(requestUrl.origin + requestUrl.pathname).toBe(
      'https://api.themoviedb.org/3/discover/movie',
    );
    expect(Object.fromEntries(requestUrl.searchParams)).toEqual({
      primary_release_year: '2020',
      page: '2',
      sort_by: 'popularity.desc',
      language: 'en-US',
    });
    expect(init.headers.Authorization).toBe('Bearer secret-token');
  });

  it('récupère le détail d’un film dans la langue par défaut', async () => {
    // Arrange
    const details = { id: 550, title: 'Fight Club' };
    const fetchFn = createFetchStub(details);
    const client = createTmdbClient({ accessToken: 'token', fetchFn });

    // Act
    const response = await client.getMovieDetails(550);

    // Assert
    expect(response).toEqual(details);
    expect(fetchFn).toHaveBeenCalledWith(
      'https://api.themoviedb.org/3/movie/550?language=fr-FR',
      expect.anything(),
    );
  });

  it('renvoie le catalogue des genres', async () => {
    // Arrange
    const genres = [
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comédie' },
    ];
    const client = createTmdbClient({
      accessToken: 'token',
      fetchFn: createFetchStub({ genres }),
    });

    // Act et assert
    await expect(client.getGenres()).resolves.toEqual(genres);
  });

  it('convertit le catalogue des pays en privilégiant le nom traduit', async () => {
    // Arrange : un pays traduit et un pays sans traduction.
    const client = createTmdbClient({
      accessToken: 'token',
      fetchFn: createFetchStub([
        { iso_3166_1: 'DE', english_name: 'Germany', native_name: 'Allemagne' },
        { iso_3166_1: 'XK', english_name: 'Kosovo', native_name: '' },
      ]),
    });

    // Act et assert
    await expect(client.getCountries()).resolves.toEqual([
      { code: 'DE', name: 'Allemagne' },
      { code: 'XK', name: 'Kosovo' },
    ]);
  });

  it('lève une erreur explicite quand TMDB répond en erreur', async () => {
    // Arrange
    const client = createTmdbClient({
      accessToken: 'token',
      fetchFn: createFetchStub({}, 401),
    });

    // Act et assert
    await expect(client.getGenres()).rejects.toThrow(
      'TMDB API request /genre/movie/list failed with status 401',
    );
  });

  it('utilise fetch global par défaut', async () => {
    // Arrange
    const fetchFn = createFetchStub({ genres: [] });
    vi.stubGlobal('fetch', fetchFn);

    try {
      // Act
      await createTmdbClient({ accessToken: 'token' }).getGenres();

      // Assert
      expect(fetchFn).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
