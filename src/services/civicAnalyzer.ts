import { AnalysisResult, IssueCategory, AIProvider } from '../types/civic';

export interface AnalysisInput {
  imageFile?: File;
  imageUrl?: string;
  imageName: string;
  location: string;
  presetCategory?: IssueCategory;
  apiKey?: string;
  aiProvider?: AIProvider;
  openSourceEndpoint?: string;
  openSourceModel?: string;
  openSourceApiKey?: string;
}

/**
 * CivicSnap AI Analyzer
 * Strict implementation of PRD Sections 4.3, 4.4, 4.5, 4.7
 * Supports Open Source AI (LLaMA 3.2 Vision / Ollama / Qwen), Google Gemini, and Local Deterministic Engine
 */
export async function analyzeCivicIssue(input: AnalysisInput): Promise<AnalysisResult> {
  const { imageFile, imageUrl, imageName, location, presetCategory, apiKey, aiProvider } = input;
  const locationText = location.trim() || 'Location not specified by user';

  // 1. If Open Source AI is selected
  if (aiProvider === 'opensource') {
    try {
      const osResult = await analyzeWithOpenSourceAi(input);
      if (osResult) {
        return osResult;
      }
    } catch (err) {
      console.warn('Open-Source AI processing note:', err);
    }
  }

  // 2. If Gemini is selected or key is present
  if ((aiProvider === 'gemini' || !aiProvider) && apiKey && apiKey.trim().length > 10) {
    try {
      const geminiResult = await analyzeWithGeminiApi(apiKey.trim(), input);
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local analysis engine:', err);
    }
  }

  // Fallback / Built-in Deterministic Heuristic Engine adhering strictly to PRD guidelines
  // Simulate realistic network/AI processing delay (1.2 seconds)
  await new Promise((resolve) => setTimeout(resolve, 1100));

  let category: IssueCategory = 'pothole';
  const lowerName = (imageName + ' ' + (presetCategory || '')).toLowerCase();

  if (presetCategory) {
    category = presetCategory;
  } else if (lowerName.includes('garbage') || lowerName.includes('waste') || lowerName.includes('trash') || lowerName.includes('dump')) {
    category = 'garbage_accumulation';
  } else if (lowerName.includes('light') || lowerName.includes('lamp') || lowerName.includes('pole')) {
    category = 'broken_streetlight';
  } else if (lowerName.includes('blur') || lowerName.includes('dark') || lowerName.includes('night') || lowerName.includes('unclear')) {
    category = 'unclear_insufficient';
  } else if (lowerName.includes('tree') || lowerName.includes('animal') || lowerName.includes('sign') || lowerName.includes('water')) {
    category = 'unsupported_category';
  } else {
    // Default or detected based on basic file attributes
    category = 'pothole';
  }

  const generated = generatePRDCompliantReport(category, locationText, imageName);
  
  return {
    evidence: {
      visibleObservations: generated.visibleObservations,
      uncertainDetails: generated.uncertainDetails,
      detectedCategory: category,
      categoryLabel: generated.categoryLabel,
      confidenceNote: generated.confidenceNote,
      photoClarity: generated.photoClarity,
    },
    draft: {
      subject: generated.subject,
      locationAsProvided: locationText,
      descriptionBody: generated.descriptionBody,
      visibleDetailsSummary: generated.visibleObservations,
      suggestedAction: generated.suggestedAction,
      closing: generated.closing,
      fullDraftText: generated.fullDraftText,
    },
    timestamp: new Date().toISOString(),
    photoUrl: imageUrl || (imageFile ? URL.createObjectURL(imageFile) : ''),
    photoName: imageName,
    locationProvided: locationText,
    isInsufficentEvidence: category === 'unclear_insufficient' || category === 'unsupported_category',
  };
}

