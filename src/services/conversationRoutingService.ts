import { EventEmitter } from '@/utils/EventEmitter';

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  type: 'text' | 'image' | 'voice' | 'video' | 'multimodal';
  capabilities: string[];
  maxTokens: number;
  costPerToken: number;
  latency: number;
  reliability: number;
  status: 'active' | 'inactive' | 'maintenance' | 'overloaded';
  region: string;
  endpoint: string;
  apiKey?: string;
  metadata: {
    version: string;
    lastUpdate: number;
    healthScore: number;
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    currentLoad: number;
    maxConcurrency: number;
  };
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  conditions: RoutingCondition[];
  targetModels: string[];
  loadBalancingStrategy: 'round_robin' | 'least_connections' | 'weighted' | 'latency_based' | 'cost_optimized';
  failoverStrategy: 'immediate' | 'retry' | 'circuit_breaker';
  isActive: boolean;
  metadata: {
    createdAt: number;
    updatedAt: number;
    appliedCount: number;
    successRate: number;
  };
}

export interface RoutingCondition {
  field: 'user_tier' | 'content_type' | 'message_length' | 'complexity' | 'language' | 'region' | 'time' | 'cost_budget';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in' | 'between';
  value: any;
}

export interface ConversationRequest {
  id: string;
  userId: string;
  organizationId: string;
  conversationId: string;
  content: string;
  contentType: 'text' | 'image' | 'voice' | 'file';
  context: {
    userTier: 'free' | 'premium' | 'enterprise';
    messageLength: number;
    complexity: 'low' | 'medium' | 'high';
    language: string;
    region: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    costBudget?: number;
  };
  requirements: {
    maxLatency?: number;
    minReliability?: number;
    preferredProviders?: string[];
    excludedModels?: string[];
  };
  metadata: {
    timestamp: number;
    retryCount: number;
    originalModelId?: string;
  };
}

export interface RoutingResult {
  selectedModel: AIModel;
  reason: string;
  confidence: number;
  alternativeModels: AIModel[];
  estimatedCost: number;
  estimatedLatency: number;
  loadBalancingInfo: {
    strategy: string;
    weight: number;
    currentLoad: number;
  };
}

export interface LoadBalancer {
  strategy: string;
  models: AIModel[];
  weights: { [modelId: string]: number };
  currentConnections: { [modelId: string]: number };
  roundRobinIndex: number;
  circuitBreakers: { [modelId: string]: CircuitBreaker };
}

export interface CircuitBreaker {
  modelId: string;
  state: 'closed' | 'open' | 'half_open';
  failureCount: number;
  failureThreshold: number;
  timeout: number;
  lastFailureTime: number;
  successCount: number;
  metadata: {
    totalRequests: number;
    totalFailures: number;
    lastStateChange: number;
  };
}

export interface RoutingMetrics {
  totalRequests: number;
  successfulRoutes: number;
  failedRoutes: number;
  averageLatency: number;
  costSavings: number;
  modelUsage: { [modelId: string]: number };
  regionDistribution: { [region: string]: number };
  tierDistribution: { [tier: string]: number };
  loadBalancingEfficiency: number;
  circuitBreakerActivations: number;
}

