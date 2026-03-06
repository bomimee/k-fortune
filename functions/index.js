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
      { key: 'summary', pattern: /## 1️⃣ Compatibility Core Summary([\s\S]*?)(?=\n## |$)/ },
      { key: 'foundation', pattern: /## 2️⃣ Basic Information & Reliability([\s\S]*?)(?=\n## |$)/ },
      { key: 'pillars', pattern: /## 3️⃣ Birth Charts & Five Elements Score([\s\S]*?)(?=\n## |$)/ },
      { key: 'personality', pattern: /## 4️⃣ Harmony & Conflict Analysis([\s\S]*?)(?=\n## |$)/ },
      { key: 'career', pattern: /## 5️⃣ Day Pillar Comparison & Analysis([\s\S]*?)(?=\n## |$)/ },
      { key: 'wealth', pattern: /## 6️⃣ Mutual Compatibility Scores & Analysis([\s\S]*?)(?=\n## |$)/ },
      { key: 'relationships', pattern: /## 7️⃣ Long-Term Relationship Outlook([\s\S]*?)(?=\n## |$)/ },
      { key: 'health', pattern: /## 8️⃣ Potential Conflicts & Resolution Strategies([\s\S]*?)(?=\n## |$)/ },
      { key: 'timing', pattern: /## 9️⃣ Mutual Growth & Relationship Guide([\s\S]*?)(?=\n## |$)/ },
      { key: 'actionPlan', pattern: /## 🔟 Fortune Enhancement Strategies([\s\S]*?)(?=\n## |$)/ },
      { key: 'customAdvice', pattern: /## 1️⃣1️⃣ Current Situation & Master's Advice([\s\S]*?)(?=\n## |$)/ },
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
  generateSajuReading: exports.generateSajuReading,
  createPolarCheckout: exports.createPolarCheckout
};
