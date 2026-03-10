const fs = require('fs');

const originalContent = `export interface ProverbData {
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

export const proverbs: Record<string, ProverbData> = {
  '8:28': {
    id: 'rom8_28',
    reference: 'Romans 8:28',
    title: '합력하여 선을 이루느니라',
    verse: '우리가 알거니와 하나님을 사랑하는 자 곧 그 뜻대로 부르심을 입은 자들에게는 모든 것이 합력하여 선을 이루느니라',
    source: '로마서 8:28',
    theme: '하나님의 섭리',
    commentary: '하나님은 우리의 모든 상황, 심지어 고난과 실수까지도 사용하여 선을 이루십니다. 이것은 하나님을 사랑하고 그분의 뜻을 따르는 자들에게 주시는 놀라운 약속입니다.',
    application: '지금 당신이 겪고 있는 어려움이 어떻게 선으로 바뀔 수 있을지 기대하십니까?',
    chartType: 'radar',
    accentColor: '#5D6D5F',
    tag: 'SPECIAL',
    partner: '이설 친구',
    categoryCode: 'C01_연애/집착_D03',
  },
  '1:1-2': {
    id: 'day_1',
    reference: 'Proverbs 1:1-2',
    title: '지혜와 훈계의 시작',
    verse: '다윗의 아들 이스라엘 왕 솔로몬의 잠언이라 이는 지혜와 훈계를 알게 하며 명철의 말씀을 깨닫게 하며',
    source: '잠언 1:1-2',
    theme: '지식 vs 지혜',
    commentary: '영국 시인 쿠퍼는 "지식은 박식함을 자랑하지만, 지혜는 자신의 무지를 부끄러워한다"고 말했습니다. 단순한 정보의 나열인 \\'지식\\'은 우리를 교만하게 만들지만, 하나님의 인도함을 받는 \\'지혜\\'는 우리를 겸손의 자리로 이끕니다.',
    application: '지식보다 지혜를 얻기 위해 당신은 하나님께 무엇을 준비하고 있습니까?',
    chartType: 'radar',
    accentColor: '#D4A373',
    tag: 'JANUARY 1st',
    translations: {
      EN: {
        merged: {
          title: 'The Beginning of Wisdom and Instruction',
          body: 'British poet Cowper said, "Knowledge is proud that he has learned so much; Wisdom is humble that he knows no more." Knowledge, a simple listing of information, makes us arrogant, but Wisdom, guided by God, leads us to humility.'
        },
        devotion: {
          title: 'The Beginning of Wisdom and Instruction',
          body: 'British poet Cowper said, "Knowledge is proud that he has learned so much; Wisdom is humble that he knows no more." Knowledge, a simple listing of information, makes us arrogant, but Wisdom, guided by God, leads us to humility.'
        },
        verse: 'The proverbs of Solomon son of David, king of Israel: for gaining wisdom and instruction; for understanding words of insight;',
        source: 'Proverbs 1:1-2',
        theme: 'Knowledge vs Wisdom',
        application: 'What are you preparing for God to gain wisdom rather than knowledge?'
      },
      JP: {
        merged: {
          title: '知恵と訓戒の始まり',
          body: '英国の詩人クーパーは、「知識は博識を誇るが、知恵は自らの無知を恥じる」と言いました。単なる情報の羅列である「知識」は私たちを傲慢にしますが、神の導きを受ける「知恵」は私たちを謙遜の場へと導きます。'
        },
        devotion: {
          title: '知恵と訓戒の始まり',
          body: '英国の詩人クーパーは、「知識は博識を誇るが、知恵は自らの無知を恥じる」と言いました。単なる情報の羅列である「知識」は私たちを傲慢にしますが、神の導きを受ける「知恵」は私たちを謙遜の場へと導きます。'
        },
        verse: 'ダビデの子、イスラエルの王ソロモンの箴言。これは知恵と訓戒を学び、悟りの言葉を理解させるため、',
        source: '箴言 1:1-2',
        theme: '知識 vs 知恵',
        application: '知識よりも知恵を得るために、あなたは神に何を準備していますか？'
      },
      CN: {
        merged: {
          title: '智慧与训诲的开端',
          body: '英国诗人库珀曾说：“知识夸耀自己的博学，智慧却为自己的无知感到羞愧。” 单纯的信息罗列“知识”会让我们骄傲，但受神引导的“智慧”会带领我们进入谦卑。'
        },
        devotion: {
          title: '智慧与训诲的开端',
          body: '英国诗人库珀曾说：“知识夸耀自己的博学，智慧却为自己的无知感到羞愧。” 单纯的信息罗列“知识”会让我们骄傲，但受神引导的“智慧”会带领我们进入谦卑。'
        },
        verse: '以色列王大卫儿子所罗门的箴言：要使人晓得智慧和训诲，分辨通达的言语，',
        source: '箴言 1:1-2',
        theme: '知识 vs 智慧',
        application: '为了获得智慧而非知识，你正在为神准备什么？'
      },
      ES: {
        merged: {
          title: 'El Principio de la Sabiduría y la Instrucción',
          body: 'El poeta británico Cowper dijo: "El conocimiento está orgulloso de haber aprendido tanto; la sabiduría es humilde porque no sabe más". El conocimiento, una simple lista de información, nos hace arrogantes, pero la sabiduría, guiada por Dios, nos lleva a la humildad.'
        },
        devotion: {
          title: 'El Principio de la Sabiduría y la Instrucción',
          body: 'El poeta británico Cowper dijo: "El conocimiento está orgulloso de haber aprendido tanto; la sabiduría es humilde porque no sabe más". El conocimiento, una simple lista de información, nos hace arrogantes, pero la sabiduría, guiada por Dios, nos lleva a la humildad.'
        },
        verse: 'Los proverbios de Salomón, hijo de David, rey de Israel: para conocer sabiduría e instrucción, para discernir palabras de inteligencia,',
        source: 'Proverbios 1:1-2',
        theme: 'Conocimiento vs Sabiduría',
        application: '¿Qué estás preparando para Dios para ganar sabiduría en lugar de conocimiento?'
      },
      DE: {
        merged: {
          title: 'Der Anfang von Weisheit und Unterweisung',
          body: 'Der britische Dichter Cowper sagte: "Wissen ist stolz darauf, so viel gelernt zu haben; Weisheit ist demütig, dass sie nicht mehr weiß." Wissen, eine einfache Auflistung von Informationen, macht uns arrogant, aber Weisheit, die von Gott geleitet wird, führt uns zur Demut.'
        },
        devotion: {
          title: 'Der Anfang von Weisheit und Unterweisung',
          body: 'Der britische Dichter Cowper sagte: "Wissen ist stolz darauf, so viel gelernt zu haben; Weisheit ist demütig, dass sie nicht mehr weiß." Wissen, eine einfache Auflistung von Informationen, macht uns arrogant, aber Weisheit, die von Gott geleitet wird, führt uns zur Demut.'
        },
        verse: 'Sprüche Salomos, des Sohnes Davids, des Königs von Israel, um Weisheit und Zucht zu erkennen, um verständige Worte zu verstehen,',
        source: 'Sprüche 1:1-2',
        theme: 'Wissen vs Weisheit',
        application: 'Was bereiten Sie für Gott vor, um Weisheit statt Wissen zu erlangen?'
      },
      HI: {
        merged: {
          title: 'बुद्धि और निर्देश की शुरुआत',
          body: 'ब्रिटिश कवि काउपर ने कहा, "ज्ञान को गर्व है कि उसने इतना कुछ सीखा है; बुद्धि विनम्र है कि वह और नहीं जानती।" ज्ञान, जानकारी की एक सरल सूची, हमें अभिमानी बनाती है, लेकिन बुद्धि, जो ईश्वर द्वारा निर्देशित है, हमें विनम्रता की ओर ले जाती है।'
        },
        devotion: {
          title: 'बुद्धि और निर्देश की शुरुआत',
          body: 'ब्रिटिश कवि काउपर ने कहा, "ज्ञान को गर्व है कि उसने इतना कुछ सीखा है; बुद्धि विनम्र है कि वह और नहीं जानती।" ज्ञान, जानकारी की 일 सरल सूची, हमें अभिमानी बनाती है, लेकिन बुद्धि, जो ईश्वर द्वारा निर्देशित है, हमें विनम्रता की ओर ले जाती है।'
        },
        verse: 'दाऊद के पुत्र, इज़राइल के राजा सुलैमान के नीतिवचन: बुद्धि और शिक्षा प्राप्त करने के लिए; समझ की बातें समझने के लिए;',
        source: 'नीतिवचन 1:1-2',
        theme: 'ज्ञान बनाम बुद्धि',
        application: 'ज्ञान के बजाय बुद्धि प्राप्त करने के लिए आप ईश्वर के लिए क्या तैयारी कर रहे हैं?'
      }
    }
  },
  '1:3': {
    id: 'day_2',
    reference: 'Proverbs 1:3',
    title: '순종의 갈림길',
    verse: '지혜롭게, 의롭게, 공평하게, 정직하게 행할 일에 대하여 훈계를 받게 하며',
    source: '잠언 1:3',
    theme: '하산의 갈림길: 선택의 시뮬레이션',
    commentary: '"눈에 보이는 가까운 길이 때로는 죽음의 길일 수 있습니다. 훈계를 받는 것은 생명을 지키는 지혜입니다."',
    application: '', 
    chartType: 'bar',
    accentColor: '#B07D62',
    tag: 'JANUARY 2nd',
    simulation: 'mountaineer',
  },
  '1:4': {
    id: 'day_3',
    reference: 'Proverbs 1:4',
    title: '어리석은 자를 위한 지혜',
    verse: '어리석은 자로 슬기롭게 하며 젊은 자에게 지식과 근신함을 주기 위한 것이니',
    source: '잠언 1:4',
    theme: '분별력의 중요성',
    commentary: '어리석음은 단순히 지식이 없는 상태가 아니라, 올바른 판단을 내리지 못하는 상태를 의미합니다. 하나님의 말씀은 우리에게 분별력을 주어 세상의 유혹을 이기게 합니다.',
    application: '오늘 당신의 분별력을 흐리게 하는 것은 무엇입니까?',
    chartType: 'none',
    accentColor: '#8A817C',
    tag: 'JANUARY 3rd',
  },
  '1:5': {
    id: 'day_4',
    reference: 'Proverbs 1:5',
    title: '지혜 있는 자의 학식',
    verse: '지혜 있는 자는 듣고 학식이 더할 것이요 명철한 자는 모략을 얻을 것이라',
    source: '잠언 1:5',
    theme: '경청의 자세',
    commentary: '진정한 지혜는 자신의 지식을 자랑하는 것이 아니라, 다른 사람의 말을 경청하고 배우는 자세에서 나옵니다. 하나님은 겸손히 듣는 자에게 더 큰 지혜를 주십니다.',
    application: '당신은 오늘 누구의 말에 귀를 기울여야 합니까?',
    chartType: 'radar',
    accentColor: '#5D6D5F',
    tag: 'JANUARY 4th',
  },
  '1:6': {
    id: 'day_5',
    reference: 'Proverbs 1:6',
    title: '오묘한 말씀의 의미',
    verse: '잠언과 비유와 지혜 있는 자의 말과 그 오묘한 말을 깨달으리라',
    source: '잠언 1:6',
    theme: '영적 통찰력',
    commentary: '하나님의 말씀에는 깊고 오묘한 의미가 담겨 있습니다. 성령의 조명을 통해 우리는 그 말씀의 참된 의미를 깨닫고 삶에 적용할 수 있습니다.',
    application: '말씀을 묵상하며 성령의 조명을 구하고 있습니까?',
    chartType: 'none',
    accentColor: '#463F3A',
    tag: 'JANUARY 5th',
  },
  '1:7': {
    id: 'day_6',
    reference: 'Proverbs 1:7',
    title: '지식의 근본',
    verse: '여호와를 경외하는 것이 지식의 근본이어늘 미련한 자는 지혜와 훈계를 멸시하느니라',
    source: '잠언 1:7',
    theme: '경외함',
    commentary: '하나님을 경외하는 마음이 모든 지혜와 지식의 출발점입니다. 하나님을 인정하지 않는 지식은 결국 우리를 교만과 멸망으로 이끌 뿐입니다.',
    application: '당신의 삶에서 하나님을 경외하는 마음이 가장 먼저 나타나는 영역은 어디입니까?',
    chartType: 'bar',
    accentColor: '#D4A373',
    tag: 'JANUARY 6th',
  },
  '1:8': {
    id: 'day_7',
    reference: 'Proverbs 1:8',
    title: '부모의 훈계',
    verse: '내 아들아 네 아비의 훈계를 들으며 네 어미의 법을 떠나지 말라',
    source: '잠언 1:8',
    theme: '가정 교육',
    commentary: '부모님의 훈계와 가르침은 우리 인생의 든든한 기초가 됩니다. 그 안에는 우리를 향한 사랑과 지혜가 담겨 있습니다.',
    application: '최근 부모님께 받은 훈계나 가르침 중 마음에 새기고 있는 것은 무엇입니까?',
    chartType: 'none',
    accentColor: '#B07D62',
    tag: 'JANUARY 7th',
  },
  '1:9': {
    id: 'day_8',
    reference: 'Proverbs 1:9',
    title: '아름다운 관과 금사슬',
    verse: '이는 네 머리의 아름다운 관이요 네 목의 금사슬이니라',
    source: '잠언 1:9',
    theme: '순종의 가치',
    commentary: '부모님께 순종하고 그 가르침을 따르는 것은 우리를 가장 아름답고 존귀하게 만드는 장식과 같습니다.',
    application: '순종의 아름다움을 삶으로 어떻게 표현할 수 있을까요?',
    chartType: 'radar',
    accentColor: '#8A817C',
    tag: 'JANUARY 8th',
  },
  '1:10': {
    id: 'day_9',
    reference: 'Proverbs 1:10',
    title: '악한 자의 유혹',
    verse: '내 아들아 악한 자가 너를 꾈지라도 좇지 말라',
    source: '잠언 1:10',
    theme: '유혹 분별',
    commentary: '세상은 달콤한 말로 우리를 유혹하여 죄의 길로 이끌려고 합니다. 하나님의 말씀으로 분별력을 키워 그 유혹을 단호히 거절해야 합니다.',
    application: '당신을 유혹하는 악한 자의 꾀임은 주로 어떤 모습으로 다가옵니까?',
    chartType: 'none',
    accentColor: '#5D6D5F',
    tag: 'JANUARY 9th',
  }
};
`;

