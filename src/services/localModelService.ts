/**
 * Local Model Service
 *
 * Supports running AI models locally:
 * - Ollama integration
 * - WebLLM (in-browser models)
 * - LM Studio integration
 * - Model management and switching
 */

import { v4 as uuidv4 } from 'uuid';

// ========================
// Type Definitions
// ========================

export type ModelProvider = 'ollama' | 'webllm' | 'lmstudio' | 'transformers';

export type ModelSize = 'tiny' | 'small' | 'medium' | 'large' | 'xlarge';

export interface LocalModel {
  id: string;
  name: string;
  displayName: string;
  provider: ModelProvider;
  size: ModelSize;
  sizeInGB: number;
  quantization?: '4bit' | '8bit' | '16bit' | 'fp32';
  parameters: string; // e.g., "7B", "13B", "70B"
  context_length: number;
  isDownloaded: boolean;
  downloadProgress?: number;
  isRunning: boolean;
  capabilities: {
    chat: boolean;
    completion: boolean;
    embedding: boolean;
    vision: boolean;
  };
  metadata: {
    family: string; // e.g., "llama", "mistral", "qwen"
    version: string;
    license: string;
    url?: string;
  };
}

export interface OllamaConfig {
  endpoint: string; // default: http://localhost:11434
  timeout?: number;
  maxRetries?: number;
}

export interface WebLLMConfig {
  modelLibURL?: string;
  cachePrefix?: string;
}

