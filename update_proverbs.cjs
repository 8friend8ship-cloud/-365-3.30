const fs = require('fs');
const path = require('path');

const proverbsFilePath = path.join(__dirname, 'src', 'data', 'proverbs.ts');
const newProverbsData = require('./new_proverbs.json');

try {
  let fileContent = fs.readFileSync(proverbsFilePath, 'utf8');
  
  // Extract the object part
  const startMarker = 'export const proverbs: Record<string, ProverbData> = ';
  const startIndex = fileContent.indexOf(startMarker) + startMarker.length;
  const endIndex = fileContent.lastIndexOf('};') + 1;
  
  if (startIndex === -1 || endIndex === -1) {
    console.error('Could not parse proverbs.ts');
    process.exit(1);
  }
  
  const currentProverbsStr = fileContent.substring(startIndex, endIndex);
  
  // A bit hacky but works for this specific file format
  // We'll replace the whole file content to be safe
  
  const newContent = `export interface ProverbData {
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
  merged?: string | { title?: string; body?: string }; // ✅ 통합 데이터 구조 추가
  simulation?: 'mountaineer';
  translations?: any;
  partner?: string; // ✅ 대화 상대/친구
  categoryCode?: string; // ✅ 콘텐츠 분류 코드 (예: C01_연애/집착_D03)
  audio?: Record<string, string>; // ✅ 언어별 오디오 URL (KO, EN, JP, CN, ES, DE, HI) - Preview URL
  audio_direct?: Record<string, string>; // ✅ 다운로드용 Direct URL
  audioFileIds?: Record<string, string>; // ✅ 로컬 캐시 키용 File ID
}

export const proverbs: Record<string, ProverbData> = ${JSON.stringify(newProverbsData, null, 2)};

export const defaultVerseKey = '1:1-2';
export const defaultVerse = proverbs[defaultVerseKey];
`;

  fs.writeFileSync(proverbsFilePath, newContent, 'utf8');
  console.log('Successfully updated proverbs.ts');
} catch (error) {
  console.error('Error updating proverbs.ts:', error);
}
