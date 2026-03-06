const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

/**
 * Cloud Function to generate Saju reading using Gemini AI
 */
exports.generateSajuReading = functions.https.onCall(async (data, context) => {
  try {
    // In some environments, the payload may be incorrectly left wrapped in { data: ... }
    // or passed as a CallableRequest object where payload is in .data
    let payload = data;
    if (data && data.data && typeof data.data === 'object' && !data.name) {
      payload = data.data;
    }

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
    } = payload;

    console.log('Received request payload:', JSON.stringify(payload));

    // Build the prompt for the AI
    const prompt = buildSajuPrompt(payload);
    
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
 * Cloud Function to create Polar Checkout session
 */
exports.createPolarCheckout = functions.https.onCall(async (data, context) => {
  try {
    const { success_url } = data;
    // We use the provided Organization Access Token to authenticate with Polar API
    const POLAR_API_KEY = process.env.POLAR_ACCESS_TOKEN || 'polar_oat_JsNLoXBCHFlvArmgP3xnNhsmFa6bdSRHoEQX92NBXDM';
    const PRODUCT_ID = '8abf75a9-86a6-4a43-8192-a1b33b01edec'; // Hardcoded newly fetched Product ID from Polar
    
    // In Node.js environment on Firebase, fetch might not be globally available depending on node version,
    // so we use dynamic import of 'node-fetch' or the built-in fetch if Node >= 18.
    // Firebase functions engine is "node": "20" here, so native fetch is available.
    
    const response = await fetch('https://api.polar.sh/v1/checkouts/custom/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POLAR_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        product_id: PRODUCT_ID,
        success_url: success_url
      })
    });
    
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || 'Failed to create Polar checkout link.');
    }
    
    return { url: result.url };

  } catch (error) {
    console.error('Error creating Polar checkout:', error);
    throw new functions.https.HttpsError('internal', 'Polar Checkout Error', error.message);
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
      { key: 'summary',       pattern: /## 0️⃣ Compatibility Core Summary([\s\S]*?)(?=\n## |$)/ },
      { key: 'foundation',   pattern: /## 1️⃣ Basic Information[^\n]*([\s\S]*?)(?=\n## |$)/ },
      { key: 'pillars',      pattern: /## 2️⃣ Birth Charts[^\n]*([\s\S]*?)(?=\n## |$)/ },
      { key: 'personality',  pattern: /## 3️⃣ Five Elements Harmony[^\n]*([\s\S]*?)(?=\n## |$)/ },
      { key: 'career',       pattern: /## 4️⃣ Day Pillar[^\n]*([\s\S]*?)(?=\n## |$)/ },
      { key: 'wealth',       pattern: /## 5️⃣ Mutual Compatibility Scores[^\n]*([\s\S]*?)(?=\n## |$)/ },
      { key: 'relationships',pattern: /## 6️⃣ Long-Term[^\n]*([\s\S]*?)(?=\n## |$)/ },
      { key: 'health',       pattern: /## 7️⃣ Potential Conflicts[^\n]*([\s\S]*?)(?=\n## |$)/ },
      { key: 'timing',       pattern: /## 8️⃣ Mutual Growth[^\n]*([\s\S]*?)(?=\n## |$)/ },
      { key: 'actionPlan',   pattern: /## 9️⃣ Fortune Enhancement[^\n]*([\s\S]*?)(?=\n## |$)/ },
      { key: 'customAdvice', pattern: /## 🔟 Current Situation[^\n]*([\s\S]*?)(?=\n## |$)/ },
    ];
  } else if (type === 'year-fortune') {
    sectionPatterns = [
      { key: 'summary', pattern: /## ✨ Overall New Year Fortune([\s\S]*?)(?=\n## |$)/ },
      { key: 'love', pattern: /## 💖 Detailed Interpretation: Love & Relationships([\s\S]*?)(?=\n## |$)/ },
      { key: 'wealth', pattern: /## 💰 Detailed Interpretation: Wealth & Finance([\s\S]*?)(?=\n## |$)/ },
      { key: 'career', pattern: /## 💼 Detailed Interpretation: Career & Professional([\s\S]*?)(?=\n## |$)/ },
      { key: 'health', pattern: /## 🏥 Detailed Interpretation: Health & Vitality([\s\S]*?)(?=\n## |$)/ },
      { key: 'academic', pattern: /## 📚 Detailed Interpretation: Academic & Growth([\s\S]*?)(?=\n## |$)/ },
      { key: 'personality', pattern: /## 📅 Monthly Fortune([\s\S]*?)(?=\n## |$)/ }, // keep key as personality so frontend doesn't break pdf extraction
    ];
  } else if (type === 'daily-fortune') {
    sectionPatterns = [
      { key: 'summary', pattern: /## 0️⃣ Overall Daily Luck([\s\S]*?)(?=\n## |$)/ },
      { key: 'love', pattern: /## 1️⃣ Love & Relationships Luck([\s\S]*?)(?=\n## |$)/ },
      { key: 'wealth', pattern: /## 2️⃣ Wealth & Finance Luck([\s\S]*?)(?=\n## |$)/ },
      { key: 'career', pattern: /## 3️⃣ Career & Business Luck([\s\S]*?)(?=\n## |$)/ },
      { key: 'academic', pattern: /## 4️⃣ Academic & Study Luck([\s\S]*?)(?=\n## |$)/ },
      { key: 'health', pattern: /## 5️⃣ Health & Condition([\s\S]*?)(?=\n## |$)/ },
      { key: 'customAdvice', pattern: /## 6️⃣ Personalized Solution for You([\s\S]*?)(?=\n## |$)/ },
      { key: 'luckyItems', pattern: /## 7️⃣ Today's Lucky Keys([\s\S]*?)(?=\n## |$)/ },
    ];
  } else {
    sectionPatterns = [
      { key: 'summary', pattern: /## 📋 Core Summary([\s\S]*?)(?=\n## |$)/ },
      { key: 'foundation', pattern: /## 1️⃣ Basic Information & Interpretation Reliability([\s\S]*?)(?=\n## |$)/ },
      { key: 'pillars', pattern: /## 2️⃣ Birth Chart Breakdown & Five Elements \(Wu Xing\)([\s\S]*?)(?=\n## |$)/ },
      { key: 'personality', pattern: /## 3️⃣ Deep Personality Analysis([\s\S]*?)(?=\n## |$)/ },
      { key: 'career', pattern: /## 4️⃣ Career & Professional Trajectory([\s\S]*?)(?=\n## |$)/ },
      { key: 'wealth', pattern: /## 5️⃣ Wealth & Financial Capacity([\s\S]*?)(?=\n## |$)/ },
      { key: 'relationships', pattern: /## 6️⃣ Love, Marriage & Interpersonal Relationships([\s\S]*?)(?=\n## |$)/ },
      { key: 'health', pattern: /## 7️⃣ Health & Vitality([\s\S]*?)(?=\n## |$)/ },
      { key: 'timing', pattern: /## 8️⃣ Major Luck Cycles \(Daewun & Sewun\)([\s\S]*?)(?=\n## |$)/ },
      { key: 'actionPlan', pattern: /## 9️⃣ Fortune Enhancement & Action Plan([\s\S]*?)(?=\n## |$)/ },
      { key: 'customAdvice', pattern: /## 🔟 Current Situation Analysis & Tailored Wisdom([\s\S]*?)(?=\n## |$)/ },
    ];
  }

  for (const { key, pattern } of sectionPatterns) {
    const match = aiResponse.match(pattern);
    if (match) {
      sections[key] = {
        title: getSectionTitle(key, type),
        content: match[1].replace(/[\s-]+$/, '')
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
    summary: 'Core Summary',
    foundation: 'Basic Information & Interpretation Reliability',
    pillars: 'Birth Chart Breakdown & Five Elements',
    personality: 'Deep Personality Analysis',
    career: 'Career & Professional Trajectory',
    wealth: 'Wealth & Financial Capacity',
    relationships: 'Love, Marriage & Interpersonal Relationships',
    health: 'Health & Vitality',
    timing: 'Major Luck Cycles (Daewun & Sewun)',
    actionPlan: 'Fortune Enhancement & Action Plan',
    customAdvice: 'Current Situation Analysis & Tailored Wisdom'
  };
  
  const compatibilityTitles = {
    summary: 'Compatibility Core Summary',
    foundation: 'Basic Information & Reliability',
    pillars: 'Birth Charts & Five Elements',
    personality: 'Harmony & Conflict Analysis',
    career: 'Day Pillar Comparison',
    wealth: 'Compatibility Scores',
    relationships: 'Long-Term Outlook',
    health: 'Conflicts & Strategies',
    timing: 'Mutual Growth Guide',
    actionPlan: 'Fortune Enhancement',
    customAdvice: "Current Situation & Master's Advice"
  };
  
  const yearFortuneTitles = {
    summary: '2026 Core Theme Summary',
    foundation: 'Basic Information & Reliability',
    pillars: 'Birth Chart & Five Elements',
    personality: 'Detailed Monthly Fortune',
    career: 'Energy Flow by Season',
    wealth: 'Your Peak Lucky Months',
    relationships: 'Crucial Caution Periods',
    health: 'Love & Relationship Outlook',
    timing: 'Wealth & Career Projection',
    actionPlan: 'Health & Vitality',
    customAdvice: "Master's Advice for Your Current Focus"
  };

  const dailyFortuneTitles = {
    summary: 'Overall Daily Luck',
    love: 'Love & Relationships Luck',
    wealth: 'Wealth & Finance Luck',
    career: 'Career & Business Luck',
    academic: 'Academic & Study Luck',
    health: 'Health & Condition',
    customAdvice: 'Personalized Solution',
    luckyItems: 'Today\'s Lucky Keys',
  };
  
  const titles = type === 'compatibility' ? compatibilityTitles : 
                type === 'year-fortune' ? yearFortuneTitles : 
                type === 'daily-fortune' ? dailyFortuneTitles : generalTitles;
  
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
  } else if (readingType === 'daily-fortune') {
    prompt = buildDailyFortunePrompt(data);
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
You are a 'Master AI Saju (Four Pillars of Destiny) Analyst' combining exceptional traditional Korean Myeongrihak (命理學) expertise with modern psychological, practical insights.
You are tasked with generating an incredibly detailed, comprehensive, and highly professional Saju reading for the user. The output must be exceedingly thorough, equivalent in depth and length to a full A4 page of dense, professional analysis (at least 2000 words).

Based on the user's birth chart (八字 Bazi), you must provide precise and deeply reasoned analysis of their innate personality, social achievements, life balance, and practical modern solutions.
Consider the geographical climate (調候 Johu) of the user's birthplace and current residence.

[CRITICAL INSTRUCTION - CURRENT SITUATION]
The user may provide a 'Current Situation' or 'Wish' for today. **DO NOT let this current situation bias or influence your core Saju analysis (Sections 1 through 9).** The core analysis (Personality, Career, Wealth, etc.) must remain completely objective and based *only* on their birth chart. You must ONLY address their 'Current Situation' in **Section 10**.

[Safety & Quality Rules]
- **EXTREME DETAIL**: Each section must contain multiple paragraphs of deep, insightful analysis. Do not write superficially. Explain *why* you are making a claim based on the Eight Characters.
- Birth Chart Generation: You MUST build and present the birth chart. If the exact birth time is unknown, assume a baseline (e.g., standard daylight hour) and clearly state in Section 1 that this is a '三柱 (Six Characters)' estimation, but YOU MUST STILL GENERATE A RICH, COMPLETE ANALYSIS based on the Year, Month, and Day pillars. NEVER say you cannot generate an analysis.
- Simplify Myeongrihak terminology: Always provide modern, universally understandable interpretations of terms.
- Maximize readability: Use well-structured paragraphs, bullet points, and bold text for key insights.

**CRITICAL: You MUST respond in pure ENGLISH. All section titles, content, and analysis must be written entirely in English.**

[Output Format - Use these exact section titles and fill them with extensive detail]

## 📋 Core Summary
(Provide a dense, insightful summary: The overarching theme of their life, 3 innate strengths, 2 major caution points, and a definitive life strategy.)

---

## 1️⃣ Basic Information & Interpretation Reliability
- Provide the Year, Month, Day, and Hour stems and branches along with the corresponding Ten Gods (十神).
- If birth time is missing, explicitly mention the limitation but confirm that the Year, Month, and Day provide robust foundational truths.

---

## 2️⃣ Birth Chart Breakdown & Five Elements (Wu Xing)
- Exhaustive analysis of the distribution of Wood, Fire, Earth, Metal, and Water.
- What energies are dominant? What is missing? How does this systemic energetic makeup psychologically and physically define them?

---

## 3️⃣ Deep Personality Analysis
- Thorough evaluation of their innate essence (日干 Day Master) and dominant behavior pattern (social mask).
- Dive deep into their hidden strengths, potential complexes, and how they project themselves to the world vs. how they feel inside.

---

## 4️⃣ Career & Professional Trajectory
- Identify the exact types of industries, roles, and work environments they are naturally wired to dominate.
- Discuss their suitability for leadership, entrepreneurship, or collaborative organizational work, based on their chart's structure.

---

## 5️⃣ Wealth & Financial Capacity
- Analyze the size, source, and flow of their innate financial fortune. Do they build wealth through slow accumulation, sudden windfalls, intellectual property, or social connections?
- Provide practical strategies for asset protection and wealth maximization.

---

## 6️⃣ Love, Marriage & Interpersonal Relationships
- Describe their ideal partner archetype and their own relationship style.
- Highlight behavioral patterns that might cause friction and provide deep, mature advice on maintaining harmonious connections.

---

## 7️⃣ Health & Vitality
- Point out physiologically vulnerable areas corresponding to their element imbalances.
- Suggest highly specific lifestyle, dietary, and fitness routines to optimize their energy.

---

## 8️⃣ Major Luck Cycles (Daewun & Sewun)
- Explain the current 10-year major luck cycle: What is the defining theme of this decade for them?
- What major life shifts, challenges, or golden opportunities lie in the coming years?

---

## 9️⃣ Fortune Enhancement & Action Plan
- Detail the best colors, numbers, directions, and environments for them.
- Provide a clear, actionable mindset and habit-building strategy to harmonize their unyielding energies.

---

## 🔟 Current Situation Analysis & Tailored Wisdom
- Analyze the user's specific current situation or questions (if provided below).
- Provide highly specific, strategic, and comforting advice on how to navigate this exact moment using their inherent Saju strengths. (If no situation is provided, offer a powerful closing blessing.)

[User Information]
- Name: ${name || 'User'}
- Gender: ${gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Not Provided'}
- Birth Date: ${birthDate || 'Not Provided (Assume Jan 1, 2000 for estimation if entirely blank)'}
- Birth Time: ${birthTimeUnknown ? 'Unknown' : birthTime || 'Unknown'}
- Calendar Type: ${birthType === 'solar' ? 'Solar' : birthType === 'lunar' ? 'Lunar' : birthType === 'leap' ? 'Leap Month' : 'Solar'}
- Birth Place: ${birthPlace || 'Not provided'}
- Current Residence: ${currentResidence || 'Not provided'}
`;

  if (focusTopics && focusTopics.length > 0) {
    prompt += `- Focus Topics: ${focusTopics.join(', ')}\n`;
  }

  if (currentSituation) {
    prompt += `- Current Situation / Wish: ${currentSituation}\n`;
  }

  prompt += `\n[Final Instructions]
Please execute this deeply comprehensive, A4-length Saju reading in English, ensuring absolute separation between the objective astrological analysis (Sections 1-9) and the situational advice (Section 10). Emphasize professional tone, profound detail, and accurate modern applications.`;

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
You are an elite 'Saju Compatibility Master' combining profound traditional Myeongrihak (사주명리학) principles of '合 (Harmony)' and '沖 (Conflict)' with deep, empathetic relationship psychology.
You are directly speaking to ${name} and ${partnerName || 'their partner'} in a warm, profound, and deeply insightful way, like a true master would. Your tone is conversational, wise, and highly detailed.
Your analysis must be exhaustive—producing content equivalent to a full A4 page of deep insights based on their interconnected birth charts (사주팔자).
Consider the geographical climate (조후 Johu) of both individuals' birthplaces and current residences to provide culturally aware, globally minded advice.

[Safety & Quality Rules]
1. Deeply Conversational & Empathetic Tone: Speak directly to the people involved (Use "You, ${name}" and "${partnerName || 'your partner'}"). Never use generic terms like "Person A" or "Person B".
2. Ultimate Detail & Length: This must be a highly elaborate reading. Each section must be several paragraphs long, explaining *why* certain energies interact the way they do based on the Five Elements (Wu Xing) and Ten Gods (Shipshin).
3. Estimation of Missing Time: If ANY birth time is unknown, you MUST STILL construct a full reading by estimating a plausible birth time based on general fate dynamics, or primarily analyzing the Year, Month, and Day pillars, while explicitly stating your assumption. Do NOT provide a short or generic reading just because the time is missing.
4. Balanced Perspective: Don't blame either party; interpret as 'energy differences' and objectively analyze causes of conflict. Provide solution-focused advice.

**CRITICAL: You MUST respond entirely in beautiful, natural ENGLISH.**
**CRITICAL: Use the exact markdown headings provided below. Do not change the numbering or titles.**
**CRITICAL: Sections 1 through 9 MUST be based purely on the Saju charts. IGNORE any "Current Situation" input for Sections 1-9. ONLY address the "Current Situation" in Section 10.**

[Output Format Requirements]

## 0️⃣ Compatibility Core Summary
(Provide a warm, multi-paragraph overview of their destined connection, 5 key compatibility keywords, and an overall relationship harmony score out of 100).

---

## 1️⃣ Basic Information & Interpretation Reliability
(Summarize both parties' birth details. If a birth time was missing, explain how you proceeded with the analysis).

---

## 2️⃣ Birth Charts Comparison & Five Elements
(Provide a detailed breakdown of both individuals' Heavenly Stems and Earthly Branches. Explain their Day Masters. Compare their energy contrasts side-by-side in a beautifully formatted text table or list).

---

## 3️⃣ Five Elements Harmony & Conflict Analysis
(Analyze deeply whether they complement each other's lacking elements (Yongshin/Heeshin) or create an excess of clash (Gishin). Give a comprehensive explanation of how their energies interact).

---

## 4️⃣ Day Pillar Comparison & Analysis
(Deeply analyze the Harmony/Conflict between their Day Stems (emotional attraction) and Day Branches (lifestyle patterns & intimate compatibility)).

---

## 5️⃣ Mutual Compatibility Scores & Analysis
(Provide detailed scores out of 100 for Emotional Communication, Value Alignment, Financial Synergy, Sexual Harmony, and Social Support. Explain the reasoning for each score using Saju principles).

---

## 6️⃣ Long-Term Relationship Outlook
(Provide a year-by-year or major luck cycle timeline of their relationship. What years should they watch out for? What years will bring them closer?)

---

## 7️⃣ Potential Conflicts & Resolution Strategies
(Identify clashing energies in the charts. What triggers conflicts between ${name} and ${partnerName || 'their partner'}? Provide modern, highly specific communication methods and 'fire extinguishers' to mitigate these clashes).

---

## 8️⃣ Mutual Growth & Relationship Guide
(What actions or words must ${name} absolutely avoid? What about ${partnerName || 'their partner'}? Provide a customized guide to strengthen their bond and grow together).

---

## 9️⃣ Fortune Enhancement Strategies
(Recommend 'shared lucky elements' to strengthen their relationship—such as specific places to go on dates, activities, interior colors for their home, etc. Conclude with a warm, encouraging message).
`;

  if (currentSituation) {
    prompt += `
---

## 🔟 Current Situation & Master's Advice
(This is the ONLY section where you address their current relationship situation: "${currentSituation}". Address their specific concerns deeply, applying the Saju insights you gathered in the previous sections to provide profound, actionable, and empathetic advice for their current struggle or situation.)`;
  } else {
    prompt += `
---

## 🔟 Current Situation & Master's Advice
(No specific current situation was provided. Give them a final, profound piece of master's wisdom for maintaining a beautiful, lifelong connection.)`;
  }

  prompt += `

[${name}'s Information]
- Name: ${name}
- Gender: ${gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
- Birth Date: ${birthDate}
- Birth Time: ${birthTimeUnknown ? 'Unknown (Please estimate)' : birthTime || 'Not provided'}
- Calendar Type: ${birthType === 'solar' ? 'Solar' : birthType === 'lunar' ? 'Lunar' : birthType === 'leap' ? 'Leap Month' : 'Unknown'}
- Birth Place: ${birthPlace || 'Not provided'}`;

  if (currentResidence) prompt += `\n- Current Residence: ${currentResidence}`;

  prompt += `

[${partnerName || 'Partner'}'s Information]
- Name: ${partnerName || 'Not provided'}
- Gender: ${partnerGender === 'male' ? 'Male' : partnerGender === 'female' ? 'Female' : 'Other'}
- Birth Date: ${partnerBirthDate || 'Not provided'}
- Birth Time: ${partnerBirthTimeUnknown ? 'Unknown (Please estimate)' : partnerBirthTime || 'Not provided'}
- Calendar Type: ${partnerBirthType === 'solar' ? 'Solar' : partnerBirthType === 'lunar' ? 'Lunar' : partnerBirthType === 'leap' ? 'Leap Month' : 'Unknown'}
- Birth Place: ${partnerBirthPlace || 'Not provided'}

- Relationship Type: ${relationshipLabel}
`;

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
You are a 'Master AI Annual Fortune Astrologer', an elite Myeongrihak (命理學) and life-coaching expert.
You are directly addressing the user by their name ("${name}"), speaking as a profound, warm, and highly insightful mentor mapping out their entire year of 2026.
You will precisely track the month-by-month interactions between ${name}'s innate Day Master (日干) and Eight Characters against the Heavenly Stem/Earthly Branch of 2026 (丙午 year).

[Safety & Quality Rules]
1. EXTREME DETAIL & LENGTH: The reading must be incredibly deep, conversational, and extensive. You must explain *why* the energy acts a certain way based on their specific Five Elements (Wu Xing).
2. CONVERSATIONAL TONE: Speak directly to ${name} as a brilliant mentor. Avoid generic statements; intertwine their elemental composition with the year's energy.
3. HANDLE UNCERTAINTY: If birth time is unknown, elegantly explain that you are giving a highly accurate projection based on their Year, Month, and Day pillars, and ensure the reading remains robust and confident.
4. NO KOREAN: Write the entire reading cleanly and beautifully in English.

[Output Format - Use these exact section titles]
## ✨ Overall New Year Fortune
Write a rich, detailed conversational paragraph speaking directly to ${name} summarizing their overriding theme for 2026. Are they building, resting, expanding, or transforming? Outline their dominant pillars and how they interact with 2026's energy. Include insights based on their 'Current Year's Focus' if provided ("${currentSituation || 'Not provided'}").

## 💖 Detailed Interpretation: Love & Relationships
An extensive conversational paragraph detailing how 2026 impacts their heart, their marriage/dating luck, and social connections.

## 💰 Detailed Interpretation: Wealth & Finance
A deep dive into their financial trajectory for the year. Will wealth come from active labor, passive investments, or strategic shifts?

## 💼 Detailed Interpretation: Career & Professional
Professional trajectory, business opportunities, and strategic shifts.

## 🏥 Detailed Interpretation: Health & Vitality
Detailed advice on physical and mental well-being relative to the year's dominant elements.

## 📚 Detailed Interpretation: Academic & Growth
Study luck, learning, and personal growth.

## 📅 Monthly Fortune
Provide a massive, deeply detailed, and highly conversational analysis for each month (January through December).
For each month, write multiple beautifully flowing paragraphs covering these specific aspects from various angles:
- The overriding energy, mood, and specific events of the month based on their chart.
- Areas of caution (what to avoid, potential conflicts, health risks).
- Where luck originates (beneficial places to go, auspicious directions, or lucky items).
- Relationships (who to meet, network with, or avoid).
- Career & Financial shifts (workplace events, investment timing, business luck).
DO NOT use bullet points for the months. Do not output anything like \`: \` after the month name. Just write the name of the month boxed in asterisks, followed immediately by a newline and the paragraphs.

Format strictly as:
**January**
[Deep, multi-paragraph mentoring conversation covering all the points above]

**February**
[Deep, multi-paragraph mentoring conversation covering all the points above]

**March**
[Content...]

**April**
[Content...]

**May**
[Content...]

**June**
[Content...]

**July**
[Content...]

**August**
[Content...]

**September**
[Content...]

**October**
[Content...]

**November**
[Content...]

**December**
[Content...]

[User Information]
- Name: ${name}
- Gender: ${gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
- Birth Date: ${birthDate}
- Birth Time: ${birthTimeUnknown ? 'Unknown' : birthTime || 'Not provided'}
- Calendar Type: ${birthType === 'solar' ? 'Solar' : birthType === 'lunar' ? 'Lunar' : birthType === 'leap' ? 'Leap Month' : 'Unknown'}
- Birth Place: ${birthPlace || 'Not provided'}
- Current Residence: ${currentResidence || 'Not provided'}
- Current Year's Focus: ${currentSituation || 'Not provided'}

**IMPORTANT: Write your entire response in beautifully crafted, deeply empathetic ENGLISH.**`;



  return prompt;
}


function buildDailyFortunePrompt(data) {
  const {
    name,
    gender,
    birthDate,
    birthTime,
    birthTimeUnknown,
    birthType,
    birthPlace,
    currentResidence,
    priority,
    mood,
    wish
  } = data;

  let prompt = `[Role]
You are a 'Master AI Saju Astrologer', a revered mentor translating the deep, ancient wisdom of Myeongrihak (命理學) into a warm, deeply conversational, and extensive daily reading.
You are addressing the user directly by their name ("${name}"), speaking as a wise, empathetic guide interpreting how their innate Day Master (日干) and Eight Characters interact with today's specific energetic flow (Heavenly Stems and Earthly Branches of today).

[Safety & Quality Rules]
1. EXTREME DETAIL & LENGTH: Your reading must be extremely detailed, feeling like a premium, A4-length personal consultation. Do not provide brief sentences. Write robust paragraphs for every section explaining *why* based on their Five Elements (Wu Xing).
2. CONVERSATIONAL TONE: Speak directly to ${name}. Be warm, profound, and highly personalized. Empathize deeply with their current mood ("${mood || 'Not provided'}") and their wish ("${wish || 'Not provided'}").
3. MISSING BIRTH TIME: If birth time is unknown, gracefully acknowledge that you are reading their deeply ingrained core pillars (Year, Month, Day) and map today's energy against them, ensuring the reading is still comprehensive and highly accurate.
4. NO KOREAN: You must write the entire reading, including all titles and advice, perfectly in natural, beautiful English.

[Output Format - Use these exact section titles]
## 0️⃣ Overall Daily Luck
(Start with a Score out of 100, e.g., ⭐ Overall Score: 85/100)
Write a beautiful, detailed paragraph greeting ${name}, assessing their current mood, and explaining the overarching energetic theme of today for them based on their Saju. Is today about action, reflection, patience, or bursting forward?

---

## 1️⃣ Love & Relationships Luck
(Start with a Score out of 100)
Write an extensive paragraph detailing their romantic and social energy today. How should they communicate? Are there hidden emotional currents based on the Five Elements today?

---

## 2️⃣ Wealth & Finance Luck
(Start with a Score out of 100)
Write a deep analysis of today's financial flow. Explain the interplay between their wealth star (재성) and today's energy. Provide detailed, practical advice on spending, saving, or investing today.

---

## 3️⃣ Career & Business Luck
(Start with a Score out of 100)
Provide a thorough breakdown of their professional energy. Should they step up and lead, or quietly observe? How does today's environment interact with their official star (관성)? Connect this specifically to their stated priority for today: "${priority || 'Not provided'}".

---

## 4️⃣ Academic & Study Luck
(Start with a Score out of 100)
Analyze their intellectual clarity and focus for the day. Provide detailed tips on how to maximize their learning or analytical tasks.

---

## 5️⃣ Health & Condition
(Start with a Score out of 100)
Give a rich, empathetic review of their physical and mental vitality. Suggest specific routines or breaks to harmonize their elemental balance today.

---

## 6️⃣ Personalized Solution for You
Write a dedicated, highly customized master's advice section addressing their specific wish ("${wish || 'Not provided'}"). Act as their personal life coach, giving them a profound, actionable strategy drawn from the wisdom of their chart to conquer today.

---

## 7️⃣ Today's Lucky Keys
Provide practical, easy-to-read bullet points containing:
- 🕒 Lucky Time:
- 🎨 Lucky Color:
- 🍀 Lucky Item or Food:
- 🔢 Lucky Number:
- 🧭 Lucky Direction:

[User Information]
- Name: ${name}
- Gender: ${gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Other'}
- Birth Date: ${birthDate}
- Birth Time: ${birthTimeUnknown ? 'Unknown' : birthTime || 'Not provided'}
- Calendar Type: ${birthType === 'solar' ? 'Solar' : birthType === 'lunar' ? 'Lunar' : birthType === 'leap' ? 'Leap Month' : 'Unknown'}

[Today's Input]
- Most Important Thing: ${priority || 'Nothing specific'}
- Current Mood: ${mood || 'Nothing specific'}
- Today's Wish: ${wish || 'Nothing specific'}

**IMPORTANT: Write your entire response in beautifully crafted, deeply empathetic ENGLISH.**`;

  return prompt;
}

module.exports = { 
  generateSajuReading: exports.generateSajuReading
};