const monthNames = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
function getTag(dayOfYear) {
  const dateObj = new Date(2026, 0, dayOfYear);
  const month = monthNames[dateObj.getMonth()];
  const day = dateObj.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  return `${month} ${day}${suffix}`;
}

const proverbsObj = {};

let dayCount = 10; // Start from day 10 since 1-9 are already there

// Proverbs: 31 chapters, let's take first 9 verses of each chapter = 279 verses
for (let c = 1; c <= 31; c++) {
  for (let v = 1; v <= 9; v++) {
    if (c === 1 && v <= 10) continue; // Skip the ones we already have
    if (dayCount > 365) break;
    const key = `Pr_${c}_${v}`;
    proverbsObj[key] = {
      id: `day_${dayCount}`,
      reference: `Proverbs ${c}:${v}`,
      title: '',
      verse: `잠언 ${c}장 ${v}절 말씀입니다.`,
      source: `잠언 ${c}:${v}`,
      theme: '지혜',
      commentary: '',
      application: '',
      chartType: dayCount % 3 === 0 ? 'radar' : dayCount % 3 === 1 ? 'bar' : 'none',
      accentColor: dayCount % 2 === 0 ? '#5D6D5F' : '#D4A373',
      tag: getTag(dayCount),
    };
    dayCount++;
  }
}

