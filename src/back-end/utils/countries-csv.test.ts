// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { parseCountriesCsv } from './countries-csv';

describe('countries-csv.ts', () => {
  it('accepte les en-têtes dans n’importe quel ordre et les valeurs entourées d’espaces', () => {
    // Arrange
    const csv = '\ufeffNAME,Code\r\n"France, métropolitaine" , FR \r\n';

    // Act
    const countries = parseCountriesCsv(csv);

    // Assert
    expect(countries).toEqual([{ code: 'FR', name: 'France, métropolitaine' }]);
  });

  it('ignore les lignes vides et conserve les guillemets échappés', () => {
    // Arrange
    const csv = 'code,name\nFR,"L\'Hexagone ""historique"""\n\nUS,États-Unis\n';

    // Act
    const countries = parseCountriesCsv(csv);

    // Assert
    expect(countries).toEqual([
      { code: 'FR', name: 'L\'Hexagone "historique"' },
      { code: 'US', name: 'États-Unis' },
    ]);
  });

  it('retourne une liste vide pour un document limité aux en-têtes', () => {
    // Arrange et act
    const countries = parseCountriesCsv('code,name\n');

    // Assert
    expect(countries).toEqual([]);
  });

  it('rejette les en-têtes, codes et noms invalides', () => {
    // Arrange et act
    const invalidCsvs = [
      ['id,name\nFR,France', 'en-têtes'],
      ['code,name\nfr,France', 'Code'],
      ['code,name\nFRA,France', 'Code'],
      ['code,name\n1,France', 'Code'],
      ['code,name\nFR,', 'Nom'],
      ['code,name\nFR,"France', 'CSV'],
    ];

    // Assert
    for (const [csv, expectedMessage] of invalidCsvs) {
      expect(() => parseCountriesCsv(csv)).toThrow(expectedMessage);
    }
  });

  it('rejette un fichier sans en-têtes', () => {
    // Arrange, act et assert
    expect(() => parseCountriesCsv('')).toThrow('en-têtes');
  });
});