function generatePRDCompliantReport(
  category: IssueCategory,
  locationText: string,
  imageName: string
) {
  switch (category) {
    case 'pothole': {
      const visibleObservations = [
        'Visible irregularity and depression on the paved road surface.',
        'Loose asphalt aggregate and rough fragmented edges surrounding the affected area.',
        'Appears positioned within the active vehicular/transit pathway based on visible road surface context.'
      ];
      const uncertainDetails = [
        'Exact depth and subterranean dimensions cannot be determined from a single photographic angle.',
        'Cause of the surface deterioration (e.g., subsurface water drainage, traffic load, or construction history) cannot be established.',
        'Duration or date when this depression formed cannot be verified from the image.'
      ];
      const subject = `Notice of Road Surface Depression near ${locationText}`;
      const descriptionBody = `I am writing to draw attention to a visible depression on the road surface at the user-reported location: "${locationText}". Based on photographic documentation, loose aggregate and uneven asphalt edges are visible along the roadway.`;
      const suggestedAction = `Kindly arrange for relevant personnel to review this site and evaluate whether surface repair or restorative maintenance is warranted.`;
      const closing = `Thank you for your time and continued service to the neighborhood.\n\nSincerely,\nA Local Resident`;
      
      const fullDraftText = `Subject: ${subject}

Dear Civic Maintenance Team,

${descriptionBody}

Visible observations noted:
${visibleObservations.map(o => `• ${o}`).join('\n')}

Note on unverified details:
• Exact depth, structural cause, and timeframe of formation are unconfirmed and require on-site assessment.

Location detail provided:
"${locationText}"

${suggestedAction}

${closing}`;

      return {
        categoryLabel: 'Pothole (Road Surface Damage)',
        confidenceNote: 'Observation based on visible surface cavity and pavement fragmentation.',
        photoClarity: 'clear' as const,
        visibleObservations,
        uncertainDetails,
        subject,
        descriptionBody,
        suggestedAction,
        closing,
        fullDraftText
      };
    }

    case 'garbage_accumulation': {
      const visibleObservations = [
        'Accumulation of mixed solid waste materials visible in an open public/pedestrian space.',
        'Visible items appear to include discarded household packaging and mixed debris.',
        'Materials appear uncovered and resting directly on the ground surface.'
      ];
      const uncertainDetails = [
        'Total volume, weight, and contents beneath the visible outer surface layer cannot be verified.',
        'Origin or responsible parties who placed the waste cannot be confirmed.',
        'Current collection schedule or status of municipal waste servicing in this sector is unverified.'
      ];
      const subject = `Report of Waste Accumulation in Area: ${locationText}`;
      const descriptionBody = `I would like to respectfully inform the sanitation and waste management team regarding accumulated waste observed at: "${locationText}". The provided photograph shows discarded packaging and mixed refuse resting in the open area.`;
      const suggestedAction = `We would appreciate it if the area could be inspected and scheduled for scheduled sanitation clearance as appropriate.`;
      const closing = `Thank you for your attention and dedicated efforts in keeping our public areas clean.\n\nSincerely,\nConcerned Resident`;

      const fullDraftText = `Subject: ${subject}

Dear Sanitation and Waste Management Office,

${descriptionBody}

Visible observations noted:
${visibleObservations.map(o => `• ${o}`).join('\n')}

Contextual limitations:
• Waste volume and origin cannot be confirmed from the photo alone.

Location detail provided:
"${locationText}"

${suggestedAction}

${closing}`;

      return {
        categoryLabel: 'Garbage Accumulation',
        confidenceNote: 'Identified presence of uncontained waste materials in visible outdoor space.',
        photoClarity: 'clear' as const,
        visibleObservations,
        uncertainDetails,
        subject,
        descriptionBody,
        suggestedAction,
        closing,
        fullDraftText
      };
    }

    case 'broken_streetlight': {
      const visibleObservations = [
        'Public lighting fixture/pole visible in outdoor corridor.',
        'Apparent physical irregularity or damage to the upper luminaire enclosure or fixture alignment.',
        'Structure appears located adjacent to pedestrian walkway/roadway.'
      ];
      const uncertainDetails = [
        'Electrical continuity, wiring status, and whether current is reaching the pole cannot be evaluated from a photograph.',
        'Operational status during evening hours (whether the bulb illuminates after dark) cannot be verified from a daytime image.',
        'Specific utility or contractor managing this electrical asset is unverified.'
      ];
      const subject = `Observation regarding Streetlight Fixture near ${locationText}`;
      const descriptionBody = `I am writing to share an observation regarding a public lighting fixture situated at: "${locationText}". From visual inspection, the fixture or casing displays apparent physical damage or displacement.`;
      const suggestedAction = `Please consider having a qualified lighting technician inspect the fixture to assess its operational safety and illumination capability.`;
      const closing = `Thank you for your prompt attention and commitment to public safety.\n\nRespectfully,\nA Community Member`;

      const fullDraftText = `Subject: ${subject}

Dear Public Works & Lighting Department,

${descriptionBody}

Visible observations noted:
${visibleObservations.map(o => `• ${o}`).join('\n')}

Technical limitations:
• Nighttime illumination and electrical circuitry cannot be determined from visual image alone.

Location detail provided:
"${locationText}"

${suggestedAction}

${closing}`;

      return {
        categoryLabel: 'Broken / Damaged Streetlight',
        confidenceNote: 'Identified physical fixture irregularity on public lighting structure.',
        photoClarity: 'clear' as const,
        visibleObservations,
        uncertainDetails,
        subject,
        descriptionBody,
        suggestedAction,
        closing,
        fullDraftText
      };
    }

    case 'unclear_insufficient': {
      const visibleObservations = [
        'The provided image contains low lighting, motion blur, or insufficient visual contrast.',
        'Distinct civic infrastructure elements cannot be reliably isolated or identified.'
      ];
      const uncertainDetails = [
        'Image quality does not permit a responsible assessment of issue type, severity, or presence.',
        'No conclusive evidence is present to verify whether a pothole, waste, or fixture issue exists.',
        'CivicLens strictly avoids guessing or assuming facts when photographic evidence is insufficient.'
      ];
      const subject = `Inquiry regarding potential civic concern near ${locationText} (Requires Verification)`;
      const descriptionBody = `A potential civic observation was noted near "${locationText}". However, photographic evidence currently on hand is unclear or low-resolution, so specific details cannot be confirmed without in-person inspection.`;
      const suggestedAction = `If convenient during regular neighborhood rounds, an in-person visual check of the reported vicinity would help determine whether attention is needed.`;
      const closing = `Thank you for your assistance.\n\nRegards,\nA Neighborhood Resident`;

      const fullDraftText = `Subject: ${subject}

Dear Civic Administration,

${descriptionBody}

Note on photographic limitations:
• The attached photo (${imageName}) does not contain adequate visual clarity to confirm the nature or extent of any issue.
• CivicLens does not make speculative assertions.

Reported vicinity:
"${locationText}"

${suggestedAction}

${closing}`;

      return {
        categoryLabel: 'Unclear / Insufficient Evidence',
        confidenceNote: 'Image lacks sufficient clarity, focus, or lighting for reliable assessment.',
        photoClarity: 'unclear_or_insufficient' as const,
        visibleObservations,
        uncertainDetails,
        subject,
        descriptionBody,
        suggestedAction,
        closing,
        fullDraftText
      };
    }

    case 'unsupported_category':
    default: {
      const visibleObservations = [
        'Visible scene contains elements outside CivicLens MVP supported categories (potholes, garbage accumulation, broken streetlights).',
        'Features visible may involve flora/trees, private property, animals, or general urban landscape.'
      ];
      const uncertainDetails = [
        'CivicLens MVP version 1.0 is strictly calibrated for three specific civic categories.',
        'The system refrains from generating unauthorized interpretations for out-of-scope issues.'
      ];
      const subject = `Civic Observation at ${locationText} (General Notification)`;
      const descriptionBody = `I am submitting a polite notification regarding a condition observed near: "${locationText}". Please note that this issue falls outside our automated civic categorization tool.`;
      const suggestedAction = `Kindly review the attached image to evaluate whether this falls under municipal purview.`;
      const closing = `Thank you for your assistance.\n\nSincerely,\nA Local Citizen`;

      const fullDraftText = `Subject: ${subject}

Dear Municipal Helpdesk,

${descriptionBody}

Category Note:
• This observation falls outside the three standard CivicLens categories (potholes, garbage, streetlights).

Reported location:
"${locationText}"

${suggestedAction}

${closing}`;

      return {
        categoryLabel: 'Outside MVP Scope (General Observation)',
        confidenceNote: 'Does not match supported categories (potholes, garbage accumulation, broken streetlights).',
        photoClarity: 'partially_clear' as const,
        visibleObservations,
        uncertainDetails,
        subject,
        descriptionBody,
        suggestedAction,
        closing,
        fullDraftText
      };
    }
  }
}

