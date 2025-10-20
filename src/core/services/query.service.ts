import * as crypto from 'node:crypto';
import { DuckDBConnection, DuckDBInstance } from '@duckdb/node-api';
import fs from 'node:fs';
import OpenAI from 'openai';
import path from 'node:path';
import { Readable } from 'node:stream';

import type { SessionFile } from '../types';

async function getFilenameFromUrl(url: string): Promise<string> {
  const hash: string = crypto.createHash('md5').update(url).digest('hex');

  if (fs.existsSync(path.join('tmp', `${hash}.csv`))) {
    return path.join('tmp', `${hash}.csv`);
  }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error();
  }

  const readableStream =
    response.body instanceof ReadableStream
      ? Readable.fromWeb(response.body)
      : response.body;

  const contentType = response.headers.get('content-type');

  const writeStream = fs.createWriteStream(path.join('tmp', `${hash}.tmp`));

  await new Promise<void>((resolve, reject) => {
    readableStream?.pipe(writeStream);
    readableStream?.on('error', reject);
    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });

  fs.renameSync(
    path.join('tmp', `${hash}.tmp`),
    path.join('tmp', `${hash}.csv`),
  );

  return path.join('tmp', `${hash}.csv`);
}

function normalizeFilename(str: string): string {
  const strSplitted = str.split('.');

  return strSplitted[0]
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^-+|-+$/g, '');
}

export async function executePrompt(
  query: string,
  sessionFiles: Array<SessionFile>,
) {
  const instance = await DuckDBInstance.create(':memory:');

  const connection = await DuckDBConnection.create(instance);

  try {
    const tables = [];

    for (const sessionFile of sessionFiles) {
      const readerResult = await connection.runAndReadAll(
        `SELECT * FROM read_csv_auto('${getFilenameFromUrl(sessionFile.url)}', header=true) USING SAMPLE 10 ROWS;`,
      );

      tables.push({
        name: normalizeFilename(sessionFile.name),
        columns: readerResult.columnNames(),
        rows: readerResult.getRowsJson(),
      });
    }

    const content = fs
      .readFileSync('./prompts/sql_query.md', 'utf-8')
      .replace('{{USER_PROMPT}}', query)
      .replace(
        '{{TABLES_AND_COLUMNS}}',
        tables
          .map((table) => `\t${table.name}(${table.columns.join(', ')})`)
          .join('\n'),
      )
      .replace(
        '{{ROW_SAMPLES}}',
        tables
          .map(
            (table) =>
              `\tTABLE: ${table.name}\n${table.rows.map((row) => `\t${row.join(', ')}`).join('\n')}`,
          )
          .join('\n'),
      );

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const resp = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content,
        },
      ],
      temperature: 0,
    });

    const str = resp.choices?.[0]?.message?.content;

    if (!str || str === 'ERROR') {
      throw new Error('unable to parse prompt');
    }

    const result = await executeQuery(str, sessionFiles);

    return {
      ...result,
      query: str,
    };
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}

export async function executeQuery(
  query: string,
  sessionFiles: Array<SessionFile>,
) {
  const instance = await DuckDBInstance.create(':memory:');

  const connection = await DuckDBConnection.create(instance);

  try {
    for (const sessionFile of sessionFiles) {
      await connection.run(`
        CREATE TEMP VIEW "${normalizeFilename(sessionFile.name)}" AS
        SELECT * FROM read_csv_auto('${getFilenameFromUrl(sessionFile.url)}', header=true)
      `);
    }

    const start = new Date().getTime();
    const readerResult = await connection.runAndReadAll(query);
    const end = new Date().getTime();
    const elapsed = end - start;

    const columns = readerResult.columnNames();

    const rows = readerResult.getRowsJson();

    return {
      columns,
      elapsed,
      rows,
    };
  } finally {
    connection.closeSync();
    instance.closeSync();
  }
}