// Ecclesiastes: 12 chapters, let's take first 3 verses = 36 verses
for (let c = 1; c <= 12; c++) {
  for (let v = 1; v <= 3; v++) {
    if (dayCount > 365) break;
    const key = `Ec_${c}_${v}`;
    proverbsObj[key] = {
      id: `day_${dayCount}`,
      reference: `Ecclesiastes ${c}:${v}`,
      title: '',
      verse: `전도서 ${c}장 ${v}절 말씀입니다.`,
      source: `전도서 ${c}:${v}`,
      theme: '인생',
      commentary: '',
      application: '',
      chartType: dayCount % 3 === 0 ? 'radar' : dayCount % 3 === 1 ? 'bar' : 'none',
      accentColor: dayCount % 2 === 0 ? '#5D6D5F' : '#D4A373',
      tag: getTag(dayCount),
    };
    dayCount++;
  }
}

// Psalms: take first 100 Psalms, verse 1
for (let c = 1; c <= 100; c++) {
  if (dayCount > 365) break;
  const key = `Ps_${c}_1`;
  proverbsObj[key] = {
    id: `day_${dayCount}`,
    reference: `Psalms ${c}:1`,
    title: '',
    verse: `시편 ${c}편 1절 말씀입니다.`,
    source: `시편 ${c}:1`,
    theme: '찬양',
    commentary: '',
    application: '',
    chartType: dayCount % 3 === 0 ? 'radar' : dayCount % 3 === 1 ? 'bar' : 'none',
    accentColor: dayCount % 2 === 0 ? '#5D6D5F' : '#D4A373',
    tag: getTag(dayCount),
  };
  dayCount++;
}