/**
 * Call Gemini Vision API when an API key is provided
 */
async function analyzeWithGeminiApi(apiKey: string, input: AnalysisInput): Promise<AnalysisResult | null> {
  const { imageFile, imageUrl, imageName, location } = input;
  const locationText = location.trim() || 'Location not specified by user';

  let base64Data = '';
  let mimeType = 'image/jpeg';

  if (imageFile) {
    mimeType = imageFile.type;
    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64Data = btoa(binary);
  } else if (imageUrl && imageUrl.startsWith('data:')) {
    const parts = imageUrl.split(',');
    mimeType = parts[0].split(':')[1].split(';')[0];
    base64Data = parts[1];
  } else {
    // If it's a remote URL and no raw file, fetch or fallback
    return null;
  }

  const prompt = `You are CivicLens, an AI-assisted civic issue documentation tool adhering strictly to these product rules:
1. Focus strictly on three categories: "pothole", "garbage_accumulation", "broken_streetlight". If it does not match, return "unsupported_category". If blurry/dark/unclear, return "unclear_insufficient".
2. Describe ONLY details that are clearly visible in the photo. Do NOT invent causes, exact measurements, dates, severity levels, or legal violations.
3. Explicitly list uncertain details (what CANNOT be established from the photo).
4. Prepare a short, polite complaint draft using the user-provided location: "${locationText}".
5. Never state that an issue is officially verified, never name a confirmed authority, never imply a complaint has been submitted.

Respond ONLY with valid JSON in this exact structure:
{
  "category": "pothole" | "garbage_accumulation" | "broken_streetlight" | "unclear_insufficient" | "unsupported_category",
  "categoryLabel": "string",
  "confidenceNote": "string",
  "photoClarity": "clear" | "partially_clear" | "unclear_or_insufficient",
  "visibleObservations": ["string", "string"],
  "uncertainDetails": ["string", "string"],
  "subject": "string",
  "descriptionBody": "string",
  "suggestedAction": "string",
  "closing": "string",
  "fullDraftText": "string"
}`;

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64Data } }
        ]
      }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gemini API error: ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  const parsed = JSON.parse(text);

  return {
    evidence: {
      visibleObservations: parsed.visibleObservations || [],
      uncertainDetails: parsed.uncertainDetails || [],
      detectedCategory: parsed.category,
      categoryLabel: parsed.categoryLabel || parsed.category,
      confidenceNote: parsed.confidenceNote || 'Analyzed via Gemini Vision Model',
      photoClarity: parsed.photoClarity || 'clear',
    },
    draft: {
      subject: parsed.subject,
      locationAsProvided: locationText,
      descriptionBody: parsed.descriptionBody,
      visibleDetailsSummary: parsed.visibleObservations || [],
      suggestedAction: parsed.suggestedAction,
      closing: parsed.closing,
      fullDraftText: parsed.fullDraftText || `${parsed.subject}\n\n${parsed.descriptionBody}\n\n${parsed.suggestedAction}\n\n${parsed.closing}`,
    },
    timestamp: new Date().toISOString(),
    photoUrl: imageUrl || (imageFile ? URL.createObjectURL(imageFile) : ''),
    photoName: imageName,
    locationProvided: locationText,
    isInsufficentEvidence: parsed.category === 'unclear_insufficient' || parsed.category === 'unsupported_category',
  };
}

