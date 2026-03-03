import { GoogleGenAI, Type, Schema } from '@google/genai';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { passages, settings } = await req.json();

        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'GEMINI_API_KEY is not set in the environment variables.' },
                { status: 500 }
            );
        }

        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

        const minWords = settings.extract_range ? settings.extract_range[0] : 10;
        const maxWords = settings.extract_range ? settings.extract_range[1] : 30;

        const responseSchema: Schema = {
            type: Type.ARRAY,
            description: "List of extracted vocabulary words mapped to their passage ID.",
            items: {
                type: Type.OBJECT,
                properties: {
                    passage_id: { type: Type.STRING, description: "The ID of the passage this word was extracted from." },
                    word: { type: Type.STRING, description: "The extracted English word." },
                    pos: { type: Type.STRING, description: "Part of speech abbreviation (e.g., n., v., adj., adv.)." },
                    phonetics: { type: Type.STRING, nullable: true, description: "IPA phonetics if requested, else null." },
                    importance: { type: Type.INTEGER, description: "Importance from 1 to 5." },
                    cefr_level: { type: Type.STRING, nullable: true, description: "CEFR level (A1-C2) if requested, else null." },
                    meanings: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Korean meanings, up to 3." },
                    synonyms: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: "Up to 3 synonyms." },
                    antonyms: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: "Up to 3 antonyms." },
                    example_original: { type: Type.STRING, nullable: true, description: "The sentence from the passage where the word appears." },
                    example_ko: { type: Type.STRING, nullable: true, description: "Korean translation of example_original." },
                    example_generated: { type: Type.STRING, nullable: true, description: "A high-level (C1/C2) original example sentence using the word." },
                    collocations: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: "Up to 3 common collocations." },
                    verb_forms: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true, description: "3 verb forms (base, past, past participle) if it's a verb." }
                },
                required: ["passage_id", "word", "pos", "importance", "meanings"]
            }
        };

        const passagesContext = passages.map((p: any) => `Passage ID: ${p.id}\nContent:\n${p.content}`).join('\n\n---\n\n');

        const prompt = `
You are an expert English vocabulary extractor for Korean high school students.
Please extract between ${minWords} and ${maxWords} total advanced or essential vocabulary words across the provided passages.

Extraction Settings:
- Extract Range: ${minWords} to ${maxWords} words per passage based on difficulty.
- Phonetics: ${settings.phonetics ? 'Include' : 'Null'}
- CEFR Level: ${settings.cefr_level ? 'Include (A1-C2)' : 'Null'}
- Synonyms: ${settings.synonyms ? 'Include exactly 3' : 'Null'}
- Antonyms: ${settings.antonyms ? 'Include exactly 3' : 'Null'}
- Example Original: ${settings.example_original ? 'Include original sentence' : 'Null'}
- Example Korean: ${settings.example_original ? 'Include Korean translation of original sentence' : 'Null'}
- Example Generated: ${settings.example_generated ? 'Include a brand new, highly advanced C1/C2 level paraphrased sentence using the word.' : 'Null'}
- Collocations: ${settings.collocations ? 'Include exactly 3' : 'Null'}
- Verb Forms: ${settings.verb_forms ? 'Include 3 variations if it is a verb (e.g. ["go", "went", "gone"]), else Null' : 'Null'}

Korean Meanings MUST NOT contain part-of-speech labels (e.g., just "필수적인", not "a. 필수적인"). Set the "pos" field separately (e.g., "adj.", "n.", "v.", "adv.").

Passages Content:
${passagesContext}
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: responseSchema,
                temperature: 0.2, // Low temperature for deterministic output
            }
        });

        const vocabJson = response.text;
        if (!vocabJson) {
            throw new Error("No output from AI");
        }

        const words = JSON.parse(vocabJson);
        return NextResponse.json({ words });

    } catch (error: any) {
        console.error('vocab generation error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to generate vocabulary' },
            { status: 500 }
        );
    }
}
