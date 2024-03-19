import { existsSync, createWriteStream, readFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

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
import FormData from 'form-data';
import decompress from 'decompress';

const scans = readdirSync('scans');

Promise.resolve().then(async () => {
  for (const scan of scans) {
    console.log(`Processing ${scan}`);
    await extractPages(`scans/${scan}`);
  }
});

async function extractPages(file: string) {
  const base = basename(file);
  const form = new FormData();
  form.append('fileInput', readFileSync(file), {
    contentType: 'application/pdf',
    filename: base,
  });
  form.append('pageNumbers', 'all');

  const response = await fetch(
    `${CONFIG.STIRLING_PDF_API_URL}/v1/general/split-pages`,
    {
      method: 'POST',
      headers: {
        'Content-Type': form.getHeaders()['content-type'],
      },
      body: form.getBuffer(),
    },
  );

  const decompressed = await decompress(await response.buffer());
  let i = 0;
  for (const file of decompressed) {
    i++;
    createWriteStream(`documents/${file.path}`).write(file.data);
  }
}
