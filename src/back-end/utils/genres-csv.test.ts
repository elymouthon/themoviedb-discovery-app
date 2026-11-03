// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseGenresCsv } from './genres-csv';

describe('genres-csv.ts', () => {
  it('accepte les en-têtes dans n’importe quel ordre et sans distinction de casse', () => {
    // Arrange
    const csv = '\ufeffNAME,Id\r\n"Science-fiction, aventure",878\r\n';

    // Act
    const genres = parseGenresCsv(csv);

    // Assert
    expect(genres).toEqual([{ id: 878, name: 'Science-fiction, aventure' }]);
  });

  it('ignore les lignes vides et conserve les guillemets échappés', () => {
    // Arrange
    const csv = 'id,name\n18,"L\'aventure ""familiale"""\n\n35,Comédie\n';

    // Act
    const genres = parseGenresCsv(csv);

    // Assert
    expect(genres).toEqual([
      { id: 18, name: 'L\'aventure "familiale"' },
      { id: 35, name: 'Comédie' },
    ]);
  });

  it('rejette les en-têtes, identifiants et noms invalides', () => {
    // Arrange et act
    const invalidCsvs = [
      ['code,name\n18,Drame', 'en-têtes'],
      ['id,name\n0,Drame', 'Identifiant'],
      ['id,name\n9007199254740992,Drame', 'Identifiant'],
      ['id,name\n18,', 'Nom'],
      ['id,name\n18,"Drame', 'CSV'],
    ];

    // Assert
    for (const [csv, expectedMessage] of invalidCsvs) {
      expect(() => parseGenresCsv(csv)).toThrow(expectedMessage);
    }
  });

  it('rejette un fichier sans en-têtes ni données', () => {
    // Arrange, act et assert
    expect(() => parseGenresCsv('')).toThrow('en-têtes');
  });
});
