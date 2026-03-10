import { GoogleGenAI, Type } from '@google/genai';
import * as fs from 'fs';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateVerses() {
  console.log('Generating 365 verses using Gemini API...');
  
  const prompt = `
    당신은 성경 전문가입니다. 잠언, 전도서, 시편에서 가장 유명하고 은혜로운 성경 구절 365개를 선정해주세요.
    반드시 JSON 배열 형태로 응답해야 합니다.
    각 객체는 다음 필드를 가져야 합니다:
    - book: "잠언", "전도서", "시편" 중 하나
    - chapter: 장 (숫자)
    - verseNum: 절 (숫자)
    - verse: 성경 구절 텍스트 (한국어 개역개정 기준)
    - theme: 이 구절의 핵심 주제 (예: 지혜, 위로, 소망 등 1~2단어)
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              book: { type: Type.STRING },
              chapter: { type: Type.INTEGER },
              verseNum: { type: Type.INTEGER },
              verse: { type: Type.STRING },
              theme: { type: Type.STRING },
            },
            required: ["book", "chapter", "verseNum", "verse", "theme"]
          }
        }
      }
    });

    const verses = JSON.parse(response.text || '[]');
    console.log(`Generated ${verses.length} verses.`);
    
    // If it didn't generate 365, we might need to duplicate or just use what we have.
    // Let's format them into the proverbs.ts structure.
    
    const proverbsObj: Record<string, any> = {};
    
    for (let i = 0; i < 365; i++) {
      // Loop over generated verses if less than 365
      const v = verses[i % verses.length];
      
      const dateObj = new Date(2026, 0, i + 1);
      const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
      const month = monthNames[dateObj.getMonth()];
      const day = dateObj.getDate();
      const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
      const tag = `${month} ${day}${suffix}`;
      
      const key = `${v.book === '잠언' ? 'Pr' : v.book === '전도서' ? 'Ec' : 'Ps'}_${v.chapter}_${v.verseNum}_${i}`;
      
      proverbsObj[key] = {
        id: `day_${i + 1}`,
        reference: `${v.book === '잠언' ? 'Proverbs' : v.book === '전도서' ? 'Ecclesiastes' : 'Psalms'} ${v.chapter}:${v.verseNum}`,
        title: '',
        verse: v.verse,
        source: `${v.book} ${v.chapter}:${v.verseNum}`,
        theme: v.theme,
        commentary: '',
        application: '',
        chartType: i % 3 === 0 ? 'radar' : i % 3 === 1 ? 'bar' : 'none',
        accentColor: i % 2 === 0 ? '#5D6D5F' : '#D4A373',
        tag: tag,
      };
    }

    const fileContent = `export interface ProverbData {
  id: string;
  reference: string;
  title: string;
  verse: string;
  source: string;
  theme: string;
  commentary: string;
  application: string;
  chartType: 'radar' | 'bar' | 'none';
  accentColor: string;
  tag: string;
  merged?: string | { title?: string; body?: string };
  simulation?: 'mountaineer';
  translations?: any;
  partner?: string;
  categoryCode?: string;
  audio?: Record<string, string>;
  audio_direct?: Record<string, string>;
  audioFileIds?: Record<string, string>;
}

export const proverbs: Record<string, ProverbData> = ${JSON.stringify(proverbsObj, null, 2)};

export const defaultVerseKey = Object.keys(proverbs)[0];
export const defaultVerse = proverbs[defaultVerseKey];
`;

    fs.writeFileSync('src/data/proverbs.ts', fileContent);
    console.log('Successfully wrote to src/data/proverbs.ts');

  } catch (error) {
    console.error('Error generating verses:', error);
  }
}

generateVerses();
