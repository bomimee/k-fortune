const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function to generate Saju reading using Gemini AI
 */
exports.generateSajuReading = functions.https.onCall(async (data, context) => {
  try {
    // Extract user data
    const {
      name,
      gender,
      birthDate,
      birthTime,
      birthTimeUnknown,
      birthType,
      birthPlace,
      currentResidence,
      focusTopics = [],
      currentSituation,
      type
    } = data;

    console.log('Received request:', { name, birthDate, focusTopics, type });

    // Build the prompt for the AI
    const prompt = buildSajuPrompt(data);
    
    console.log('Generated prompt:', prompt.substring(0, 500) + '...');

    // Call Gemini AI
    const analysis = await callGeminiAI(prompt, type);

    // Return the analysis
    return {
      success: true,
      analysis: analysis,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error generating Saju reading:', error);
    throw new functions.https.HttpsError('internal', 'Failed to generate reading', error.message);
  }
});

/**
 * Call Gemini AI to generate Saju analysis
 */
async function callGeminiAI(prompt, type = 'general') {
  const { VertexAI } = require('@google-cloud/vertexai');
  
  const projectId = process.env.GCLOUD_PROJECT || 'fortune-teller-app';
  const location = 'us-central1';
  
  const vertexAI = new VertexAI({ project: projectId, location: location });
  
  const model = 'gemini-2.0-flash-001';
  
  const generativeModel = vertexAI.preview.getGenerativeModel({
    model: model,
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      topK: 40,
      maxOutputTokens: 8192,
    },
  });

  const request = {
    contents: [{
      role: 'user',
      parts: [{ text: prompt }]
    }],
  };

  console.log('Calling Gemini AI...');
  const result = await generativeModel.generateContent(request);
  const response = result.response;
  const text = response.candidates[0].content.parts[0].text;
  
  console.log('Received response from Gemini AI, length:', text.length);
  
  // Parse the markdown response into structured format
  return parseAIResponse(text, type);
}

/**
 * Parse AI response into structured analysis object
 */
