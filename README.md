# Paperless-ngx Tools

This repository contains a set of scripts I've developed to streamline my document management workflow in paperless-ngx.
I published them here just in case anyone finds them useful.

- `src/create-titles.ts`:\
When dealing with scanned PDF files, I often encounter generic filenames like "document.pdf." This script addresses that issue by generating more descriptive titles. It leverages [ollama](https://ollama.com/) to analyze the document content retrieved from paperless-ngx using a local LLM (Large Language Model), then updates the document in paperless-ngx with the new title. This works surprisingly well.

- `src/split-pdfs.ts`:\
My scanner saves all documents as a single PDF due to its Auto-Document-Feeder feature. To tackle this, I utilize [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) to split these PDFs into individual pages, which are then saved in a folder. This folder can then be conveniently uploaded to paperless-ngx.

## Setup
Setting up these tools is straightforward. Simply clone this repository and execute `yarn` to install the necessary dependencies.

### Create Titles
To utilize the title creation script, ensure your [ollama](https://ollama.com/) API server is running, preferably with GPU access.
For a quick setup, you can use docker.
Additionally, gather your paperless-ngx URL and credentials, as the script interacts with paperless-ngx. Store these details in the `config.json` file. Then, execute the script using `yarn create-titles`.

An essential aspect affecting title quality is the LLM Model and Prompt. You can customize the prompt in the `create-titles.ts` file and adjust the model within the `config.json` file.

### **If you want to generate titles in languages other than German, make sure to adjust the prompt accordingly.**
Edit [this prompt](./src/create-titles.ts#L21) to match the language of your documents, you can also adjust the example to give the model a rough idea of the expected title.


Since my documents are in German, I've opted for the "mistral" model as it delivers satisfactory results quickly. For English documents, a smaller model may suffice, while for other languages, experimentation may be necessary with different models.

### Split PDFs
For the PDF splitting functionality, ensure [Stirling-PDF](https://github.com/Stirling-Tools/Stirling-PDF) is running and configure the URL in `config.json`. While there may be simpler methods available for splitting PDFs, I personally prefer the functionality provided by Stirling-PDF.
create two folders, `scans` and `documents`, and place the PDFs to be split in the `scans` folder. Then, execute the script using `yarn split-pdfs`.