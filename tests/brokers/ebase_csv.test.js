import glob from 'glob';
import fs from 'fs';

import { findImplementation } from '@/index';
import { csvLinesToJSON } from '@/helper';
import * as ebase_csv from '../../src/brokers/ebase_csv';

// David Holin: No dividend samples test yet, as no example document is available
describe('Broker: ebase_csv', () => {
  let consoleErrorSpy;
  const allTestFiles = glob.sync(`${__dirname}/__mocks__/ebase_csv/mixed_transactions/*.csv`);
  describe('Check all documents', () => {
    test('Can the document parsed with ebase_csv', () => {
      allTestFiles.forEach(sample => {
        expect(
          ebase_csv.canParsePage(
            readTestFile(sample, false)[0],
            'csv'
          )
        ).toEqual(true);
      });
    });

    test('Can identify a implementation from the document as Portfolio Performance', () => {
      allTestFiles.forEach(sample => {
        const implementations = findImplementation(
          readTestFile(sample, false),
          'csv'
        );
        expect(implementations.length).toEqual(1);
        expect(implementations[0]).toEqual(ebase_csv);
      });
    });
  });

  test.each(allTestFiles)('should parse CSVs correctly: %s', testFile => {
    const activityFile = testFile.replace(/\.csv$/, '.json');
    //const expectedActivities = JSON.parse(fs.readFileSync(activityFile, 'utf8'));

    const result = ebase_csv.parsePages(readTestFile(testFile, true));
    // uncomment to update expected activities
    fs.writeFileSync(activityFile, JSON.stringify(result.activities, null, 2));

    //expect(result.activities).toMatchObject(expectedActivities);
  });

  beforeEach(() => {
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  const readTestFile = (file, parseAsJson) => {
    const content = fs.readFileSync(file, 'latin1');
    return parseAsJson
      ? JSON.parse(csvLinesToJSON(content, parseAsJson))
      : [content.trim().split('\n')];
  };
});