function parseAIResponse(aiResponse, type = 'general') {
  // The AI returns markdown format, parse into sections
  const sections = {};
  
  let sectionPatterns;
  
  if (type === 'compatibility') {
    sectionPatterns = [
      { key: 'summary', pattern: /## 0️⃣ 궁합 핵심 요약([\s\S]*?)(?=---|$)/ },
      { key: 'foundation', pattern: /## 1️⃣ 기본 정보 & 해석 신뢰도([\s\S]*?)(?=---|$)/ },
      { key: 'pillars', pattern: /## 2️⃣ 양측 사주 원국\(표\) \+ 오행 분포([\s\S]*?)(?=---|$)/ },
      { key: 'personality', pattern: /## 3️⃣ 오행 상생상극 분석([\s\S]*?)(?=---|$)/ },
      { key: 'career', pattern: /## 4️⃣ 일주\(日柱\) 비교 분석([\s\S]*?)(?=---|$)/ },
      { key: 'wealth', pattern: /## 5️⃣ 상호 궁합 점수([\s\S]*?)(?=---|$)/ },
      { key: 'relationships', pattern: /## 6️⃣ 장기적 전망([\s\S]*?)(?=---|$)/ },
      { key: 'health', pattern: /## 7️⃣ 갈등 포인트 & 해결 방안([\s\S]*?)(?=---|$)/ },
      { key: 'timing', pattern: /## 8️⃣ 관계 발전을 위한 조언([\s\S]*?)(?=---|$)/ },
      { key: 'actionPlan', pattern: /## 9️⃣ 양측을 위한 개운법([\s\S]*?)(?=---|$)/ },
    ];
  } else if (type === 'year-fortune') {
    sectionPatterns = [
      { key: 'summary', pattern: /## 0️⃣ 연간 운세 핵심 요약([\s\S]*?)(?=---|$)/ },
      { key: 'foundation', pattern: /## 1️⃣ 기본 정보 & 해석 신뢰도([\s\S]*?)(?=---|$)/ },
      { key: 'pillars', pattern: /## 2️⃣ 사주 원국\(표\) \+ 오행 분포([\s\S]*?)(?=---|$)/ },
      { key: 'personality', pattern: /## 3️⃣ 월별 운세([\s\S]*?)(?=---|$)/ },
      { key: 'career', pattern: /## 4️⃣ 계절별 특징([\s\S]*?)(?=---|$)/ },
      { key: 'wealth', pattern: /## 5️⃣ 행운의 달([\s\S]*?)(?=---|$)/ },
      { key: 'relationships', pattern: /## 6️⃣ 주의가 필요한 시기([\s\S]*?)(?=---|$)/ },
      { key: 'health', pattern: /## 7️⃣ 연애\/관계 운세([\s\S]*?)(?=---|$)/ },
      { key: 'timing', pattern: /## 8️⃣ 재물\/커리어 운세([\s\S]*?)(?=---|$)/ },
      { key: 'actionPlan', pattern: /## 9️⃣ 건강 운세([\s\S]*?)(?=---|$)/ },
      { key: 'customAdvice', pattern: /## 🔟 개운법 & 행운의 방향\/색상\/숫자([\s\S]*?)(?=---|$)/ },
    ];
  } else {
    sectionPatterns = [
      { key: 'summary', pattern: /## 📋 핵심 요약 7줄([\s\S]*?)(?=---|$)/ },
      { key: 'foundation', pattern: /## 1️⃣ 기본 정보 & 해석 신뢰도([\s\S]*?)(?=---|$)/ },
      { key: 'pillars', pattern: /## 2️⃣ 사주 원국\(표\) \+ 오행 분포([\s\S]*?)(?=---|$)/ },
      { key: 'personality', pattern: /## 3️⃣ 성향 분석([\s\S]*?)(?=---|$)/ },
      { key: 'career', pattern: /## 4️⃣ 직업·커리어([\s\S]*?)(?=---|$)/ },
      { key: 'wealth', pattern: /## 5️⃣ 재물([\s\S]*?)(?=---|$)/ },
      { key: 'relationships', pattern: /## 6️⃣ 연애\/관계([\s\S]*?)(?=---|$)/ },
      { key: 'health', pattern: /## 7️⃣ 건강\/생활([\s\S]*?)(?=---|$)/ },
      { key: 'timing', pattern: /## 8️⃣ 대운\/세운([\s\S]*?)(?=---|$)/ },
      { key: 'actionPlan', pattern: /## 9️⃣ 개운\/실천 플랜([\s\S]*?)(?=---|$)/ },
      { key: 'customAdvice', pattern: /## 🔟 사용자 질문 맞춤 답변([\s\S]*?)(?=---|$)/ },
    ];
  }

  for (const { key, pattern } of sectionPatterns) {
    const match = aiResponse.match(pattern);
    if (match) {
      sections[key] = {
        title: getSectionTitle(key, type),
        content: match[1].trim()
      };
    }
  }

  // If parsing fails, return full response as single section
  if (Object.keys(sections).length === 0) {
    return {
      summary: { title: '분석 결과', content: aiResponse },
      fullResponse: aiResponse
    };
  }

  return sections;
}

/**
 * Get display title for section key
 */
function getSectionTitle(key, type = 'general') {
  const generalTitles = {
    summary: '핵심 요약',
    foundation: '기본 정보',
    pillars: '사주 원국',
    personality: '성향 분석',
    career: '직업·커리어',
    wealth: '재물',
    relationships: '연애/관계',
    health: '건강/생활',
    timing: '대운/세운',
    actionPlan: '실천 플랜',
    customAdvice: '맞춤 조언'
  };
  
  const compatibilityTitles = {
    summary: '궁합 핵심 요약',
    foundation: '기본 정보',
    pillars: '사주 원국',
    personality: '오행 분석',
    career: '일주 비교',
    wealth: '궁합 점수',
    relationships: '장기 전망',
    health: '갈등 해결',
    timing: '관계 발전',
    actionPlan: '개운법'
  };
  
  const yearFortuneTitles = {
    summary: '연간 운세 요약',
    foundation: '기본 정보',
    pillars: '사주 원국',
    personality: '월별 운세',
    career: '계절별 특징',
    wealth: '행운의 달',
    relationships: '주의 시기',
    health: '연애 운세',
    timing: '재물 운세',
    actionPlan: '건강 운세',
    customAdvice: '개운법'
  };
  
  const titles = type === 'compatibility' ? compatibilityTitles : 
                type === 'year-fortune' ? yearFortuneTitles : generalTitles;
  
  return titles[key] || key;
}

/**
 * Build the detailed prompt for Saju analysis
 */
function buildSajuPrompt(data) {
  const {
    name,
    gender,
    birthDate,
    birthTime,
    birthTimeUnknown,
    birthType,
    birthPlace,
    currentResidence,
    focusTopics = [],
    currentSituation,
    type,
    // Compatibility specific
    partnerName,
    partnerGender,
    partnerBirthDate,
    partnerBirthTime,
    partnerBirthTimeUnknown,
    partnerBirthType,
    partnerBirthPlace,
    relationshipType
  } = data;

  let prompt = '';
  const readingType = type || 'general';

  if (readingType === 'compatibility') {
    prompt = buildCompatibilityPrompt(data);
  } else if (readingType === 'year-fortune') {
    prompt = buildYearFortunePrompt(data);
  } else {
    prompt = buildGeneralPrompt(data);
  }

  return prompt;
}

function buildGeneralPrompt(data) {
  const {
    name,
    gender,
    birthDate,
    birthTime,
    birthTimeUnknown,
    birthType,
    birthPlace,
    currentResidence,
    focusTopics = [],
    currentSituation
  } = data;

  let prompt = `[Role]
You are an 'AI Saju (Four Pillars of Destiny) Analyst' combining traditional Korean Myeongrihak (命理學) with modern psychological insights.
Based on the user's birth chart (八字 Bazi), you provide precise analysis of innate personality, social achievements, life balance, and areas for improvement, offering modern solutions.
Consider the geographical climate (調候 Johu) of the user's birthplace and current residence, as well as cultural and social achievement standards of their country, to provide globally-minded, locally-tailored advice that is not confined to Korean interpretations.

[Safety & Quality Rules]
- Specify reliability: If birth time is missing, indicate it's based on '三柱 (Six Characters)' and provide 2-3 likely scenarios for comparison.
- Simplify terminology: When using Myeongrihak terms like '比肩', '劫財', '用神', always provide modern interpretations (e.g., independence, competitiveness, core solution).
- Avoid absolutes: Instead of "You will definitely succeed," use strategic advice like "This energy is strong, so utilize it this way."
- Maximize readability: Use tables, bullet points, and bold text for easy scanning.

**CRITICAL: You MUST respond in ENGLISH. All section titles, content, and analysis must be written in English.**

[Output Format - Use these exact section titles]
## 📋 Core Summary (7 Lines)
(Within 7 lines: This year's fortune, 2 innate strengths, 1 caution point, action mission)

---

## 1️⃣ Basic Information & Interpretation Reliability
- Year/Month/Day/Hour stems and branches with Ten Gods table
- If time is missing, specify interpretation limitations and estimates

---

## 2️⃣ Birth Chart (Table) + Five Elements Distribution
- Analysis of Wood, Fire, Earth, Metal, Water ratios
- Psychological and physical effects of excessive/deficient elements

---

## 3️⃣ Personality Analysis
- Analysis of innate essence (日干 Day Master) and pattern (social role)
- In-depth analysis of strengths and potential weaknesses (complexes)

---

## 4️⃣ Career & Profession
- Most suitable industries and work styles
- Suitability for organizational vs. independent work

---

## 5️⃣ Wealth & Finance
- Size and flow of innate wealth fortune (structure analysis like 食傷生財, 財多身弱)
- Practical tips for accumulating and preserving wealth

---

## 6️⃣ Love & Relationships
- Ideal spouse/partner style
- Patterns to watch in maintaining relationships

---

## 7️⃣ Health & Lifestyle
- Vulnerable body parts and recommended exercise/lifestyle habits

---

## 8️⃣ Major Luck Cycles (大運/歲運)
- Nature of current 10-year Major Luck cycle and main life changes

---

## 9️⃣ Fortune Enhancement & Action Plan
- Recommended colors, numbers, places, lucky directions
- Mindset to practice habitually

---

## 🔟 Personalized Answers to User's Questions
- Specific advice on user's focus topics and current situation

[User Information]
- Name: ${name}
- Gender: ${gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
- Birth Date: ${birthDate}
- Birth Time: ${birthTimeUnknown ? 'Unknown' : birthTime || 'Not provided'}
- Calendar Type: ${birthType === 'solar' ? 'Solar' : birthType === 'lunar' ? 'Lunar' : birthType === 'leap' ? 'Leap Month' : 'Unknown'}
- Birth Place: ${birthPlace || 'Not provided'}
- Current Residence: ${currentResidence || 'Not provided'}
`;

  if (focusTopics.length > 0) {
    prompt += `- Focus Topics: ${focusTopics.join(', ')}\n`;
  }

  if (currentSituation) {
    prompt += `- Current Situation: ${currentSituation}\n`;
  }

  prompt += `\n[Request]
Please provide a detailed Saju analysis based on the above information.
${focusTopics.length > 0 ? `Especially provide very specific and practical advice on the topics: "${focusTopics.join(', ')}".` : ''}
${birthTimeUnknown ? 'Since birth time is unknown, please provide 2-3 scenarios for different possible time ranges.' : ''}
${birthPlace ? `Consider the geographical and cultural context of ${birthPlace} in your analysis.` : ''}
${currentResidence ? `Take into account that the user currently resides in ${currentResidence}.` : ''}

Write in markdown format with clear sections and bullet points for easy reading.
**IMPORTANT: Write your entire response in ENGLISH. Do not use Korean or any other language.**`;

  return prompt;
}

function buildCompatibilityPrompt(data) {
  const {
    name,
    gender,
    birthDate,
    birthTime,
    birthTimeUnknown,
    birthType,
    birthPlace,
    currentResidence,
    currentSituation,
    partnerName,
    partnerGender,
    partnerBirthDate,
    partnerBirthTime,
    partnerBirthTimeUnknown,
    partnerBirthType,
    partnerBirthPlace,
    relationshipType
  } = data;

  const relationshipLabel = {
    'romantic': 'Romantic Partner',
    'spouse': 'Spouse',
    'parent-child': 'Parent-Child',
    'siblings': 'Siblings',
    'friends': 'Friends',
    'business': 'Business Partner',
    'custom': 'Relationship'
  }[relationshipType] || 'Relationship';

  let prompt = `[Role]
You are an 'AI Saju Compatibility Expert' combining traditional Myeongrihak principles of '合 (Harmony)' and '沖 (Conflict)' with modern relationship psychology.
Through cross-analysis of two people's birth charts, you derive data-based insights on energetic attraction, personality conflicts, long-term synergy, and relationship maintenance strategies.
Consider the geographical climate (調候 Johu) of both individuals' birthplaces and current residences, as well as cultural and social standards of their countries, to provide globally-minded, locally-tailored advice that is not confined to Korean interpretations.

[Safety & Quality Rules]
- Balanced perspective: Don't blame either party; interpret as 'energy differences' and objectively analyze causes of conflict.
- Prevent gaslighting/fear: Instead of "You must break up," provide solution-focused advice like "During these times, this communication method is needed."
- Specify reliability: Indicate interpretation accuracy differences when both have birth times, only one has it, or neither has it.

**CRITICAL: You MUST respond in ENGLISH. All section titles, content, and analysis must be written in English.**

[Output Format - Use these exact section titles]
## 0️⃣ Compatibility Core Summary
(3-line overview + 5 compatibility keywords + relationship compatibility score out of 100)

---

## 1️⃣ Basic Information & Interpretation Reliability
(Summary of both parties' birth information)

---

## 2️⃣ Birth Charts Comparison (Table) + Five Elements Distribution
- Energy contrast centered on each person's Day Master (本質) and Month Branch (環境)
- Side-by-side birth chart comparison in table format

---

## 3️⃣ Five Elements Harmony & Conflict Analysis
- Analysis of whether you complement each other's lacking elements or create excess
- Detailed explanation of Five Elements distribution chart

---

## 4️⃣ Day Pillar (日柱) Comparison Analysis
- Harmony/Conflict between Day Stems (emotional attraction) and Day Branches (lifestyle patterns & intimate compatibility)

---

## 5️⃣ Mutual Compatibility Scores
- Emotional Communication / Value Alignment / Financial Synergy / Sexual Harmony / Social Support (each out of 100)

---

## 6️⃣ Long-term Outlook
- Years and months to particularly watch based on both people's luck flow
- Relationship timeline (effects of Major/Annual Luck)

---

## 7️⃣ Conflict Points & Solutions
- Clashing energies in the charts and modern communication methods to mitigate them
- Conflict triggers and 'fire extinguishers'

---

## 8️⃣ Advice for Relationship Development
- Actions/words to absolutely avoid with each other
- Customized guide to strengthen the relationship

---

## 9️⃣ Fortune Enhancement for Both
- 'Shared lucky elements' to strengthen the relationship (places, activities, colors, etc.)
- Overall conclusion and encouraging message

[Person A Information]
- Name: ${name}
- Gender: ${gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
- Birth Date: ${birthDate}
- Birth Time: ${birthTimeUnknown ? 'Unknown' : birthTime || 'Not provided'}
- Calendar Type: ${birthType === 'solar' ? 'Solar' : birthType === 'lunar' ? 'Lunar' : birthType === 'leap' ? 'Leap Month' : 'Unknown'}
- Birth Place: ${birthPlace || 'Not provided'}
${currentResidence ? `- Current Residence: ${currentResidence}` : ''}

[Person B Information]
- Name: ${partnerName || 'Not provided'}
- Gender: ${partnerGender === 'male' ? 'Male' : partnerGender === 'female' ? 'Female' : 'Other'}
- Birth Date: ${partnerBirthDate || 'Not provided'}
- Birth Time: ${partnerBirthTimeUnknown ? 'Unknown' : partnerBirthTime || 'Not provided'}
- Calendar Type: ${partnerBirthType === 'solar' ? 'Solar' : partnerBirthType === 'lunar' ? 'Lunar' : partnerBirthType === 'leap' ? 'Leap Month' : 'Unknown'}
- Birth Place: ${partnerBirthPlace || 'Not provided'}

- Relationship Type: ${relationshipLabel}
`;

  if (currentSituation) {
    prompt += `- Current Relationship Situation: ${currentSituation}\n`;
  }

  prompt += `\n[Request]
Please provide a detailed compatibility analysis based on the information of both individuals.
${birthTimeUnknown || partnerBirthTimeUnknown ? 'For missing birth times, please include scenarios for different possible time ranges.' : ''}
${birthPlace || partnerBirthPlace ? `Consider the geographical and cultural contexts of the birthplaces in your analysis.` : ''}

Write in markdown format with clear sections and bullet points for easy reading.
Provide specific rationale for each score item.
**IMPORTANT: Write your entire response in ENGLISH. Do not use Korean or any other language.**`;

  return prompt;
}

function buildYearFortunePrompt(data) {
  const {
    name,
    gender,
    birthDate,
    birthTime,
    birthTimeUnknown,
    birthType,
    birthPlace,
    currentResidence,
    currentSituation
  } = data;

  let prompt = `[Role]
You are an 'AI Annual Fortune Expert' combining traditional Myeongrihak '歲運 (Annual Luck)' analysis with modern 'Life Coaching'.
You precisely track month-by-month interactions between the user's birth chart and the year 2026's Heavenly Stem/Earthly Branch, suggesting optimal timing and execution strategies.
Consider the geographical climate (調候 Johu) of the user's birthplace and current residence, as well as cultural and social achievement standards of their country, to provide globally-minded, locally-tailored advice that is not confined to Korean interpretations.

[Safety & Quality Rules]
- Timing-focused analysis: Specify concrete guidance on "when to start and when to stop."
- Visualize energy flow: Express monthly fortune highs/lows based on Five Elements' interactions in a readable format.
- Handle uncertainty: If birth time is missing, provide two versions of monthly flow based on Strong/Weak Day Master variations.
- Readability: Place core keywords in 'hashtag' format at the top of monthly analysis.

**CRITICAL: You MUST respond in ENGLISH. All section titles, content, and analysis must be written in English.**

[Output Format - Use these exact section titles]
## 0️⃣ Annual Fortune Core Summary
(Year's motto, 5 core keywords, annual fortune energy graph summary)

---

## 1️⃣ Basic Information & Interpretation Reliability
(Including birth chart analysis)

---

## 2️⃣ Birth Chart (Table) + Five Elements Distribution
(Relationship between 2026's stems/branches and your chart, fundamental changes this year's energy brings to your life)

---

## 3️⃣ Monthly Fortune
Detailed monthly analysis (January~December):
**January**: [Monthly theme: #keyword1 #keyword2, Fortune flow, Major events & opportunities, Cautions]
**February**: [Content]
**March**: [Content]
**April**: [Content]
**May**: [Content]
**June**: [Content]
**July**: [Content]
**August**: [Content]
**September**: [Content]
**October**: [Content]
**November**: [Content]
**December**: [Content]

---

## 4️⃣ Seasonal Characteristics
(Spring/Summer/Fall/Winter): Analysis of major energy transition points by season

---

## 5️⃣ Lucky Months
[Best Timing] Best months of the year and how to utilize them (reasons and specific action advice)

---

## 6️⃣ Caution Periods
[Caution] Periods requiring caution and countermeasures (risk management strategy)

---

## 7️⃣ Love & Relationships Fortune
(Focused analysis on romance and relationships)

---

## 8️⃣ Wealth & Career Fortune
(Focused analysis on finance and career)

---

## 9️⃣ Health Fortune
(Focused analysis on health and psychology)

---

## 🔟 Fortune Enhancement & Lucky Directions/Colors/Numbers
Lucky directions, colors, numbers, lucky items, and customized feng shui advice
[Action Plan] Monthly checklist to lead this year to victory

[User Information]
- Name: ${name}
- Gender: ${gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
- Birth Date: ${birthDate}
- Birth Time: ${birthTimeUnknown ? 'Unknown' : birthTime || 'Not provided'}
- Calendar Type: ${birthType === 'solar' ? 'Solar' : birthType === 'lunar' ? 'Lunar' : birthType === 'leap' ? 'Leap Month' : 'Unknown'}
- Birth Place: ${birthPlace || 'Not provided'}
- Current Residence: ${currentResidence || 'Not provided'}
`;

  if (currentSituation) {
    prompt += `- Current Year's Focus: ${currentSituation}\n`;
  }

  prompt += `\n[Request]
Please provide a detailed monthly fortune analysis for 2026.
${birthTimeUnknown ? 'Since birth time is unknown, please include scenarios for different possible time ranges.' : ''}
For each month, specify concrete events, opportunities, and cautions.
${birthPlace ? `Consider the geographical and cultural context of ${birthPlace} in your analysis.` : ''}
${currentResidence ? `Take into account that the user currently resides in ${currentResidence}.` : ''}

Write in markdown format with clear sections and bullet points for easy reading.
**IMPORTANT: Write your entire response in ENGLISH. Do not use Korean or any other language.**`;

  return prompt;
}

/**
 * Generate mock analysis for testing
 */
function generateMockAnalysis(data) {
  const { name, focusTopics = [], birthTimeUnknown, currentSituation } = data;
  
  const focusTopicsText = focusTopics.length > 0 
    ? focusTopics.map(t => `**${t}**`).join(', ')
    : '종합 운세';

  return `# 🌟 ${name}님의 사주 분석 리포트

## 📋 핵심 요약 7줄

1. **일주(日柱) 특성**: 당신은 강한 의지력과 창의성을 지닌 분입니다.
2. **오행 균형**: 목(木) 기운이 강하여 성장과 발전의 에너지가 충만합니다.
3. **직업 적성**: 기획, 교육, 창작 분야에서 두각을 나타낼 가능성이 높습니다.
4. **재물운**: 꾸준한 저축과 투자로 중년 이후 안정적인 재물 축적이 예상됩니다.
5. **인간관계**: 진실된 관계를 중시하며, 소수의 깊은 인연을 선호합니다.
6. **건강**: 소화기 계통과 스트레스 관리에 주의가 필요합니다.
7. **대운**: 현재 대운은 변화와 도전의 시기로, 새로운 기회를 적극 활용하세요.

---

## 1️⃣ 기본 정보 & 해석 신뢰도

### 제공된 정보
- **이름**: ${name}
- **출생일**: ${data.birthDate}
- **출생시간**: ${birthTimeUnknown ? '❌ 미제공 (시간대별 시나리오 제공)' : `✅ ${data.birthTime}`}
- **출생지**: ${data.birthPlace || '미제공'}
- **중점 분석 주제**: ${focusTopicsText}

### 해석 신뢰도
${birthTimeUnknown 
  ? `⚠️ **중간 신뢰도 (70%)**: 출생시간이 없어 시주(時柱)를 정확히 알 수 없습니다. 
  아래에서 가능한 시간대별 3가지 시나리오를 제공합니다.`
  : `✅ **높은 신뢰도 (95%)**: 출생일시가 모두 제공되어 정확한 사주 분석이 가능합니다.`}

---

## 2️⃣ 사주 원국(표) + 오행 분포

### 사주 원국 (四柱)

| 구분 | 천간(天干) | 지지(地支) |
|------|-----------|-----------|
| **년주(年柱)** | 갑(甲) | 인(寅) |
| **월주(月柱)** | 병(丙) | 진(辰) |
| **일주(日柱)** | 무(戊) | 술(戌) |
| **시주(時柱)** | ${birthTimeUnknown ? '미상' : '경(庚)'} | ${birthTimeUnknown ? '미상' : '자(子)'} |

### 오행 분포

\`\`\`
木 (목): ███████░░░ 70%  ← 강함
火 (화): ████░░░░░░ 40%
土 (토): ██████░░░░ 60%
金 (금): ███░░░░░░░ 30%
水 (수): ██░░░░░░░░ 20%  ← 약함
\`\`\`

**분석**: 목(木) 기운이 강하고 수(水) 기운이 약합니다. 성장과 확장의 에너지는 충분하나, 유연성과 지혜를 보완할 필요가 있습니다.

---

## 3️⃣ 성향 분석

### 핵심 성격
- **일간(日干) 무토(戊土)**: 큰 산과 같은 안정적이고 신뢰할 수 있는 성격
- **강점**: 책임감, 인내심, 포용력, 실용적 사고
- **약점**: 고집, 변화에 대한 저항, 감정 표현 서툼

### 대인관계 스타일
- 진실되고 신뢰할 수 있는 관계를 선호
- 겉으로는 무뚝뚝하나 속은 따뜻함
- 리더십이 있으나 독단적일 수 있음

### 의사결정 패턴
- 신중하고 보수적인 결정
- 충분한 정보 수집 후 행동
- 한번 결정하면 끝까지 밀고 나가는 추진력

---

## 4️⃣ 직업·커리어

### 적합한 직업군
1. **관리/행정**: 조직 관리, 프로젝트 매니저, 공무원
2. **교육/상담**: 교사, 강사, 컨설턴트
3. **부동산/건설**: 부동산 중개, 건축 설계, 인테리어
4. **금융/회계**: 재무 설계사, 회계사, 세무사

### 커리어 발전 전략
- **20-30대**: 전문성 축적, 다양한 경험 쌓기
- **40-50대**: 리더십 발휘, 독립/창업 고려
- **60대 이후**: 후진 양성, 자문/고문 역할

${focusTopics.includes('Career/Change') ? `
### 🎯 이직/커리어 변화 심층 분석
현재 대운을 보면 **변화의 시기**입니다. 다음 사항을 고려하세요:

1. **타이밍**: 지금부터 향후 2년이 이직의 적기입니다.
2. **방향성**: 현재 업종에서 직급을 올리는 것보다, 새로운 분야로의 도전이 유리합니다.
3. **준비사항**: 
   - 새로운 기술/자격증 취득
   - 네트워킹 강화
   - 재정적 안전망 확보 (최소 6개월 생활비)
4. **주의사항**: 급하게 결정하지 말고, 3개월 이상 충분히 고민하세요.
` : ''}

---

## 5️⃣ 재물

### 재물운 개요
- **재성(財星)**: 중간 수준, 노력에 비례한 재물 획득
- **재물 스타일**: 투기보다는 저축, 안정적 투자 선호
- **재물 시기**: 40대 중반 이후 본격적인 재물 축적

### 재물 증대 방법
1. **주 수입원**: 본업에 충실, 전문성으로 승부
2. **부 수입원**: 부동산, 배당주 등 안정적 투자
3. **피해야 할 것**: 고위험 투자, 보증, 투기

${focusTopics.includes('Wealth/Business') ? `
### 💰 재물/사업 심층 분석

#### 사업 운
- **사업 적성**: ⭐⭐⭐⭐☆ (4/5) - 사업 운이 있습니다!
- **최적 시기**: 35-45세 사이
- **추천 업종**: 교육, 컨설팅, 부동산, 유통

#### 사업 성공 전략
1. **파트너십**: 혼자보다는 신뢰할 수 있는 파트너와 함께
2. **초기 자본**: 빚보다는 자기 자본 위주로 시작
3. **성장 속도**: 급성장보다는 안정적 성장 추구
4. **위험 관리**: 항상 최악의 시나리오 대비책 마련

#### 투자 포트폴리오 제안
- **안전 자산 (60%)**: 예금, 국채, 안정적 배당주
- **성장 자산 (30%)**: 부동산, 인덱스 펀드
- **고위험 자산 (10%)**: 개별 주식, 암호화폐 (여유 자금만)
` : ''}

---

## 6️⃣ 연애/관계

### 연애 스타일
- **이상형**: 지적이고 차분한 스타일, 내면의 깊이가 있는 사람
- **연애 패턴**: 천천히 시작하지만 깊고 오래가는 관계
- **주의점**: 감정 표현을 더 적극적으로 할 필요

### 결혼운
- **결혼 적기**: 28-32세 또는 35-38세
- **배우자 특성**: 안정적이고 가정적인 성향
- **결혼 생활**: 평온하고 안정적, 서로 존중하는 관계

${focusTopics.includes('Love/Marriage') ? `
### 💕 연애/결혼 심층 분석

#### 현재 연애운 (2026년 기준)
- **전반적 운세**: ⭐⭐⭐⭐☆ (4/5) - 좋은 만남의 시기!
- **만남 가능성**: 높음 (특히 3-5월, 9-11월)
- **만남 장소**: 교육 관련 장소, 친구 소개, 취미 모임

#### 연애 발전 단계별 조언

**1단계: 만남 (1-3개월)**
- 너무 빨리 마음을 주지 말고 천천히 관찰
- 상대의 가치관과 생활 습관 파악
- 자연스러운 대화로 공통점 찾기

**2단계: 교제 (3-12개월)**
- 정기적인 데이트로 관계 깊이 더하기
- 서로의 가족, 친구들과 만남 시도
- 갈등 시 솔직한 대화로 해결

**3단계: 결혼 준비 (1-2년)**
- 경제적 준비 상태 점검
- 결혼 후 생활 방식 구체적 논의
- 양가 부모님과의 관계 형성

#### 배우자 찾기 체크리스트
✅ 가치관이 비슷한가?
✅ 서로를 존중하는가?
✅ 경제관념이 건전한가?
✅ 가족을 소중히 여기는가?
✅ 장기적 비전을 공유하는가?

${currentSituation && currentSituation.includes('연애') ? `
#### 현재 상황 맞춤 조언
당신의 현재 상황: "${currentSituation}"

이 상황에서는 다음을 권장합니다:
1. 감정적 결정보다는 이성적 판단 우선
2. 상대방의 입장에서 생각해보기
3. 필요하다면 잠시 거리를 두고 생각할 시간 갖기
4. 신뢰할 수 있는 친구나 가족과 상담
` : ''}
` : ''}

---

## 7️⃣ 건강/생활

### 건강 주의사항
- **취약 부위**: 소화기(위장), 관절, 피부
- **주의 질환**: 위염, 당뇨, 고혈압 (40대 이후)
- **건강 관리**: 규칙적인 식사, 적당한 운동, 스트레스 관리

### 생활 습관 제안
1. **아침**: 가벼운 스트레칭, 영양가 있는 아침 식사
2. **점심**: 규칙적인 식사 시간, 과식 주의
3. **저녁**: 가벼운 산책, 명상이나 독서로 마음 정리
4. **주말**: 자연 속 활동, 취미 생활

${focusTopics.includes('Health') ? `
### 🏥 건강 심층 분석

#### 체질 분석
- **체질**: 태음인 또는 소양인 가능성
- **특징**: 소화 기능이 중요, 스트레스에 민감

#### 연령대별 건강 관리

**20-30대**
- 기초 체력 다지기
- 올바른 식습관 형성
- 정기 건강검진 시작

**40-50대**
- 성인병 예방 집중
- 근력 운동 강화
- 정신 건강 관리

**60대 이상**
- 만성 질환 관리
- 낙상 예방
- 사회 활동 유지

#### 추천 운동
1. **유산소**: 걷기, 수영, 자전거 (주 3-4회, 30분 이상)
2. **근력**: 맨몸 운동, 가벼운 웨이트 (주 2-3회)
3. **유연성**: 요가, 스트레칭 (매일 10-15분)

#### 식이 요법
- **좋은 음식**: 현미, 채소, 생선, 견과류
- **피할 음식**: 과도한 육류, 인스턴트, 술, 담배
- **식사 원칙**: 소식, 규칙적, 천천히 씹기
` : ''}

---

## 8️⃣ 대운/세운

### 현재 대운 (2020-2029)
- **대운 천간**: 병화(丙火)
- **대운 지지**: 오화(午火)
- **특징**: 활동적이고 변화가 많은 시기, 새로운 도전의 기회

### 연도별 세운 (2024-2028)

| 연도 | 세운 | 주요 특징 | 조언 |
|------|------|----------|------|
| 2024 | 갑진 | 변화와 성장 | 새로운 시작에 적극적 |
| 2025 | 을사 | 인간관계 중요 | 네트워킹 강화 |
| 2026 | 병오 | 활동력 최고조 | 목표 달성 집중 |
| 2027 | 정미 | 안정화 시기 | 성과 정리 및 저축 |
| 2028 | 무신 | 새로운 준비 | 다음 단계 계획 |

${focusTopics.includes('Yearly Fortune') ? `
### 📅 2026년 상세 운세

#### 월별 운세

**1-2월 (인묘월)**
- 새해 계획 수립 및 실행
- 건강 관리 시작
- 재정 점검

**3-4월 (진사월)**
- 새로운 만남, 기회 증가
- 적극적인 활동 권장
- 투자 기회 검토

**5-6월 (오미월)**
- 최고 활동 시기
- 중요한 결정 가능
- 성과 가시화

**7-8월 (신유월)**
- 휴식과 재충전
- 여행 또는 자기 계발
- 건강 점검

**9-10월 (술해월)**
- 수확의 시기
- 성과 정리
- 감사와 나눔

**11-12월 (자축월)**
- 한 해 마무리
- 내년 준비
- 가족과의 시간
` : ''}

---

## 9️⃣ 개운/실천 플랜

### 개운 방법

#### 방위
- **길한 방위**: 동쪽, 남동쪽
- **활용**: 중요한 일은 이 방향에서 진행
- **여행**: 이 방향으로의 여행이 길함

#### 색상
- **행운 색**: 초록색, 청록색, 밝은 갈색
- **활용**: 옷, 소품, 인테리어에 활용
- **피할 색**: 검정, 진한 회색 (과도한 사용 자제)

#### 숫자
- **행운 숫자**: 3, 8, 13
- **활용**: 중요한 날짜 선택 시 참고

### 30일 실천 플랜

**Week 1: 자기 이해**
- Day 1-2: 자신의 강점/약점 정리
- Day 3-4: 목표 설정 (단기/장기)
- Day 5-7: 현재 상황 점검

**Week 2: 건강 기반**
- Day 8-10: 운동 루틴 시작
- Day 11-13: 식습관 개선
- Day 14: 건강검진 예약

**Week 3: 관계 개선**
- Day 15-17: 중요한 사람들과 연락
- Day 18-20: 새로운 만남 시도
- Day 21: 감사 편지 쓰기

**Week 4: 재물/커리어**
- Day 22-24: 재정 상태 점검
- Day 25-27: 커리어 계획 수립
- Day 28-30: 실행 계획 구체화

---

## 🔟 사용자 질문 맞춤 답변

${currentSituation ? `
### 현재 상황에 대한 조언

**당신의 상황**: "${currentSituation}"

이 상황에서 사주적으로 볼 때:

1. **타이밍**: 현재 대운과 세운을 고려할 때, 이 문제는 ${Math.random() > 0.5 ? '적극적으로 해결할 시기' : '신중하게 접근할 시기'}입니다.

2. **접근 방법**: 
   - 감정적 결정보다는 이성적 판단을 우선하세요
   - 주변의 신뢰할 수 있는 사람들과 상의하세요
   - 장기적 관점에서 생각하세요

3. **예상 결과**: 
   - 단기적으로는 어려움이 있을 수 있으나
   - 장기적으로는 긍정적인 방향으로 흘러갈 가능성이 높습니다

4. **실천 사항**:
   - 매일 10분 명상으로 마음 정리
   - 문제를 작은 단위로 나누어 해결
   - 긍정적인 마인드 유지
` : ''}

${focusTopics.length > 0 ? `
### 선택하신 주제에 대한 종합 조언

당신이 중점적으로 알고 싶어 하신 **${focusTopicsText}**에 대해:

${focusTopics.map((topic, idx) => `
**${idx + 1}. ${topic}**
- 현재 운세: ⭐⭐⭐⭐☆
- 핵심 조언: 이 분야에서 성공하려면 꾸준함과 인내가 필요합니다
- 실천 방법: 매일 작은 목표를 설정하고 달성하세요
- 주의사항: 너무 급하게 결과를 바라지 마세요
`).join('\n')}
` : ''}

---

## 📌 마무리 말씀

${name}님, 사주는 운명을 알려주는 것이 아니라 **가능성과 경향**을 보여주는 도구입니다.

**기억하세요:**
1. 사주는 참고 자료일 뿐, 최종 결정은 당신의 몫입니다
2. 노력과 선택으로 얼마든지 운명을 개척할 수 있습니다
3. 긍정적인 마음가짐이 가장 강력한 개운법입니다

**다음 단계:**
- 이 리포트를 저장하고 정기적으로 확인하세요
- 30일 실천 플랜을 실행해보세요
- 6개월 후 변화를 점검하세요

당신의 밝은 미래를 응원합니다! 🌟

---

*본 분석은 AI 기반 사주 분석으로, 참고 목적으로만 활용하시기 바랍니다.*
*중요한 결정은 전문 명리학자와 상담하시는 것을 권장합니다.*

**생성 시간**: ${new Date().toLocaleString('ko-KR')}
`;
}

module.exports = { generateSajuReading: exports.generateSajuReading };
