/**
 * Mock Service Worker Handlers
 * For use with MSW (Mock Service Worker) during testing
 */

import { rest } from 'msw'

const OPENAI_BASE = 'https://api.openai.com/v1'
const ANTHROPIC_BASE = 'https://api.anthropic.com'
const GOOGLE_BASE = 'https://generativelanguage.googleapis.com'

export const handlers = [
  // OpenAI Chat Completions
  rest.post(`${OPENAI_BASE}/chat/completions`, async (req, res, ctx) => {
    const body = await req.json()

    // Simulate delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return res(
      ctx.status(200),
      ctx.json({
        id: 'chatcmpl-mock-123',
        object: 'chat.completion',
        created: Date.now(),
        model: body.model || 'gpt-3.5-turbo',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'This is a mock response from OpenAI API.',
            },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 15,
          total_tokens: 25,
        },
      })
    )
  }),

  // Anthropic Messages
  rest.post(`${ANTHROPIC_BASE}/v1/messages`, async (req, res, ctx) => {
    const body = await req.json()

    await new Promise((resolve) => setTimeout(resolve, 1000))

    return res(
      ctx.status(200),
      ctx.json({
        id: 'msg_mock_123',
        type: 'message',
        role: 'assistant',
        content: [
          {
            type: 'text',
            text: 'This is a mock response from Anthropic API.',
          },
        ],
        model: body.model || 'claude-3-opus-20240229',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 10,
          output_tokens: 15,
        },
      })
    )
  }),

  // Google Generative Language
  rest.post(
    `${GOOGLE_BASE}/v1beta/models/:model:generateContent`,
    async (req, res, ctx) => {
      await new Promise((resolve) => setTimeout(resolve, 1000))

      return res(
        ctx.status(200),
        ctx.json({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'This is a mock response from Google Generative AI API.',
                  },
                ],
                role: 'model',
              },
              finishReason: 'STOP',
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 15,
            totalTokenCount: 25,
          },
        })
      )
    }
  ),

  // OpenAI Models List
  rest.get(`${OPENAI_BASE}/models`, (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: [
          { id: 'gpt-4', object: 'model', created: 1687882410 },
          { id: 'gpt-3.5-turbo', object: 'model', created: 1677610602 },
        ],
      })
    )
  }),

  // Error scenarios for testing
  rest.post(`${OPENAI_BASE}/chat/completions/error/rate_limit`, (req, res, ctx) => {
    return res(
      ctx.status(429),
      ctx.json({
        error: {
          message: 'Rate limit exceeded',
          type: 'rate_limit_error',
          code: 'rate_limit_exceeded',
        },
      })
    )
  }),

  rest.post(`${OPENAI_BASE}/chat/completions/error/auth`, (req, res, ctx) => {
    return res(
      ctx.status(401),
      ctx.json({
        error: {
          message: 'Invalid API key',
          type: 'invalid_request_error',
          code: 'invalid_api_key',
        },
      })
    )
  }),

  rest.post(`${OPENAI_BASE}/chat/completions/error/server`, (req, res, ctx) => {
    return res(
      ctx.status(500),
      ctx.json({
        error: {
          message: 'Internal server error',
          type: 'server_error',
        },
      })
    )
  }),
]

export default handlers
