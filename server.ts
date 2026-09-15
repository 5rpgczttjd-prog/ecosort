import 'dotenv/config';
import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser with 35MB limit for high-resolution mobile camera snaps
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // Lazy / Safe Gemini AI client
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not configured.');
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!process.env.GEMINI_API_KEY,
      timestamp: new Date().toISOString(),
    });
  });

  // Analyze Recyclable Item Endpoint
  app.post('/api/analyze-recyclable', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', municipality, userNotes } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: 'Image data is required.' });
      }

      // Clean base64 string if client sent data URI prefix
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');

      const ai = getGeminiClient();

      const municipalityInfo = municipality
        ? `
Municipality Name: ${municipality.name} (${municipality.region}, ${municipality.country})
Collection Stream: ${municipality.streamType || 'single-stream'}
Curbside Organics/Compost Available: ${municipality.curbsideOrganics ? 'YES' : 'NO'}
Curbside Glass Recycling: ${municipality.curbsideGlass ? 'YES' : 'NO'}
Accepts Plastic Film/Bags Curbside: ${municipality.acceptsPlasticBagsCurbside ? 'YES' : 'NO'}
Bin Color Scheme: Recycle = ${municipality.binColors?.recycle || 'Blue'}, Compost = ${municipality.binColors?.compost || 'Green'}, Trash = ${municipality.binColors?.trash || 'Black/Grey'}
Local Municipal Rules & Notes: ${municipality.specialNotes || 'Standard single-stream municipal guidelines apply.'}
Key Rules: ${(municipality.keyRulesSummary || []).join('; ')}
`
        : 'Municipality: Standard US / International Single-Stream Municipal Guidelines.';

      const prompt = `You are an expert waste-management engineer and circular economy recycling specialist.
Examine this photo taken by the user's camera.
Identify the primary object and any distinct sub-components (for instance: a yogurt container has a plastic cup body, an aluminum foil lid, and sometimes a paper outer label; a coffee cup has a cup body, plastic lid, and cardboard sleeve; a pizza box has clean cardboard top vs greasy bottom).

Carefully evaluate whether this item and each component can be recycled, composted, or trashed under these SPECIFIC local municipal guidelines:
${municipalityInfo}

${userNotes ? `User note about the item condition: "${userNotes}"` : ''}

CRITICAL RULES TO APPLY:
1. Contamination: If paper/cardboard is heavily soaked with food grease (e.g. greasy pizza box, oily takeout carton), it CANNOT be recycled curbside. If organics/compost is available in this municipality, it belongs in Organics/Compost; otherwise, in Trash.
2. Plastic film & shopping bags: Tanglers (film, wraps, grocery bags) jam optical sorters and conveyors in single-stream sorting facilities unless specifically accepted. Most require separate supermarket drop-offs.
3. Multi-material packaging: If components can easily be separated (e.g. cardboard sleeve on coffee cup, metal lid on glass jar, plastic cap on bottle), provide specific separated instructions for each component.
4. Batteries & Hazardous: Lithium, NiCad, alkaline, electronics, and pressurized cans MUST NEVER be placed in curbside bins (fire hazard in collection trucks) and require e-waste/hazardous drop-off.
5. Deposit / Return schemes: If the municipality has bottle bills or Pfand (e.g. Germany Pfand 0.25€, California CRV, Oregon bottle drop), note that return to store earns a deposit refund.

Respond ONLY with a valid JSON object matching the requested schema.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || 'image/jpeg',
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemName: {
                type: Type.STRING,
                description: 'Clear, concise name of the identified object (e.g., Takeout Coffee Cup with Lid)',
              },
              confidence: {
                type: Type.STRING,
                description: 'Confidence in identification: high, medium, or low',
              },
              verdict: {
                type: Type.STRING,
                description: 'Overall verdict: yes (fully recyclable), no (landfill/trash/hazardous), or conditional (requires separation/rinsing/dropoff)',
              },
              headline: {
                type: Type.STRING,
                description: 'Short punchy verdict headline (e.g. "Recyclable (Rinse First)", "Trash Only — Not Recyclable", "Separate Components")',
              },
              primaryBin: {
                type: Type.STRING,
                description: 'Main bin type: recycle, compost, trash, special_dropoff, or deposit_return',
              },
              binLabel: {
                type: Type.STRING,
                description: 'Human-friendly bin name according to the municipality (e.g., "Blue Bin (Recycling)", "Green Cart (Compost)", "Black Bin (Trash)")',
              },
              localRulesContext: {
                type: Type.STRING,
                description: 'Explicit explanation of how the local municipal guidelines dictate this verdict',
              },
              materials: {
                type: Type.ARRAY,
                description: 'Detailed breakdown of each component part of the item',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: {
                      type: Type.STRING,
                      description: 'Component name (e.g., Cardboard Sleeve, Plastic Lid #6, Paper Cup Body)',
                    },
                    material: {
                      type: Type.STRING,
                      description: 'Material type (e.g., Corrugated Cardboard, Polystyrene #6, Polyethylene-coated paper)',
                    },
                    recyclable: {
                      type: Type.BOOLEAN,
                      description: 'Whether this specific component can be recycled',
                    },
                    bin: {
                      type: Type.STRING,
                      description: 'Bin type for this component: recycle, compost, trash, special_dropoff, or deposit_return',
                    },
                    binName: {
                      type: Type.STRING,
                      description: 'Display name for the target bin (e.g. Blue Cart, Green Compost, Black Trash)',
                    },
                    instruction: {
                      type: Type.STRING,
                      description: 'Specific action for this part (e.g. "Rinse and toss in Blue Bin", "Peel off and put in trash")',
                    },
                  },
                  required: ['name', 'material', 'recyclable', 'bin', 'instruction'],
                },
              },
              prepSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Numbered, actionable preparation steps before discarding (e.g., 1. Empty liquids, 2. Detach plastic film, 3. Do not flatten cans)',
              },
              contaminationWarning: {
                type: Type.STRING,
                description: 'Any contamination risk (e.g. grease, liquid residue, tangler hazard), or empty string if none',
              },
              ecoTip: {
                type: Type.STRING,
                description: 'Eco-friendly alternative, reuse tip, or circular economy suggestion',
              },
              carbonOrWasteInsight: {
                type: Type.STRING,
                description: 'Fascinating environmental fact or energy savings metric related to this material',
              },
              resinCode: {
                type: Type.STRING,
                description: 'Plastic resin identification code if applicable (e.g., "#1 PET", "#5 PP", "#6 PS", or "N/A")',
              },
              alternativeDisposal: {
                type: Type.STRING,
                description: 'Alternative disposal method if not curbside (e.g., grocery store take-back, Terracycle, e-waste event)',
              },
            },
            required: [
              'itemName',
              'confidence',
              'verdict',
              'headline',
              'primaryBin',
              'binLabel',
              'localRulesContext',
              'materials',
              'prepSteps',
              'ecoTip',
            ],
          },
        },
      });

      const responseText = response.text?.trim() || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        console.error('Failed to parse Gemini JSON output:', responseText);
        return res.status(500).json({ error: 'Failed to parse AI response.', raw: responseText });
      }

      // Add server-side metadata
      const result = {
        id: `scan_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: Date.now(),
        ...parsedData,
        municipalityApplied: {
          name: municipality?.name || 'Standard Municipal',
          region: municipality?.region || 'US / International',
        },
      };

      res.json({ success: true, data: result });
    } catch (err: any) {
      console.error('Error analyzing image with Gemini:', err);
      res.status(500).json({
        error: err?.message || 'An unexpected error occurred while analyzing the item.',
      });
    }
  });

  // Follow-up Question Endpoint
  app.post('/api/ask-question', async (req, res) => {
    try {
      const { question, currentAnalysis, municipality, chatHistory = [] } = req.body;

      if (!question) {
        return res.status(400).json({ error: 'Question is required.' });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are EcoSort AI, a knowledgeable, friendly municipal recycling and waste sorting guide.
The user is asking a follow-up question regarding an item they just scanned.
Context:
- Item Identified: ${currentAnalysis?.itemName || 'Scanned item'}
- Verdict: ${currentAnalysis?.verdict || 'Unknown'} (${currentAnalysis?.headline || ''})
- Target Municipality: ${municipality?.name || 'General Guidelines'} (${municipality?.region || ''})
- Special Municipal Rules: ${municipality?.specialNotes || 'Standard single-stream guidelines'}
- Identified Materials: ${JSON.stringify(currentAnalysis?.materials || [])}

Provide an accurate, concise, helpful response (2 to 4 paragraphs max) directly addressing their question based on municipal waste management best practices. Avoid generic advice; refer directly to the user's item and municipality rules.`;

      const prompt = `Question from user: "${question}"

Provide specific guidance tailored to ${municipality?.name || 'their local area'}.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      res.json({
        success: true,
        answer: response.text?.trim() || "I couldn't generate an answer at this moment. Please try again.",
      });
    } catch (err: any) {
      console.error('Error answering question with Gemini:', err);
      res.status(500).json({
        error: err?.message || 'Error communicating with AI assistant.',
      });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EcoSort AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
