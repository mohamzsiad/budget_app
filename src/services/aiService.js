/**
 * AI Service — handles calls to OpenAI or Google Gemini.
 * The user provides their own API key stored in SecureStore.
 */

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const SYSTEM_PROMPT = (context) => `
You are a personal finance assistant inside an expense tracker app called SpendSmart.

The user's financial data for this month (${context.month}) is:
- Total Income: ${context.currency || 'USD'} ${context.totalIncome?.toFixed(2) || '0.00'}
- Total Expenses: ${context.currency || 'USD'} ${context.totalExpenses?.toFixed(2) || '0.00'}
- Net Balance: ${context.currency || 'USD'} ${context.netBalance?.toFixed(2) || '0.00'}
- Number of transactions: ${context.transactionCount || 0}

Spending by category:
${Object.entries(context.byCategory || {})
  .sort((a, b) => b[1] - a[1])
  .map(([cat, amt]) => `  • ${cat}: ${context.currency || '$'}${amt.toFixed(2)}`)
  .join('\n') || '  (no expenses recorded yet)'}

Active budgets:
${(context.budgets || [])
  .map((b) => `  • ${b.category}: ${b.spent?.toFixed(2) || '0.00'} / ${b.monthlyLimit?.toFixed(2)} (${b.monthlyLimit > 0 ? ((b.spent / b.monthlyLimit) * 100).toFixed(0) : 0}% used)`)
  .join('\n') || '  (no budgets set)'}

Be concise, friendly, and practical. Give specific numbers based on the user's actual data.
Do not give generic advice — tailor everything to their spending patterns.
If their data is insufficient, ask clarifying questions.
Always end budget plans with a clear monthly breakdown table.
Use plain text — no markdown formatting (no *, **, #, etc.) since this is a mobile chat interface.
`.trim();

/**
 * Call AI with a user message and conversation history.
 *
 * @param {string} userMessage - The user's message
 * @param {object} context - Monthly financial context (totals, categories, budgets)
 * @param {Array} history - Previous messages [{role, content}]
 * @param {object} config - { apiKey, provider: 'openai' | 'gemini' }
 * @returns {Promise<string>} AI reply text
 */
export async function callAI(userMessage, context, history = [], config = {}) {
  const { apiKey, provider = 'openai' } = config;

  if (!apiKey) {
    throw new Error('No API key provided. Please add your API key in Settings.');
  }

  if (provider === 'gemini') {
    return callGemini(userMessage, context, history, apiKey);
  }
  return callOpenAI(userMessage, context, history, apiKey);
}

async function callOpenAI(userMessage, context, history, apiKey) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT(context) },
    // Include last 10 messages for context
    ...history.slice(-10).map((m) => ({ role: m.role, content: m.content })),
    { role: 'user', content: userMessage },
  ];

  const response = await fetch(OPENAI_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 600,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `OpenAI error: ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || 'No response received.';
}

async function callGemini(userMessage, context, history, apiKey) {
  const systemText = SYSTEM_PROMPT(context);

  // Build conversation for Gemini format
  const contents = [
    {
      role: 'user',
      parts: [{ text: systemText + '\n\nUser: ' + userMessage }],
    },
  ];

  // Add history (Gemini uses user/model alternating)
  if (history.length > 1) {
    const recentHistory = history.slice(-8);
    const geminiHistory = [];
    for (const msg of recentHistory) {
      if (msg.role === 'user') {
        geminiHistory.push({ role: 'user', parts: [{ text: msg.content }] });
      } else {
        geminiHistory.push({ role: 'model', parts: [{ text: msg.content }] });
      }
    }
    contents.splice(0, 0, ...geminiHistory);
  }

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Gemini error: ${response.status}`);
  }

  const data = await response.json();
  return (
    data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.'
  );
}
