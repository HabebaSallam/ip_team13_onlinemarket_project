const https = require('https');

const GROQ_API_HOST = 'api.groq.com';
const GROQ_API_PATH = '/openai/v1/chat/completions';
const GROQ_MODEL = process.env.GROQ_MODEL || 'mixtral-8x7b-32768';

const postJson = (path, payload, apiKey) => {
  const body = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
          hostname: GROQ_API_HOST,
        path,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let buf = '';
        res.on('data', (c) => (buf += c));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`Groq API request failed with status ${res.statusCode}: ${buf}`));
          }
          try {
            resolve(JSON.parse(buf));
          } catch (err) {
            reject(new Error('Unable to parse Groq response'));
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    req.write(body);
    req.end();
  });
};

async function generateCommentSummary({ productName, comments }) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

  const visibleComments = (comments || [])
    .slice(0, 20)
    .map((c, i) => `${i + 1}. ${c.text}`)
    .join('\n');

  const messages = [
    {
      role: 'system',
      content:
        'You write short, neutral summaries of product comments for marketplace shoppers. Focus on repeated themes, sentiment, delivery issues, quality, and recurring complaints or praise. Do not invent facts. Keep the response to 2-3 sentences.',
    },
    {
      role: 'user',
      content: `Summarize the following comments for the product "${productName || 'Unknown product'}".\n\nComments:\n${visibleComments}`,
    },
  ];

  const payload = {
    model: GROQ_MODEL,
    temperature: 0.3,
    max_tokens: 200,
    messages,
  };

  const resp = await postJson(GROQ_API_PATH, payload, apiKey);

  const summary = resp?.choices?.[0]?.message?.content;
  if (!summary) throw new Error('Groq returned empty response');

  return summary.trim();
}

module.exports = { generateCommentSummary };
