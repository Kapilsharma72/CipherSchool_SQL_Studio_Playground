const OpenAI = require('openai');
const AppError = require('../utils/appError');
const logger = require('../utils/logger');

let openai;

try {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  
  logger.info('OpenAI client initialized successfully');
} catch (error) {
  logger.error('Failed to initialize OpenAI:', error);
  process.exit(1); }

const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; 
const getSystemPrompt = (context) => {
    if (!context || typeof context !== 'object') {
    throw new Error('Invalid context provided');
  }

  const { 
    assignment = {}, 
    currentQuery = '', 
    conversation = [] 
  } = context;

  const { 
    title = 'SQL Practice', 
    description = 'Practice writing SQL queries', 
    requirements = [], 
    schema = {} 
  } = assignment;

    const formatColumn = (col) => {
    if (!col || typeof col !== 'object') return '';
    const name = col.name || 'unknown';
    const type = col.type || 'unknown';
    const desc = col.description || 'No description';
    return `- ${name} (${type}): ${desc}`;
  };

  const schemaInfo = Object.entries(schema)
    .filter(([table]) => typeof table === 'string' && table.trim() !== '')
    .map(([table, columns]) => {
      if (!Array.isArray(columns)) return `Table: ${table}\n  - No columns defined`;
      
      const columnList = columns
        .filter(col => col && typeof col === 'object')
        .map(formatColumn)
        .join('\n');
        
      return `Table: ${table}\n${columnList || '  - No valid columns defined'}`;
    })
    .filter(Boolean)     .join('\n\n') || 'No schema information available';

  return `You are a SQL Learning Assistant, an AI designed to help students learn SQL through guided problem-solving. Your goal is to foster learning by providing hints and guidance without giving away complete solutions.

ASSIGNMENT CONTEXT:
Title: ${title || 'Not specified'}
Description: ${description || 'No description provided'}
Requirements:\n${requirements.map((r, i) => `${i+1}. ${r}`).join('\n')}

DATABASE SCHEMA:
${schemaInfo || 'No schema information available'}

CURRENT QUERY:
${currentQuery || 'No query written yet'}

RULES:
1. NEVER write complete SQL queries
2. NEVER combine correct table/column names into a valid solution
3. Focus on explaining concepts and suggesting approaches
4. Break down problems into smaller, manageable parts
5. Use analogies and examples to explain concepts
6. When stuck, ask guiding questions to help the student reason through the problem
7. Consider the assignment requirements when providing hints
8. Reference the database schema when relevant

RESPONSE FORMAT:
- Start with the difficulty level (Beginner/Intermediate/Advanced)
- Provide conceptual guidance first
- Suggest relevant SQL concepts to use
- Give partial examples with placeholders (e.g., SELECT [columns] FROM [table])
- Ask questions to guide the student's thinking
- Never reveal the complete solution

Remember: The goal is learning, not just getting the right answer.`;
};

exports.getHint = async (req, res, next) => {
  try {
    const { userQuestion, context = {} } = req.body;

    if (!userQuestion) {
      return next(new AppError('Please provide a question', 400));
    }

        const { 
      assignment = {}, 
      currentQuery = '', 
      conversation = [] 
    } = context;

        const systemPrompt = getSystemPrompt({
      assignment,
      currentQuery,
      conversation
    });

        const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation
        .filter(msg => 
          msg.role === 'user' || 
          msg.role === 'assistant'
        )
        .map(msg => ({
          role: msg.role,
          content: msg.content
        })),
      { 
        role: 'user', 
        content: userQuestion,
        timestamp: new Date().toISOString()
      },
    ];

        const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); 
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages,
        temperature: 0.7,
        max_tokens: 500,
      }, { signal: controller.signal });

      clearTimeout(timeout);

      const hint = completion.choices[0]?.message?.content || 
        'I\'m not sure how to help with that. Could you rephrase your question?';

      res.status(200).json({
        status: 'success',
        hint,
        usage: completion.usage
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again.');
      }
      
            if (error.status === 429) {
        if (error.code === 'insufficient_quota') {
          throw new Error('OpenAI API quota exceeded. Please check your API plan and billing details. The hint feature is temporarily unavailable.');
        } else {
          throw new Error('Too many requests to the AI assistant. Please wait a moment and try again.');
        }
      }
      
      if (error.status === 401) {
        throw new Error('OpenAI API key is invalid. Please check your API configuration.');
      }
      
      throw error;
    }
  } catch (error) {
    logger.error('Error getting SQL learning hint:', error);
    
        let errorMessage = 'Error getting learning assistance. Please try again later.';
    let statusCode = 500;
    
    if (error.message.includes('quota')) {
      errorMessage = 'The AI assistant is currently unavailable due to API quota limits. You can still practice SQL queries without hints.';
      statusCode = 503;     } else if (error.message.includes('timeout')) {
      errorMessage = 'The request timed out. Please try again with a shorter question.';
      statusCode = 504;     } else if (error.message.includes('API key')) {
      errorMessage = 'AI assistant configuration error. Please contact support.';
      statusCode = 503;
    }
    
    return next(
      new AppError(errorMessage, statusCode)
    );
  }
};

exports.validateConfig = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('WARNING: OPENAI_API_KEY is not set. The SQL Learning Assistant will not work without it.');
    return false;
  }
  return true;
};