const additionalProverbsStr = JSON.stringify(proverbsObj, null, 2).replace(/^\{\n/, '').replace(/\n\}$/, '');

const finalContent = originalContent.replace(
  /  '1:10': \{[\s\S]*?\}\n\};/,
  `  '1:10': {
    id: 'day_9',
    reference: 'Proverbs 1:10',
    title: '악한 자의 유혹',
    verse: '내 아들아 악한 자가 너를 꾈지라도 좇지 말라',
    source: '잠언 1:10',
    theme: '유혹 분별',
    commentary: '세상은 달콤한 말로 우리를 유혹하여 죄의 길로 이끌려고 합니다. 하나님의 말씀으로 분별력을 키워 그 유혹을 단호히 거절해야 합니다.',
    application: '당신을 유혹하는 악한 자의 꾀임은 주로 어떤 모습으로 다가옵니까?',
    chartType: 'none',
    accentColor: '#5D6D5F',
    tag: 'JANUARY 9th',
  },
${additionalProverbsStr}
};

export const defaultVerseKey = '1:1-2';
export const defaultVerse = proverbs[defaultVerseKey];
`
);

fs.writeFileSync('src/data/proverbs.ts', finalContent);
console.log('Successfully restored and appended 365 verses to src/data/proverbs.ts');
