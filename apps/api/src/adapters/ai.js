import OpenAI from 'openai';

function cleanHeading(fileName = 'Course material') {
  return fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentenceChunks(text, max = 8) {
  const chunks = String(text || '')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((x) => x.trim())
    .filter((x) => x.length > 25 && x.length < 500);
  return chunks.slice(0, max);
}

function topicCandidates(text, fallback) {
  const words = String(text || '')
    .replace(/[^A-Za-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 6)
    .map((w) => w.toLowerCase());
  const stop = new Set(['because','should','could','would','through','between','within','without','course','students','student','learning','material','example','examples','important','including','different','information','introduction']);
  const counts = new Map();
  for (const w of words) if (!stop.has(w)) counts.set(w, (counts.get(w) || 0) + 1);
  const ranked = [...counts.entries()].sort((a,b) => b[1]-a[1]).slice(0, 6).map(([w]) => w.replace(/^./, (c) => c.toUpperCase()));
  return ranked.length ? ranked : [fallback];
}

function buildMockCourse(input) {
  const weeks = (input.materialTexts.length ? input.materialTexts : [{ fileName: 'Course Overview', text: input.syllabusText }])
    .map((material, index) => {
      const title = cleanHeading(material.fileName) || `Module ${index + 1}`;
      const sentences = sentenceChunks(material.text, 10);
      const topics = topicCandidates(material.text, title).slice(0, 5);
      const concepts = topics.map((name, conceptIndex) => ({
        id: `w${index + 1}_c${conceptIndex + 1}`,
        name,
        definition: sentences[conceptIndex] || `${name} is a core concept introduced in ${title}. Review the source material and connect it to the learning objectives.`,
        prerequisiteIds: conceptIndex > 0 ? [`w${index + 1}_c${conceptIndex}`] : []
      }));

      return {
        id: `week-${index + 1}`,
        order: index + 1,
        title,
        sourceFile: material.fileName,
        overview: sentences[0] || `Interactive learning module generated from ${material.fileName}.`,
        objectives: topics.slice(0, 3).map((t) => `Explain and apply ${t} using the supplied course material.`),
        concepts,
        sections: [
          {
            title: 'Core ideas',
            body: sentences.slice(0, 4).join(' ') || 'This module is ready for AI enrichment after you connect a production AI provider.'
          },
          {
            title: 'Connect the concepts',
            body: sentences.slice(4, 8).join(' ') || 'Use the concept cards below to connect definitions, examples, prerequisites, and assessments.'
          }
        ],
        activities: [
          {
            type: 'reflection',
            title: 'Explain it in your own words',
            prompt: `Choose one concept from ${title} and explain it as if you were teaching a classmate.`
          },
          {
            type: 'application',
            title: 'Apply the idea',
            prompt: `Identify a real-world situation where one of the concepts in ${title} would matter.`
          }
        ],
        quiz: topics.slice(0, 3).map((topic, qi) => ({
          id: `w${index + 1}_q${qi + 1}`,
          question: `Which statement best demonstrates understanding of ${topic}?`,
          options: [
            `It can be defined and applied in the context of ${title}.`,
            'It should be memorized without relating it to other concepts.',
            'It is unrelated to the supplied course material.',
            'It only matters outside this course.'
          ],
          answerIndex: 0,
          rationale: `The first option requires both conceptual understanding and application within ${title}.`
        }))
      };
    });

  const concepts = weeks.flatMap((w) => w.concepts.map((c) => ({ ...c, weekId: w.id })));
  const relations = [];
  for (const week of weeks) {
    for (const concept of week.concepts) {
      for (const prereq of concept.prerequisiteIds) {
        relations.push({ from: prereq, to: concept.id, type: 'prerequisiteOf' });
      }
    }
  }
  for (let i = 1; i < weeks.length; i += 1) {
    const prior = weeks[i - 1].concepts.at(-1);
    const next = weeks[i].concepts.at(0);
    if (prior && next) relations.push({ from: prior.id, to: next.id, type: 'supports' });
  }

  return {
    schemaVersion: '1.0',
    metadata: {
      publicId: input.publicId,
      title: input.courseName,
      courseCode: input.courseCode || '',
      term: input.term || '',
      styleId: input.styleId,
      generatedAt: new Date().toISOString(),
      generator: 'mock-ai'
    },
    syllabus: {
      supplied: Boolean(input.syllabusText),
      summary: input.syllabusText ? sentenceChunks(input.syllabusText, 5).join(' ') : 'No syllabus supplied. Course structure was inferred from the uploaded teaching materials.',
      outcomes: topicCandidates(input.syllabusText, 'Course learning outcome').slice(0, 5).map((x) => `Demonstrate understanding of ${x}.`)
    },
    weeks,
    ontology: { concepts, relations },
    review: {
      title: 'Cumulative Review',
      instructions: 'Move across modules, revisit prerequisite concepts, then answer the review prompts without looking at the definitions.',
      prompts: weeks.map((w) => `Summarize the most important connection in ${w.title}.`)
    }
  };
}

function extractJson(text) {
  const trimmed = String(text || '').trim();
  try { return JSON.parse(trimmed); } catch {}
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error('AI response did not contain valid JSON.');
}

async function buildWithOpenAI(input) {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.startsWith('MOCK_')) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }
  const model = process.env.OPENAI_MODEL;
  if (!model || model.startsWith('REPLACE_')) throw new Error('OPENAI_MODEL is not configured.');

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const source = {
    courseName: input.courseName,
    courseCode: input.courseCode,
    term: input.term,
    publicId: input.publicId,
    styleId: input.styleId,
    syllabus: String(input.syllabusText || '').slice(0, 30000),
    materials: input.materialTexts.map((m) => ({ fileName: m.fileName, text: String(m.text || '').slice(0, 45000) }))
  };

  const response = await client.responses.create({
    model,
    instructions: `You are an expert instructional designer and ontology engineer. Convert professor-supplied course materials into a faithful interactive course data model. Do not invent factual claims that are not supported by the source. Return JSON only. Preserve the schema keys: schemaVersion, metadata, syllabus, weeks, ontology, review. Every week needs objectives, concepts, sections, activities and a short multiple-choice quiz. Ontology relations should use types prerequisiteOf, supports, relatedTo, assessedBy.`,
    input: JSON.stringify(source)
  });
  const parsed = extractJson(response.output_text);
  parsed.metadata = {
    ...(parsed.metadata || {}),
    publicId: input.publicId,
    title: input.courseName,
    courseCode: input.courseCode || '',
    term: input.term || '',
    styleId: input.styleId,
    generatedAt: new Date().toISOString(),
    generator: `openai:${model}`
  };
  return parsed;
}

export function getAiAdapter() {
  const provider = process.env.AI_PROVIDER || 'mock';
  return {
    async buildCourse(input) {
      if (provider === 'mock') return buildMockCourse(input);
      if (provider === 'openai') return buildWithOpenAI(input);
      throw new Error(`Unsupported AI_PROVIDER=${provider}`);
    }
  };
}
