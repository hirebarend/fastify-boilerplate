import { DuckDBConnection } from '@duckdb/node-api';
import fs from 'node:fs';
import OpenAI from 'openai';

import type { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import { getContainer, SessionFile } from '../core';

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

async function executeQuery(sessionFiles: Array<SessionFile>, query: string) {
  const connection = await DuckDBConnection.create();

  try {
    await connection.run(`INSTALL httpfs;`);
    await connection.run(`INSTALL cache_httpfs FROM community;`);
    await connection.run(`LOAD httpfs;`);
    await connection.run(`LOAD cache_httpfs;`);

    await connection.run(`PRAGMA cache_httpfs_type='on_disk';`);
    await connection.run(`PRAGMA cache_httpfs_cache_directory='./tmp';`);
    await connection.run(`PRAGMA cache_httpfs_cache_block_size=1048576;`);

    for (const sessionFile of sessionFiles) {
      try {
        await connection.run(`
      CREATE TEMP VIEW "${normalizeFilename(sessionFile.name)}" AS
      SELECT * FROM read_csv_auto('${sessionFile.url}', header=true)
    `);
      } catch {}
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
  }
}

async function getMetadata(sessionFiles: Array<SessionFile>) {
  const connection = await DuckDBConnection.create();

  try {
    await connection.run(`INSTALL httpfs;`);
    await connection.run(`INSTALL cache_httpfs FROM community;`);
    await connection.run(`LOAD httpfs;`);
    await connection.run(`LOAD cache_httpfs;`);

    await connection.run(`PRAGMA cache_httpfs_type='on_disk';`);
    await connection.run(`PRAGMA cache_httpfs_cache_directory='./tmp';`);
    await connection.run(`PRAGMA cache_httpfs_cache_block_size=1048576;`);

    const result = [];

    for (const sessionFile of sessionFiles) {
      const readerResult = await connection.runAndReadAll(
        `SELECT * FROM read_csv_auto('${sessionFile.url}', header=true) USING SAMPLE 10 ROWS;`,
      );

      result.push({
        name: normalizeFilename(sessionFile.name),
        columns: readerResult.columnNames(),
        rows: readerResult.getRowsJson(),
      });
    }

    return result;
  } finally {
    connection.closeSync();
  }
}

export const SESSIONS_ID_ASK_POST: RouteOptions<any, any, any, any> = {
  handler: async (
    request: FastifyRequest<{
      Body: { query: string };
      Params: {
        id: string;
      };
    }>,
    reply: FastifyReply,
  ) => {
    const container = await getContainer();

    const sessionFiles = await container.db
      .collection<SessionFile>('session-files')
      .find(
        {
          'session.id': request.params.id,
        },
        {
          projection: {
            _id: 0,
          },
        },
      )
      .toArray();

    const result = await getMetadata(sessionFiles);

    const content = fs
      .readFileSync('./prompts/sql_query.md', 'utf-8')
      .replace('{{USER_PROMPT}}', request.body.query)
      .replace(
        '{{TABLES_AND_COLUMNS}}',
        result
          .map((table) => `\t${table.name}(${table.columns.join(', ')})`)
          .join('\n'),
      )
      .replace(
        '{{ROW_SAMPLES}}',
        result
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

    reply.status(200).send({
      query: resp.choices?.[0]?.message?.content,
    });
  },
  method: 'POST',
  url: '/api/v1/sessions/:id/ask',
  schema: {
    tags: ['sessions'],
    // Uncomment the following lines to enforce authentication
    // security: [
    //   {
    //     apiKey: [],
    //   },
    // ],
    body: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
        },
      },
    },
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
        },
      },
    },
  },
};
