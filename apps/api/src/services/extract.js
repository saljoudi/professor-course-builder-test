import fs from 'node:fs/promises';
import path from 'node:path';
import AdmZip from 'adm-zip';

function decodeXmlEntities(text) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function compact(text) {
  return String(text || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractPptx(filePath) {
  const zip = new AdmZip(filePath);
  const slides = zip
    .getEntries()
    .filter((entry) => /^ppt\/slides\/slide\d+\.xml$/.test(entry.entryName))
    .sort((a, b) => {
      const an = Number(a.entryName.match(/slide(\d+)\.xml$/)?.[1] || 0);
      const bn = Number(b.entryName.match(/slide(\d+)\.xml$/)?.[1] || 0);
      return an - bn;
    });

  const out = [];
  for (const slide of slides) {
    const xml = slide.getData().toString('utf8');
    const texts = [...xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g)].map((m) => decodeXmlEntities(m[1]));
    if (texts.length) out.push(texts.join(' '));
  }
  return compact(out.join('\n\n'));
}

async function extractDocx(filePath) {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ path: filePath });
  return compact(result.value);
}

async function extractPdf(filePath) {
  const module = await import('pdf-parse');
  const pdfParse = module.default || module;
  const buffer = await fs.readFile(filePath);
  const result = await pdfParse(buffer);
  return compact(result.text);
}

export async function extractFileText(file) {
  const ext = path.extname(file.originalname || file.filename || '').toLowerCase();
  try {
    if (ext === '.pptx') return await extractPptx(file.path);
    if (ext === '.docx') return await extractDocx(file.path);
    if (ext === '.pdf') return await extractPdf(file.path);
    if (['.txt', '.md', '.csv'].includes(ext)) return compact(await fs.readFile(file.path, 'utf8'));
    return `[Unsupported file type ${ext || 'unknown'}: ${file.originalname}]`;
  } catch (error) {
    return `[Extraction warning for ${file.originalname}: ${error.message}]`;
  }
}

export async function extractUploads({ syllabus, materials }) {
  const syllabusText = syllabus ? await extractFileText(syllabus) : '';
  const materialTexts = [];
  for (const file of materials || []) {
    materialTexts.push({
      fileName: file.originalname,
      text: await extractFileText(file)
    });
  }
  return { syllabusText, materialTexts };
}