export interface LMStudioConfig {
  endpoint: string; // default: http://localhost:1234
  timeout?: number;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  stream?: boolean;
  stop?: string[];
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  created: number;
  choices: Array<{
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface ModelDownloadProgress {
  modelId: string;
  progress: number; // 0-100
  status: 'downloading' | 'extracting' | 'completed' | 'error';
  error?: string;
  bytesDownloaded?: number;
  totalBytes?: number;
}

// ========================
// Service Implementation
// ========================

class LocalModelService {
  private ollamaConfig: OllamaConfig = {
    endpoint: 'http://localhost:11434',
    timeout: 60000,
    maxRetries: 3,
  };

  private lmStudioConfig: LMStudioConfig = {
    endpoint: 'http://localhost:1234',
    timeout: 60000,
  };

  private webLLMConfig: WebLLMConfig = {
    cachePrefix: 'webllm',
  };

  private availableModels: Map<string, LocalModel> = new Map();
  private downloadCallbacks: Map<string, (progress: ModelDownloadProgress) => void> = new Map();

  constructor() {
    this.initializeModels();
  }

  // ========================
  // Model Discovery
  // ========================

  private initializeModels() {
    // Predefined model catalog
    const models: LocalModel[] = [
      // Ollama models
      {
        id: 'ollama-llama3.2-1b',
        name: 'llama3.2:1b',
        displayName: 'Llama 3.2 1B',
        provider: 'ollama',
        size: 'tiny',
        sizeInGB: 1.3,
        quantization: '4bit',
        parameters: '1B',
        context_length: 8192,
        isDownloaded: false,
        isRunning: false,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'llama',
          version: '3.2',
          license: 'Llama 3 Community License',
          url: 'https://ollama.com/library/llama3.2',
        },
      },
      {
        id: 'ollama-llama3.2-3b',
        name: 'llama3.2:3b',
        displayName: 'Llama 3.2 3B',
        provider: 'ollama',
        size: 'small',
        sizeInGB: 2.0,
        quantization: '4bit',
        parameters: '3B',
        context_length: 8192,
        isDownloaded: false,
        isRunning: false,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'llama',
          version: '3.2',
          license: 'Llama 3 Community License',
          url: 'https://ollama.com/library/llama3.2',
        },
      },
      {
        id: 'ollama-llama3.1-8b',
        name: 'llama3.1:8b',
        displayName: 'Llama 3.1 8B',
        provider: 'ollama',
        size: 'medium',
        sizeInGB: 4.7,
        quantization: '4bit',
        parameters: '8B',
        context_length: 128000,
        isDownloaded: false,
        isRunning: false,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'llama',
          version: '3.1',
          license: 'Llama 3 Community License',
          url: 'https://ollama.com/library/llama3.1',
        },
      },
      {
        id: 'ollama-mistral-7b',
        name: 'mistral:7b',
        displayName: 'Mistral 7B',
        provider: 'ollama',
        size: 'medium',
        sizeInGB: 4.1,
        quantization: '4bit',
        parameters: '7B',
        context_length: 32768,
        isDownloaded: false,
        isRunning: false,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'mistral',
          version: '0.3',
          license: 'Apache 2.0',
          url: 'https://ollama.com/library/mistral',
        },
      },
      {
        id: 'ollama-qwen2.5-7b',
        name: 'qwen2.5:7b',
        displayName: 'Qwen 2.5 7B',
        provider: 'ollama',
        size: 'medium',
        sizeInGB: 4.7,
        quantization: '4bit',
        parameters: '7B',
        context_length: 32768,
        isDownloaded: false,
        isRunning: false,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'qwen',
          version: '2.5',
          license: 'Apache 2.0',
          url: 'https://ollama.com/library/qwen2.5',
        },
      },
      {
        id: 'ollama-phi3-mini',
        name: 'phi3:mini',
        displayName: 'Phi-3 Mini (3.8B)',
        provider: 'ollama',
        size: 'small',
        sizeInGB: 2.3,
        quantization: '4bit',
        parameters: '3.8B',
        context_length: 4096,
        isDownloaded: false,
        isRunning: false,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'phi',
          version: '3',
          license: 'MIT',
          url: 'https://ollama.com/library/phi3',
        },
      },
      {
        id: 'ollama-gemma2-2b',
        name: 'gemma2:2b',
        displayName: 'Gemma 2 2B',
        provider: 'ollama',
        size: 'small',
        sizeInGB: 1.6,
        quantization: '4bit',
        parameters: '2B',
        context_length: 8192,
        isDownloaded: false,
        isRunning: false,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'gemma',
          version: '2',
          license: 'Gemma Terms of Use',
          url: 'https://ollama.com/library/gemma2',
        },
      },
      // WebLLM models (run in browser)
      {
        id: 'webllm-llama3.1-8b',
        name: 'Llama-3.1-8B-Instruct-q4f16_1-MLC',
        displayName: 'Llama 3.1 8B (WebGPU)',
        provider: 'webllm',
        size: 'medium',
        sizeInGB: 4.5,
        quantization: '4bit',
        parameters: '8B',
        context_length: 8192,
        isDownloaded: false,
        isRunning: false,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'llama',
          version: '3.1',
          license: 'Llama 3 Community License',
          url: 'https://github.com/mlc-ai/web-llm',
        },
      },
      {
        id: 'webllm-phi3-mini',
        name: 'Phi-3-mini-4k-instruct-q4f16_1-MLC',
        displayName: 'Phi-3 Mini (WebGPU)',
        provider: 'webllm',
        size: 'small',
        sizeInGB: 2.2,
        quantization: '4bit',
        parameters: '3.8B',
        context_length: 4096,
        isDownloaded: false,
        isRunning: false,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'phi',
          version: '3',
          license: 'MIT',
          url: 'https://github.com/mlc-ai/web-llm',
        },
      },
    ];

    models.forEach(model => this.availableModels.set(model.id, model));
  }

  // ========================
  // Provider Detection
  // ========================

  async detectAvailableProviders(): Promise<{
    ollama: boolean;
    webllm: boolean;
    lmstudio: boolean;
  }> {
    const providers = {
      ollama: await this.checkOllamaAvailability(),
      webllm: await this.checkWebLLMSupport(),
      lmstudio: await this.checkLMStudioAvailability(),
    };

    return providers;
  }

  private async checkOllamaAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaConfig.endpoint}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.warn('Ollama not available:', error);
      return false;
    }
  }

  private async checkWebLLMSupport(): Promise<boolean> {
    // Check if WebGPU is supported
    if (!navigator.gpu) {
      return false;
    }

    try {
      const adapter = await navigator.gpu.requestAdapter();
      return adapter !== null;
    } catch (error) {
      console.warn('WebGPU not supported:', error);
      return false;
    }
  }

  private async checkLMStudioAvailability(): Promise<boolean> {
    try {
      const response = await fetch(`${this.lmStudioConfig.endpoint}/v1/models`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      console.warn('LM Studio not available:', error);
      return false;
    }
  }

  // ========================
  // Model Management
  // ========================

  async listModels(provider?: ModelProvider): Promise<LocalModel[]> {
    const models = Array.from(this.availableModels.values());

    if (provider) {
      return models.filter(m => m.provider === provider);
    }

    return models;
  }

  async getInstalledModels(provider: ModelProvider): Promise<LocalModel[]> {
    if (provider === 'ollama') {
      return this.getOllamaInstalledModels();
    } else if (provider === 'lmstudio') {
      return this.getLMStudioInstalledModels();
    } else if (provider === 'webllm') {
      // WebLLM models are downloaded to IndexedDB/Cache
      return this.getWebLLMDownloadedModels();
    }

    return [];
  }

  private async getOllamaInstalledModels(): Promise<LocalModel[]> {
    try {
      const response = await fetch(`${this.ollamaConfig.endpoint}/api/tags`);
      const data = await response.json();

      const installedNames = new Set(data.models?.map((m: any) => m.name) || []);

      // Update our model list
      this.availableModels.forEach(model => {
        if (model.provider === 'ollama' && installedNames.has(model.name)) {
          model.isDownloaded = true;
        }
      });

      return Array.from(this.availableModels.values())
        .filter(m => m.provider === 'ollama' && m.isDownloaded);
    } catch (error) {
      console.error('Failed to get Ollama models:', error);
      return [];
    }
  }

  private async getLMStudioInstalledModels(): Promise<LocalModel[]> {
    try {
      const response = await fetch(`${this.lmStudioConfig.endpoint}/v1/models`);
      const data = await response.json();

      // LM Studio returns OpenAI-compatible format
      return data.data?.map((model: any) => ({
        id: `lmstudio-${model.id}`,
        name: model.id,
        displayName: model.id,
        provider: 'lmstudio' as ModelProvider,
        size: 'medium' as ModelSize,
        sizeInGB: 0,
        parameters: 'Unknown',
        context_length: 4096,
        isDownloaded: true,
        isRunning: true,
        capabilities: {
          chat: true,
          completion: true,
          embedding: false,
          vision: false,
        },
        metadata: {
          family: 'unknown',
          version: '1.0',
          license: 'Unknown',
        },
      })) || [];
    } catch (error) {
      console.error('Failed to get LM Studio models:', error);
      return [];
    }
  }

  private async getWebLLMDownloadedModels(): Promise<LocalModel[]> {
    // Check which WebLLM models have been downloaded to cache
    // This would require checking cache storage
    return Array.from(this.availableModels.values())
      .filter(m => m.provider === 'webllm' && m.isDownloaded);
  }

  // ========================
  // Model Download
  // ========================

  async downloadModel(
    modelId: string,
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    const model = this.availableModels.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    if (onProgress) {
      this.downloadCallbacks.set(modelId, onProgress);
    }

    try {
      if (model.provider === 'ollama') {
        await this.downloadOllamaModel(model, onProgress);
      } else if (model.provider === 'webllm') {
        await this.downloadWebLLMModel(model, onProgress);
      } else {
        throw new Error(`Download not supported for provider: ${model.provider}`);
      }

      model.isDownloaded = true;
      model.downloadProgress = 100;
    } catch (error) {
      if (onProgress) {
        onProgress({
          modelId,
          progress: 0,
          status: 'error',
          error: error instanceof Error ? error.message : 'Download failed',
        });
      }
      throw error;
    } finally {
      this.downloadCallbacks.delete(modelId);
    }
  }

  private async downloadOllamaModel(
    model: LocalModel,
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    const response = await fetch(`${this.ollamaConfig.endpoint}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: model.name, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`Failed to pull model: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);

          if (data.status && onProgress) {
            const progress = data.completed && data.total
              ? (data.completed / data.total) * 100
              : 0;

            onProgress({
              modelId: model.id,
              progress,
              status: data.status === 'success' ? 'completed' : 'downloading',
              bytesDownloaded: data.completed,
              totalBytes: data.total,
            });
          }
        } catch (e) {
          console.warn('Failed to parse progress:', e);
        }
      }
    }
  }

  private async downloadWebLLMModel(
    model: LocalModel,
    onProgress?: (progress: ModelDownloadProgress) => void
  ): Promise<void> {
    // WebLLM downloads models automatically when initialized
    // This is a placeholder for the actual implementation
    if (onProgress) {
      onProgress({
        modelId: model.id,
        progress: 0,
        status: 'downloading',
      });
    }

    // Simulate download progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (onProgress) {
        onProgress({
          modelId: model.id,
          progress: i,
          status: i === 100 ? 'completed' : 'downloading',
        });
      }
    }
  }

  async deleteModel(modelId: string): Promise<void> {
    const model = this.availableModels.get(modelId);
    if (!model) {
      throw new Error(`Model not found: ${modelId}`);
    }

    if (model.provider === 'ollama') {
      await fetch(`${this.ollamaConfig.endpoint}/api/delete`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model.name }),
      });
    }

    model.isDownloaded = false;
    model.downloadProgress = 0;
  }

  // ========================
  // Chat Completion
  // ========================

  async chatCompletion(
    request: ChatCompletionRequest,
    provider: ModelProvider
  ): Promise<ChatCompletionResponse> {
    if (provider === 'ollama') {
      return this.ollamaChatCompletion(request);
    } else if (provider === 'lmstudio') {
      return this.lmStudioChatCompletion(request);
    } else if (provider === 'webllm') {
      return this.webLLMChatCompletion(request);
    }

    throw new Error(`Unsupported provider: ${provider}`);
  }

  private async ollamaChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.ollamaConfig.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        options: {
          temperature: request.temperature,
          top_p: request.top_p,
          num_predict: request.max_tokens,
          stop: request.stop,
        },
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      id: uuidv4(),
      model: request.model,
      created: Date.now(),
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: data.message.content,
          },
          finish_reason: 'stop',
        },
      ],
      usage: {
        prompt_tokens: data.prompt_eval_count || 0,
        completion_tokens: data.eval_count || 0,
        total_tokens: (data.prompt_eval_count || 0) + (data.eval_count || 0),
      },
    };
  }

  private async lmStudioChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const response = await fetch(`${this.lmStudioConfig.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`LM Studio request failed: ${response.statusText}`);
    }

    return response.json();
  }

  private async webLLMChatCompletion(
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    // This would use the @mlc-ai/web-llm package
    // Placeholder implementation
    throw new Error('WebLLM not yet implemented - requires @mlc-ai/web-llm package');
  }

  // ========================
  // Streaming Support
  // ========================

  async *chatCompletionStream(
    request: ChatCompletionRequest,
    provider: ModelProvider
  ): AsyncGenerator<string, void, unknown> {
    if (provider === 'ollama') {
      yield* this.ollamaChatCompletionStream(request);
    } else if (provider === 'lmstudio') {
      yield* this.lmStudioChatCompletionStream(request);
    } else {
      throw new Error(`Streaming not supported for provider: ${provider}`);
    }
  }

  private async *ollamaChatCompletionStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.ollamaConfig.endpoint}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        options: {
          temperature: request.temperature,
          top_p: request.top_p,
          num_predict: request.max_tokens,
        },
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama stream failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;

        try {
          const data = JSON.parse(line);
          if (data.message?.content) {
            yield data.message.content;
          }
        } catch (e) {
          console.warn('Failed to parse stream chunk:', e);
        }
      }
    }
  }

  private async *lmStudioChatCompletionStream(
    request: ChatCompletionRequest
  ): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.lmStudioConfig.endpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...request, stream: true }),
    });

    if (!response.ok) {
      throw new Error(`LM Studio stream failed: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim() || !line.startsWith('data: ')) continue;

        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch (e) {
          console.warn('Failed to parse stream chunk:', e);
        }
      }
    }
  }

  // ========================
  // Configuration
  // ========================

  setOllamaConfig(config: Partial<OllamaConfig>) {
    this.ollamaConfig = { ...this.ollamaConfig, ...config };
  }

  setLMStudioConfig(config: Partial<LMStudioConfig>) {
    this.lmStudioConfig = { ...this.lmStudioConfig, ...config };
  }

  setWebLLMConfig(config: Partial<WebLLMConfig>) {
    this.webLLMConfig = { ...this.webLLMConfig, ...config };
  }

  getOllamaConfig(): OllamaConfig {
    return { ...this.ollamaConfig };
  }

  getLMStudioConfig(): LMStudioConfig {
    return { ...this.lmStudioConfig };
  }

  getWebLLMConfig(): WebLLMConfig {
    return { ...this.webLLMConfig };
  }
}

// ========================
// Export Singleton
// ========================

const localModelService = new LocalModelService();
export default localModelService;