class ConversationRoutingService extends EventEmitter {
  private models: Map<string, AIModel> = new Map();
  private rules: Map<string, RoutingRule> = new Map();
  private loadBalancers: Map<string, LoadBalancer> = new Map();
  private metrics: RoutingMetrics;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.metrics = this.initializeMetrics();
    this.loadFromStorage();
    this.initializeDefaultModels();
    this.initializeDefaultRules();
    this.startHealthChecking();
  }

  private initializeMetrics(): RoutingMetrics {
    return {
      totalRequests: 0,
      successfulRoutes: 0,
      failedRoutes: 0,
      averageLatency: 0,
      costSavings: 0,
      modelUsage: {},
      regionDistribution: {},
      tierDistribution: {},
      loadBalancingEfficiency: 0.85,
      circuitBreakerActivations: 0
    };
  }

  private loadFromStorage(): void {
    try {
      const modelsData = localStorage.getItem('chat_studio_ai_models');
      if (modelsData) {
        const models = JSON.parse(modelsData);
        models.forEach((model: AIModel) => this.models.set(model.id, model));
      }

      const rulesData = localStorage.getItem('chat_studio_routing_rules');
      if (rulesData) {
        const rules = JSON.parse(rulesData);
        rules.forEach((rule: RoutingRule) => this.rules.set(rule.id, rule));
      }

      const metricsData = localStorage.getItem('chat_studio_routing_metrics');
      if (metricsData) {
        this.metrics = { ...this.metrics, ...JSON.parse(metricsData) };
      }
    } catch (error) {
      console.error('Failed to load routing data from storage:', error);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem('chat_studio_ai_models', JSON.stringify(Array.from(this.models.values())));
      localStorage.setItem('chat_studio_routing_rules', JSON.stringify(Array.from(this.rules.values())));
      localStorage.setItem('chat_studio_routing_metrics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save routing data to storage:', error);
    }
  }

  private initializeDefaultModels(): void {
    const defaultModels: AIModel[] = [
      {
        id: 'gpt-4-turbo',
        name: 'GPT-4 Turbo',
        provider: 'OpenAI',
        type: 'text',
        capabilities: ['reasoning', 'analysis', 'creative_writing', 'coding'],
        maxTokens: 128000,
        costPerToken: 0.00003,
        latency: 1200,
        reliability: 0.99,
        status: 'active',
        region: 'us-east-1',
        endpoint: 'https://api.openai.com/v1/chat/completions',
        metadata: {
          version: '2024-04-09',
          lastUpdate: Date.now(),
          healthScore: 98,
          totalRequests: 15420,
          successRate: 0.994,
          averageResponseTime: 1180,
          currentLoad: 45,
          maxConcurrency: 100
        }
      },
      {
        id: 'claude-3-opus',
        name: 'Claude 3 Opus',
        provider: 'Anthropic',
        type: 'text',
        capabilities: ['reasoning', 'analysis', 'creative_writing', 'safety'],
        maxTokens: 200000,
        costPerToken: 0.000075,
        latency: 1500,
        reliability: 0.98,
        status: 'active',
        region: 'us-west-2',
        endpoint: 'https://api.anthropic.com/v1/messages',
        metadata: {
          version: '20240229',
          lastUpdate: Date.now(),
          healthScore: 96,
          totalRequests: 8932,
          successRate: 0.987,
          averageResponseTime: 1450,
          currentLoad: 32,
          maxConcurrency: 80
        }
      },
      {
        id: 'gemini-pro',
        name: 'Gemini Pro',
        provider: 'Google',
        type: 'multimodal',
        capabilities: ['reasoning', 'analysis', 'vision', 'coding'],
        maxTokens: 30720,
        costPerToken: 0.000125,
        latency: 800,
        reliability: 0.97,
        status: 'active',
        region: 'us-central1',
        endpoint: 'https://generativelanguage.googleapis.com/v1/models/gemini-pro',
        metadata: {
          version: '1.0',
          lastUpdate: Date.now(),
          healthScore: 94,
          totalRequests: 12156,
          successRate: 0.976,
          averageResponseTime: 780,
          currentLoad: 58,
          maxConcurrency: 120
        }
      },
      {
        id: 'llama-2-70b',
        name: 'Llama 2 70B',
        provider: 'Meta',
        type: 'text',
        capabilities: ['reasoning', 'coding', 'analysis'],
        maxTokens: 4096,
        costPerToken: 0.000015,
        latency: 2000,
        reliability: 0.95,
        status: 'active',
        region: 'eu-west-1',
        endpoint: 'https://api.replicate.com/v1/predictions',
        metadata: {
          version: '2.0',
          lastUpdate: Date.now(),
          healthScore: 91,
          totalRequests: 6743,
          successRate: 0.953,
          averageResponseTime: 1980,
          currentLoad: 28,
          maxConcurrency: 60
        }
      },
      {
        id: 'mistral-large',
        name: 'Mistral Large',
        provider: 'Mistral AI',
        type: 'text',
        capabilities: ['reasoning', 'multilingual', 'coding'],
        maxTokens: 32768,
        costPerToken: 0.000024,
        latency: 900,
        reliability: 0.96,
        status: 'active',
        region: 'eu-central-1',
        endpoint: 'https://api.mistral.ai/v1/chat/completions',
        metadata: {
          version: '1.0',
          lastUpdate: Date.now(),
          healthScore: 93,
          totalRequests: 4521,
          successRate: 0.968,
          averageResponseTime: 920,
          currentLoad: 22,
          maxConcurrency: 70
        }
      }
    ];

    defaultModels.forEach(model => {
      if (!this.models.has(model.id)) {
        this.models.set(model.id, model);
      }
    });
  }

  private initializeDefaultRules(): void {
    const defaultRules: RoutingRule[] = [
      {
        id: 'enterprise-priority',
        name: '企业级用户优先路由',
        priority: 1,
        conditions: [
          { field: 'user_tier', operator: 'equals', value: 'enterprise' }
        ],
        targetModels: ['gpt-4-turbo', 'claude-3-opus'],
        loadBalancingStrategy: 'latency_based',
        failoverStrategy: 'circuit_breaker',
        isActive: true,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          appliedCount: 2341,
          successRate: 0.996
        }
      },
      {
        id: 'cost-optimization',
        name: '成本优化路由',
        priority: 5,
        conditions: [
          { field: 'user_tier', operator: 'equals', value: 'free' },
          { field: 'message_length', operator: 'less_than', value: 1000 }
        ],
        targetModels: ['llama-2-70b', 'mistral-large'],
        loadBalancingStrategy: 'cost_optimized',
        failoverStrategy: 'retry',
        isActive: true,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          appliedCount: 15678,
          successRate: 0.982
        }
      },
      {
        id: 'complex-reasoning',
        name: '复杂推理任务路由',
        priority: 2,
        conditions: [
          { field: 'complexity', operator: 'equals', value: 'high' },
          { field: 'content_type', operator: 'equals', value: 'text' }
        ],
        targetModels: ['claude-3-opus', 'gpt-4-turbo'],
        loadBalancingStrategy: 'weighted',
        failoverStrategy: 'immediate',
        isActive: true,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          appliedCount: 876,
          successRate: 0.994
        }
      },
      {
        id: 'multimodal-content',
        name: '多模态内容路由',
        priority: 3,
        conditions: [
          { field: 'content_type', operator: 'in', value: ['image', 'voice'] }
        ],
        targetModels: ['gemini-pro'],
        loadBalancingStrategy: 'round_robin',
        failoverStrategy: 'circuit_breaker',
        isActive: true,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          appliedCount: 1432,
          successRate: 0.989
        }
      },
      {
        id: 'regional-routing',
        name: '区域优化路由',
        priority: 4,
        conditions: [
          { field: 'region', operator: 'equals', value: 'eu' }
        ],
        targetModels: ['mistral-large', 'llama-2-70b'],
        loadBalancingStrategy: 'latency_based',
        failoverStrategy: 'retry',
        isActive: true,
        metadata: {
          createdAt: Date.now(),
          updatedAt: Date.now(),
          appliedCount: 3254,
          successRate: 0.978
        }
      }
    ];

    defaultRules.forEach(rule => {
      if (!this.rules.has(rule.id)) {
        this.rules.set(rule.id, rule);
      }
    });
  }

  async routeConversation(request: ConversationRequest): Promise<RoutingResult> {
    this.metrics.totalRequests++;

    try {
      // 1. Find matching routing rules
      const matchingRules = this.findMatchingRules(request);

      // 2. Select best rule based on priority
      const selectedRule = matchingRules.length > 0
        ? matchingRules.sort((a, b) => a.priority - b.priority)[0]
        : null;

      // 3. Get candidate models
      const candidateModels = selectedRule
        ? this.getModelsForRule(selectedRule)
        : Array.from(this.models.values()).filter(m => m.status === 'active');

      // 4. Filter models based on requirements
      const eligibleModels = this.filterModelsByRequirements(candidateModels, request);

      if (eligibleModels.length === 0) {
        throw new Error('No eligible models available for this request');
      }

      // 5. Apply load balancing strategy
      const selectedModel = await this.selectModelWithLoadBalancing(
        eligibleModels,
        selectedRule?.loadBalancingStrategy || 'round_robin',
        request
      );

      // 6. Calculate estimates
      const estimatedCost = this.calculateCost(selectedModel, request);
      const estimatedLatency = this.calculateLatency(selectedModel, request);

      // 7. Update metrics
      this.updateMetrics(selectedModel, request, true);

      const result: RoutingResult = {
        selectedModel,
        reason: selectedRule ? `Rule: ${selectedRule.name}` : 'Default routing',
        confidence: this.calculateConfidence(selectedModel, request),
        alternativeModels: eligibleModels.filter(m => m.id !== selectedModel.id).slice(0, 3),
        estimatedCost,
        estimatedLatency,
        loadBalancingInfo: {
          strategy: selectedRule?.loadBalancingStrategy || 'round_robin',
          weight: this.getModelWeight(selectedModel.id),
          currentLoad: selectedModel.metadata.currentLoad
        }
      };

      this.metrics.successfulRoutes++;
      this.emit('conversationRouted', { request, result });

      return result;

    } catch (error) {
      this.metrics.failedRoutes++;
      this.emit('routingError', { request, error });
      throw error;
    }
  }

  private findMatchingRules(request: ConversationRequest): RoutingRule[] {
    return Array.from(this.rules.values())
      .filter(rule => rule.isActive && this.evaluateRuleConditions(rule, request));
  }

  private evaluateRuleConditions(rule: RoutingRule, request: ConversationRequest): boolean {
    return rule.conditions.every(condition => this.evaluateCondition(condition, request));
  }

  private evaluateCondition(condition: RoutingCondition, request: ConversationRequest): boolean {
    let fieldValue: any;

    switch (condition.field) {
      case 'user_tier':
        fieldValue = request.context.userTier;
        break;
      case 'content_type':
        fieldValue = request.contentType;
        break;
      case 'message_length':
        fieldValue = request.context.messageLength;
        break;
      case 'complexity':
        fieldValue = request.context.complexity;
        break;
      case 'language':
        fieldValue = request.context.language;
        break;
      case 'region':
        fieldValue = request.context.region;
        break;
      case 'cost_budget':
        fieldValue = request.context.costBudget;
        break;
      default:
        return false;
    }

    switch (condition.operator) {
      case 'equals':
        return fieldValue === condition.value;
      case 'not_equals':
        return fieldValue !== condition.value;
      case 'greater_than':
        return fieldValue > condition.value;
      case 'less_than':
        return fieldValue < condition.value;
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'between':
        return Array.isArray(condition.value) && fieldValue >= condition.value[0] && fieldValue <= condition.value[1];
      default:
        return false;
    }
  }

  private getModelsForRule(rule: RoutingRule): AIModel[] {
    return rule.targetModels
      .map(id => this.models.get(id))
      .filter((model): model is AIModel => model !== undefined && model.status === 'active');
  }

  private filterModelsByRequirements(models: AIModel[], request: ConversationRequest): AIModel[] {
    return models.filter(model => {
      // Check latency requirement
      if (request.requirements.maxLatency && model.latency > request.requirements.maxLatency) {
        return false;
      }

      // Check reliability requirement
      if (request.requirements.minReliability && model.reliability < request.requirements.minReliability) {
        return false;
      }

      // Check preferred providers
      if (request.requirements.preferredProviders &&
          !request.requirements.preferredProviders.includes(model.provider)) {
        return false;
      }

      // Check excluded models
      if (request.requirements.excludedModels &&
          request.requirements.excludedModels.includes(model.id)) {
        return false;
      }

      // Check circuit breaker state
      const circuitBreaker = this.getCircuitBreaker(model.id);
      if (circuitBreaker && circuitBreaker.state === 'open') {
        return false;
      }

      return true;
    });
  }

  private async selectModelWithLoadBalancing(
    models: AIModel[],
    strategy: string,
    request: ConversationRequest
  ): Promise<AIModel> {
    switch (strategy) {
      case 'round_robin':
        return this.selectRoundRobin(models);
      case 'least_connections':
        return this.selectLeastConnections(models);
      case 'weighted':
        return this.selectWeighted(models);
      case 'latency_based':
        return this.selectLatencyBased(models);
      case 'cost_optimized':
        return this.selectCostOptimized(models, request);
      default:
        return models[0];
    }
  }

  private selectRoundRobin(models: AIModel[]): AIModel {
    const loadBalancer = this.getOrCreateLoadBalancer('round_robin', models);
    loadBalancer.roundRobinIndex = (loadBalancer.roundRobinIndex + 1) % models.length;
    return models[loadBalancer.roundRobinIndex];
  }

  private selectLeastConnections(models: AIModel[]): AIModel {
    return models.reduce((least, current) =>
      current.metadata.currentLoad < least.metadata.currentLoad ? current : least
    );
  }

  private selectWeighted(models: AIModel[]): AIModel {
    const totalWeight = models.reduce((sum, model) => sum + this.getModelWeight(model.id), 0);
    let random = Math.random() * totalWeight;

    for (const model of models) {
      random -= this.getModelWeight(model.id);
      if (random <= 0) {
        return model;
      }
    }

    return models[0];
  }

  private selectLatencyBased(models: AIModel[]): AIModel {
    return models.reduce((fastest, current) =>
      current.metadata.averageResponseTime < fastest.metadata.averageResponseTime ? current : fastest
    );
  }

  private selectCostOptimized(models: AIModel[], request: ConversationRequest): AIModel {
    return models.reduce((cheapest, current) => {
      const currentCost = this.calculateCost(current, request);
      const cheapestCost = this.calculateCost(cheapest, request);
      return currentCost < cheapestCost ? current : cheapest;
    });
  }

  private getOrCreateLoadBalancer(strategy: string, models: AIModel[]): LoadBalancer {
    const key = `${strategy}_${models.map(m => m.id).join('_')}`;

    if (!this.loadBalancers.has(key)) {
      const weights: { [modelId: string]: number } = {};
      const connections: { [modelId: string]: number } = {};
      const circuitBreakers: { [modelId: string]: CircuitBreaker } = {};

      models.forEach(model => {
        weights[model.id] = model.reliability * 100;
        connections[model.id] = model.metadata.currentLoad;
        circuitBreakers[model.id] = this.getOrCreateCircuitBreaker(model.id);
      });

      this.loadBalancers.set(key, {
        strategy,
        models,
        weights,
        currentConnections: connections,
        roundRobinIndex: -1,
        circuitBreakers
      });
    }

    return this.loadBalancers.get(key)!;
  }

  private getOrCreateCircuitBreaker(modelId: string): CircuitBreaker {
    const existing = this.getCircuitBreaker(modelId);
    if (existing) return existing;

    return {
      modelId,
      state: 'closed',
      failureCount: 0,
      failureThreshold: 5,
      timeout: 60000, // 1 minute
      lastFailureTime: 0,
      successCount: 0,
      metadata: {
        totalRequests: 0,
        totalFailures: 0,
        lastStateChange: Date.now()
      }
    };
  }

  private getCircuitBreaker(modelId: string): CircuitBreaker | null {
    for (const loadBalancer of this.loadBalancers.values()) {
      if (loadBalancer.circuitBreakers[modelId]) {
        return loadBalancer.circuitBreakers[modelId];
      }
    }
    return null;
  }

  private getModelWeight(modelId: string): number {
    for (const loadBalancer of this.loadBalancers.values()) {
      if (loadBalancer.weights[modelId]) {
        return loadBalancer.weights[modelId];
      }
    }
    return 50; // Default weight
  }

  private calculateCost(model: AIModel, request: ConversationRequest): number {
    const estimatedTokens = Math.min(request.context.messageLength * 1.2, model.maxTokens);
    return estimatedTokens * model.costPerToken;
  }

  private calculateLatency(model: AIModel, request: ConversationRequest): number {
    const baseLatency = model.metadata.averageResponseTime;
    const loadFactor = 1 + (model.metadata.currentLoad / 100);
    const complexityFactor = request.context.complexity === 'high' ? 1.5 :
                           request.context.complexity === 'medium' ? 1.2 : 1.0;

    return Math.round(baseLatency * loadFactor * complexityFactor);
  }

  private calculateConfidence(model: AIModel, request: ConversationRequest): number {
    const reliabilityScore = model.reliability;
    const healthScore = model.metadata.healthScore / 100;
    const loadScore = Math.max(0, (100 - model.metadata.currentLoad) / 100);
    const capabilityScore = this.calculateCapabilityMatch(model, request);

    return Math.min(0.99, (reliabilityScore + healthScore + loadScore + capabilityScore) / 4);
  }

  private calculateCapabilityMatch(model: AIModel, request: ConversationRequest): number {
    const requiredCapabilities = this.inferRequiredCapabilities(request);
    const matchCount = requiredCapabilities.filter(cap => model.capabilities.includes(cap)).length;
    return requiredCapabilities.length > 0 ? matchCount / requiredCapabilities.length : 1.0;
  }

  private inferRequiredCapabilities(request: ConversationRequest): string[] {
    const capabilities: string[] = [];

    if (request.context.complexity === 'high') {
      capabilities.push('reasoning');
    }

    if (request.contentType === 'image') {
      capabilities.push('vision');
    }

    if (request.content.includes('code') || request.content.includes('function')) {
      capabilities.push('coding');
    }

    if (request.context.language !== 'en') {
      capabilities.push('multilingual');
    }

    return capabilities;
  }

  private updateMetrics(model: AIModel, request: ConversationRequest, success: boolean): void {
    if (!this.metrics.modelUsage[model.id]) {
      this.metrics.modelUsage[model.id] = 0;
    }
    this.metrics.modelUsage[model.id]++;

    if (!this.metrics.regionDistribution[request.context.region]) {
      this.metrics.regionDistribution[request.context.region] = 0;
    }
    this.metrics.regionDistribution[request.context.region]++;

    if (!this.metrics.tierDistribution[request.context.userTier]) {
      this.metrics.tierDistribution[request.context.userTier] = 0;
    }
    this.metrics.tierDistribution[request.context.userTier]++;

    // Update model stats
    model.metadata.totalRequests++;
    if (success) {
      model.metadata.successRate =
        (model.metadata.successRate * (model.metadata.totalRequests - 1) + 1) / model.metadata.totalRequests;
    }

    this.saveToStorage();
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Every 30 seconds
  }

  private async performHealthCheck(): Promise<void> {
    for (const model of this.models.values()) {
      try {
        const healthScore = await this.checkModelHealth(model);
        model.metadata.healthScore = healthScore;

        if (healthScore < 70) {
          model.status = 'maintenance';
          this.emit('modelHealthDegraded', { model, healthScore });
        } else if (model.status === 'maintenance' && healthScore > 85) {
          model.status = 'active';
          this.emit('modelHealthRestored', { model, healthScore });
        }

      } catch (error) {
        model.metadata.healthScore = 0;
        model.status = 'inactive';
        this.emit('modelHealthCheckFailed', { model, error });
      }
    }

    this.saveToStorage();
  }

  private async checkModelHealth(model: AIModel): Promise<number> {
    // Simulate health check
    const latencyScore = Math.max(0, 100 - (model.metadata.averageResponseTime / 30));
    const loadScore = Math.max(0, 100 - model.metadata.currentLoad);
    const reliabilityScore = model.reliability * 100;
    const successRateScore = model.metadata.successRate * 100;

    return Math.round((latencyScore + loadScore + reliabilityScore + successRateScore) / 4);
  }

  // Model Management
  async addModel(model: Omit<AIModel, 'id' | 'metadata'>): Promise<AIModel> {
    const newModel: AIModel = {
      ...model,
      id: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        version: '1.0',
        lastUpdate: Date.now(),
        healthScore: 100,
        totalRequests: 0,
        successRate: 1.0,
        averageResponseTime: model.latency,
        currentLoad: 0,
        maxConcurrency: 100
      }
    };

    this.models.set(newModel.id, newModel);
    this.saveToStorage();
    this.emit('modelAdded', newModel);

    return newModel;
  }

  async updateModel(id: string, updates: Partial<AIModel>): Promise<AIModel | null> {
    const model = this.models.get(id);
    if (!model) return null;

    const updatedModel = {
      ...model,
      ...updates,
      metadata: {
        ...model.metadata,
        ...updates.metadata,
        lastUpdate: Date.now()
      }
    };

    this.models.set(id, updatedModel);
    this.saveToStorage();
    this.emit('modelUpdated', updatedModel);

    return updatedModel;
  }

  async removeModel(id: string): Promise<boolean> {
    const model = this.models.get(id);
    if (!model) return false;

    this.models.delete(id);
    this.saveToStorage();
    this.emit('modelRemoved', model);

    return true;
  }

  // Rule Management
  async addRule(rule: Omit<RoutingRule, 'id' | 'metadata'>): Promise<RoutingRule> {
    const newRule: RoutingRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        appliedCount: 0,
        successRate: 1.0
      }
    };

    this.rules.set(newRule.id, newRule);
    this.saveToStorage();
    this.emit('ruleAdded', newRule);

    return newRule;
  }

  async updateRule(id: string, updates: Partial<RoutingRule>): Promise<RoutingRule | null> {
    const rule = this.rules.get(id);
    if (!rule) return null;

    const updatedRule = {
      ...rule,
      ...updates,
      metadata: {
        ...rule.metadata,
        ...updates.metadata,
        updatedAt: Date.now()
      }
    };

    this.rules.set(id, updatedRule);
    this.saveToStorage();
    this.emit('ruleUpdated', updatedRule);

    return updatedRule;
  }

  async removeRule(id: string): Promise<boolean> {
    const rule = this.rules.get(id);
    if (!rule) return false;

    this.rules.delete(id);
    this.saveToStorage();
    this.emit('ruleRemoved', rule);

    return true;
  }

  // Getters
  getModels(): AIModel[] {
    return Array.from(this.models.values());
  }

  getModel(id: string): AIModel | null {
    return this.models.get(id) || null;
  }

  getRules(): RoutingRule[] {
    return Array.from(this.rules.values());
  }

  getRule(id: string): RoutingRule | null {
    return this.rules.get(id) || null;
  }

  getMetrics(): RoutingMetrics {
    return { ...this.metrics };
  }

  getLoadBalancers(): LoadBalancer[] {
    return Array.from(this.loadBalancers.values());
  }

  // Circuit Breaker Management
  async recordModelFailure(modelId: string): Promise<void> {
    const circuitBreaker = this.getOrCreateCircuitBreaker(modelId);
    circuitBreaker.failureCount++;
    circuitBreaker.lastFailureTime = Date.now();
    circuitBreaker.metadata.totalFailures++;

    if (circuitBreaker.failureCount >= circuitBreaker.failureThreshold) {
      circuitBreaker.state = 'open';
      circuitBreaker.metadata.lastStateChange = Date.now();
      this.metrics.circuitBreakerActivations++;
      this.emit('circuitBreakerOpened', { modelId, circuitBreaker });
    }
  }

  async recordModelSuccess(modelId: string): Promise<void> {
    const circuitBreaker = this.getOrCreateCircuitBreaker(modelId);

    if (circuitBreaker.state === 'half_open') {
      circuitBreaker.successCount++;
      if (circuitBreaker.successCount >= 3) {
        circuitBreaker.state = 'closed';
        circuitBreaker.failureCount = 0;
        circuitBreaker.successCount = 0;
        circuitBreaker.metadata.lastStateChange = Date.now();
        this.emit('circuitBreakerClosed', { modelId, circuitBreaker });
      }
    }
  }

  async checkCircuitBreakerTimeout(): Promise<void> {
    for (const loadBalancer of this.loadBalancers.values()) {
      for (const [modelId, circuitBreaker] of Object.entries(loadBalancer.circuitBreakers)) {
        if (circuitBreaker.state === 'open' &&
            Date.now() - circuitBreaker.lastFailureTime > circuitBreaker.timeout) {
          circuitBreaker.state = 'half_open';
          circuitBreaker.successCount = 0;
          circuitBreaker.metadata.lastStateChange = Date.now();
          this.emit('circuitBreakerHalfOpened', { modelId, circuitBreaker });
        }
      }
    }
  }

  // Analytics
  async generateRoutingReport(startDate: number, endDate: number): Promise<any> {
    return {
      period: { startDate, endDate },
      metrics: this.metrics,
      modelPerformance: this.getModels().map(model => ({
        id: model.id,
        name: model.name,
        usage: this.metrics.modelUsage[model.id] || 0,
        successRate: model.metadata.successRate,
        averageLatency: model.metadata.averageResponseTime,
        healthScore: model.metadata.healthScore
      })),
      ruleEffectiveness: this.getRules().map(rule => ({
        id: rule.id,
        name: rule.name,
        appliedCount: rule.metadata.appliedCount,
        successRate: rule.metadata.successRate
      })),
      trends: {
        requestVolume: this.metrics.totalRequests,
        successRate: this.metrics.successfulRoutes / this.metrics.totalRequests,
        averageLatency: this.metrics.averageLatency,
        costSavings: this.metrics.costSavings
      }
    };
  }

  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.removeAllListeners();
  }
}

export const conversationRoutingService = new ConversationRoutingService();
export default conversationRoutingService;