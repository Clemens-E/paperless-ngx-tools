import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

if (!existsSync(join(__dirname, '..', 'config.json'))) {
  console.error(
    'Config file not found, please create a config.json file in the project root directory',
  );
  process.exit(1);
}

const CONFIG = JSON.parse(
  readFileSync(join(__dirname, '..', 'config.json'), 'utf-8'),
);
import fetch from 'node-fetch';
import { setTimeout } from 'timers/promises';

const PAPERLESS_CREDENTIALS = Buffer.from(
  CONFIG.PAPERLESS_CREDENTIALS,
).toString('base64');

const TEMPLATE = `Could you please generate a fitting title for the OCR of this PDF file based on the initial content?
Try to infer the document's topic and provide a short title exlusivly in German.
The title should only include the heading and if possible the date of the document, the title should also *not exceed 100 characters*.
Please format your response in such a way that only the title is included, making it easy to parse.
For example \`Title: "this is where the title goes"\`
Content:

`;

Promise.resolve().then(async () => {
  console.log('Fetching documents...');
  const documents = await getDocuments();
  console.log(`Fetched ${documents.results.length} documents`);
  for (const document of documents.results) {
    if (
      document.notes.some(({ note }: { note: string }) =>
        note.includes('Processed(v2)'),
      )
    ) {
      continue;
    }
    await setTimeout(1000);
    const newTitle = await createNewTitle(document.content);
    if (newTitle) {
      if (newTitle.length > 120) {
        console.error(`Title too long: ${newTitle}`);
        continue;
      }
      console.log(`New Title: "${newTitle}"`);
      await updateDocument({ ...document, title: newTitle });
    }
  }
});

async function getDocuments() {
  const response = await fetch(
    `${CONFIG.PAPERLESS_API_URL}/documents/?page_size=5000`,
    {
      headers: {
        Authorization: `Basic ${PAPERLESS_CREDENTIALS}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to get documents: ${
        response.statusText
      }\n\n${await response.text()}`,
    );
  }
  return await response.json();
}

async function addNote(documentId: string, note: string) {
  const response = await fetch(
    `${CONFIG.PAPERLESS_API_URL}/documents/${documentId}/notes/`,
    {
      headers: {
        Authorization: `Basic ${PAPERLESS_CREDENTIALS}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({ note }),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to add note to document: ${
        response.statusText
      }\n\n${await response.text()}`,
    );
  }
  return await response.json();
}

async function updateDocument(newDocument: any) {
  const response = await fetch(
    `${CONFIG.PAPERLESS_API_URL}/documents/${newDocument.id}/`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Basic ${PAPERLESS_CREDENTIALS}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newDocument),
    },
  );
  if (!response.ok) {
    throw new Error(
      `Failed to update document: ${
        response.statusText
      }\n\n${await response.text()}`,
    );
  }
  return response.json();
}

async function _runCompletion(content: string) {
  const response = await fetch(`${CONFIG.OLLAMA_API_URL}/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: CONFIG.OLLAMA_LLM_MODEL,
      prompt: TEMPLATE + content,
      stream: false,
      options: {
        temperature: 0.2,
        top_p: 0.5,
        seed: 1,
        num_predict: 110,
      },
    }),
  });
  if (!response.ok) {
    throw new Error(`Failed to complete: ${response.statusText}`);
  }
  return response.json().then((r) => r.response);
}

async function createNewTitle(content: string) {
  const newTitle = await _runCompletion(content);
  const matches = /Title: "(.*)"/.exec(newTitle);
  if (!matches || matches.length < 2) {
    console.error(`Failed to parse title`, newTitle);
    return null;
  }
  return matches[1];
}