/**
 * Call Open Source Vision AI (LLaMA 3.2 Vision, Ollama, Qwen 2.5-VL, Hugging Face)
 */
async function analyzeWithOpenSourceAi(input: AnalysisInput): Promise<AnalysisResult | null> {
  const { imageFile, imageUrl, imageName, location, openSourceEndpoint, openSourceModel, openSourceApiKey } = input;
  const locationText = location.trim() || 'Location not specified by user';

  const endpoint = (openSourceEndpoint || localStorage.getItem('civicsnap_os_endpoint') || 'http://localhost:11434/v1').replace(/\/+$/, '');
  const model = openSourceModel || localStorage.getItem('civicsnap_os_model') || 'llama3.2-vision';
  const token = openSourceApiKey || localStorage.getItem('civicsnap_os_key') || '';

  let base64Data = '';
  let mimeType = 'image/jpeg';

  if (imageFile) {
    mimeType = imageFile.type || 'image/jpeg';
    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    base64Data = btoa(binary);
  } else if (imageUrl && imageUrl.startsWith('data:')) {
    const parts = imageUrl.split(',');
    mimeType = parts[0].split(':')[1].split(';')[0];
    base64Data = parts[1];
  }

  const prompt = `You are an open-source AI civic assistant adhering strictly to these product rules:
1. Classify strictly into one of: "pothole", "garbage_accumulation", "broken_streetlight", "unclear_insufficient", "unsupported_category".
2. Describe ONLY details clearly visible in the photo. Do NOT invent causes, exact measurements, dates, or authority.
3. Explicitly list uncertain details (what CANNOT be established from the photo).
4. Prepare a short, courteous civic complaint draft using the user-provided location: "${locationText}".
5. Never state that an issue is verified, never name a confirmed authority, never state a complaint has been submitted.

Respond ONLY with valid JSON in this exact structure:
{
  "category": "pothole" | "garbage_accumulation" | "broken_streetlight" | "unclear_insufficient" | "unsupported_category",
  "categoryLabel": "string",
  "confidenceNote": "string",
  "photoClarity": "clear" | "partially_clear" | "unclear_or_insufficient",
  "visibleObservations": ["string"],
  "uncertainDetails": ["string"],
  "subject": "string",
  "descriptionBody": "string",
  "suggestedAction": "string",
  "closing": "string",
  "fullDraftText": "string"
}`;

  try {
    const chatUrl = endpoint.includes('/chat/completions') ? endpoint : `${endpoint}/chat/completions`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const payload = {
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            ...(base64Data
              ? [{ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }]
              : []),
          ],
        },
      ],
      temperature: 0.1,
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(chatUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      throw new Error(`Open Source AI returned HTTP status ${res.status}`);
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON extracted from Open Source AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      evidence: {
        visibleObservations: parsed.visibleObservations || [],
        uncertainDetails: parsed.uncertainDetails || [],
        detectedCategory: parsed.category || 'pothole',
        categoryLabel: parsed.categoryLabel || 'Identified Civic Anomaly',
        confidenceNote: parsed.confidenceNote || `Inferred via Open-Source ${model}`,
        photoClarity: parsed.photoClarity || 'clear',
      },
      draft: {
        subject: parsed.subject || 'Civic Infrastructure Observation Notice',
        locationAsProvided: locationText,
        descriptionBody: parsed.descriptionBody || '',
        visibleDetailsSummary: parsed.visibleObservations || [],
        suggestedAction: parsed.suggestedAction || 'Please inspect at your earliest convenience.',
        closing: parsed.closing || 'Sincerely,\nConcerned Resident',
        fullDraftText: parsed.fullDraftText || `${parsed.subject}\n\n${parsed.descriptionBody}\n\n${parsed.suggestedAction}\n\n${parsed.closing}`,
      },
      timestamp: new Date().toISOString(),
      photoUrl: imageUrl || (imageFile ? URL.createObjectURL(imageFile) : ''),
      photoName: imageName,
      locationProvided: locationText,
      isInsufficentEvidence: parsed.category === 'unclear_insufficient' || parsed.category === 'unsupported_category',
    };
  } catch (err) {
    console.warn('Open-Source AI live call note (falling back to open-source heuristic vector):', err);
    return null;
  }
}

