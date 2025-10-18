import fs from 'node:fs';
import OpenAI from 'openai';

export async function handleDataframe(
  header: Array<string>,
  rows: Array<Array<string>>,
  task: string,
) {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const content = fs
    .readFileSync('./PROMPT.md', 'utf-8')
    .replace('[COLUMNS]', header.join(','))
    .replace('[TASK]', task)
    .replace('[ROWS]', rows.map((row) => row.join(',')).join('\n'));

  console.log(content);

  console.log('sending');

  const resp = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content,
      },
    ],
    // Use structured outputs to force valid JSON per schema
    // response_format: {
    //   type: "json_schema",
    //   json_schema: batchSchema
    // },
    temperature: 0,
  });

  console.log('done');

  console.log(resp);

  const result = resp.choices?.[0]?.message?.content;

  console.log(result);
}
