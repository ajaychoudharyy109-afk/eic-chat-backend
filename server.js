const express = require('express');
const cors = require('cors');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow requests from your website
app.use(cors({
  origin: [
    'https://easyimmigrationconsultant.online',
    'https://www.easyimmigrationconsultant.online',
    'https://easyimmigration.netlify.app',
    'http://localhost:3000'
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Initialize Anthropic client with server-side API key
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const SYSTEM_PROMPT = `You are a friendly, professional Canadian immigration assistant for Easy Immigration Consultant, based in Canmore, Alberta. Your consultant is Ajay Choudhary.

Services you help with:
- TRV (Temporary Resident Visa): Required for visitors from visa-required countries. Processing time 2-8 weeks. Requirements: valid passport, financial proof, ties to home country.
- Visitor Visa: For tourism, family visits, business. Up to 6 months stay. Multiple-entry visas available.
- Study Permit: For international students accepted at Canadian institutions. Processing 4-12 weeks.
- Work Permit: Open or employer-specific. LMIA-based or LMIA-exempt categories available.
- LMIA (Labour Market Impact Assessment): Required for most employer-specific work permits.
- Express Entry / Permanent Residence: Federal Skilled Worker, Canadian Experience Class, Federal Skilled Trades. Points-based Comprehensive Ranking System (CRS).
- Permit Renewals: Extend visitor, study, or work permits from inside Canada.

Contact information:
- Phone/WhatsApp: +1 (403) 707-4075
- Consultant: Ajay Choudhary
- Location: Canmore, Alberta

Guidelines:
- Be warm, helpful, and professional
- Give accurate Canadian immigration information
- Always recommend a free consultation for complex cases
- Keep responses concise (2-4 sentences max per point)
- End responses by offering to book a free consultation
- Never guarantee visa approvals (no one can)`;

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'EIC Chat Backend is running!',
    version: '1.0.0'
  });
});

// Chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: messages
    });

    res.json({
      reply: response.content[0].text,
      usage: response.usage
    });

  } catch (error) {
    console.error('Chat error:', error.message);

    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid API key' });
    }
    if (error.status === 429) {
      return res.status(429).json({ error: 'Rate limit reached. Please try again in a moment.' });
    }

    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.listen(PORT, () => {
  console.log(`EIC Chat Backend running on port ${PORT}`);
});
