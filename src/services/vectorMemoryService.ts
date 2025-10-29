/**
 * AI Chat Studio v4.0 - Vector Memory Service
 *
 * Long-term memory system using vector embeddings for semantic recall
 * across conversations. Implements forgetting curve and memory consolidation.
 */

import localforage from 'localforage'
import type {
  VectorMemory,
  Memory,
  MemoryQuery,
  MemorySearchResult,
  MemoryConfig,
  MemoryStats
} from '../types/v4-types'

class VectorMemoryService {
  private readonly MEMORY_KEY = 'vector_memories'
  private embedder: any = null
  private readonly EMBEDDING_MODEL = 'Xenova/all-MiniLM-L6-v2'

  private memoryStore = localforage.createInstance({
    name: 'chat-studio-v4',
    storeName: 'memories'
  })

  /**
   * Initialize the service
   */
  async initialize(): Promise<boolean> {
    if (this.embedder) return true

    try {
      // In production, use @xenova/transformers
      // For now, mock the embedder
      this.embedder = {
        async embed(text: string): Promise<number[]> {
          // Mock embedding - in production, use real transformer model
          const normalized = text.toLowerCase()
          const hash = Array.from(normalized).reduce(
            (acc, char) => acc + char.charCodeAt(0),
            0
          )

          // Generate deterministic 384-dim embedding
          const embedding = Array(384).fill(0).map((_, i) => {
            return Math.sin(hash + i) * Math.cos(hash * i)
          })

          return embedding
        }
      }

      return true
    } catch (error) {
      console.error('Failed to initialize vector memory:', error)
      return false
    }
  }

  /**
   * Get or create user's memory system
   */
  async getUserMemory(userId: string): Promise<VectorMemory> {
    const memories = await this.memoryStore.getItem<Record<string, VectorMemory>>(
      this.MEMORY_KEY
    ) || {}

    if (!memories[userId]) {
      memories[userId] = {
        id: `mem_${userId}`,
        userId,
        memories: [],
        config: this.getDefaultConfig(),
        stats: this.getDefaultStats()
      }

      await this.memoryStore.setItem(this.MEMORY_KEY, memories)
    }

    return memories[userId]
  }

  /**
   * Add a memory
   */
  async addMemory(
    userId: string,
    content: string,
    type: Memory['type'],
    metadata?: Partial<Memory>
  ): Promise<Memory> {
    await this.initialize()

    const userMemory = await this.getUserMemory(userId)

    // Generate embedding
    const embedding = await this.embedder.embed(content)

    const memory: Memory = {
      id: `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      type,
      importance: metadata?.importance || this.calculateImportance(content, type),
      accessCount: 0,
      lastAccessed: Date.now(),
      createdAt: Date.now(),
      expiresAt: metadata?.expiresAt,
      tags: metadata?.tags || [],
      embedding,
      metadata: {
        source: metadata?.metadata?.source || 'user',
        confidence: metadata?.metadata?.confidence || 1.0,
        verified: metadata?.metadata?.verified || false,
        relatedMemories: metadata?.metadata?.relatedMemories || [],
        context: metadata?.metadata?.context || {}
      }
    }

    userMemory.memories.push(memory)

    // Update stats
    userMemory.stats.totalMemories++
    if (type === 'personal') userMemory.stats.personalMemories++
    if (type === 'factual') userMemory.stats.factualMemories++
    userMemory.stats.averageImportance =
      (userMemory.stats.averageImportance * (userMemory.stats.totalMemories - 1) +
        memory.importance) /
      userMemory.stats.totalMemories

    // Apply memory limits
    await this.enforceMemoryLimits(userMemory)

    await this.saveUserMemory(userId, userMemory)

    return memory
  }

  /**
   * Search memories by semantic similarity
   */
  async searchMemories(
    userId: string,
    query: MemoryQuery
  ): Promise<MemorySearchResult[]> {
    await this.initialize()

    const userMemory = await this.getUserMemory(userId)

    // Generate query embedding
    const queryEmbedding = await this.embedder.embed(query.query)

    // Filter by type if specified
    let memories = userMemory.memories
    if (query.type) {
      memories = memories.filter(m => m.type === query.type)
    }

    // Filter by importance
    if (query.minImportance) {
      memories = memories.filter(m => m.importance >= query.minImportance!)
    }

    // Filter by date range
    if (query.dateRange) {
      memories = memories.filter(
        m =>
          m.createdAt >= query.dateRange!.from &&
          m.createdAt <= query.dateRange!.to
      )
    }

    // Calculate similarities
    const results: MemorySearchResult[] = memories.map(memory => {
      const relevance = this.cosineSimilarity(queryEmbedding, memory.embedding)

      // Apply decay based on time and access
      const decayedRelevance = this.applyMemoryDecay(memory, relevance)

      return {
        memory,
        relevance: decayedRelevance,
        reasoning: this.generateReasoning(memory, decayedRelevance)
      }
    })

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance)

    // Update access counts
    const topResults = results.slice(0, query.limit || 10)
    for (const result of topResults) {
      result.memory.accessCount++
      result.memory.lastAccessed = Date.now()
    }

    await this.saveUserMemory(userId, userMemory)

    return topResults
  }

  /**
   * Recall memories (semantic search with context)
   */
  async recallMemories(
    userId: string,
    context: string,
    limit: number = 5
  ): Promise<Memory[]> {
    const results = await this.searchMemories(userId, {
      query: context,
      limit,
      minImportance: 0.3
    })

    return results.map(r => r.memory)
  }

  /**
   * Get memory by ID
   */
  async getMemory(userId: string, memoryId: string): Promise<Memory | null> {
    const userMemory = await this.getUserMemory(userId)
    const memory = userMemory.memories.find(m => m.id === memoryId)

    if (memory) {
      memory.accessCount++
      memory.lastAccessed = Date.now()
      await this.saveUserMemory(userId, userMemory)
    }

    return memory || null
  }

  /**
   * Update memory
   */
  async updateMemory(
    userId: string,
    memoryId: string,
    updates: Partial<Memory>
  ): Promise<Memory | null> {
    const userMemory = await this.getUserMemory(userId)
    const index = userMemory.memories.findIndex(m => m.id === memoryId)

    if (index === -1) return null

    // If content changed, regenerate embedding
    if (updates.content) {
      updates.embedding = await this.embedder.embed(updates.content)
    }

    userMemory.memories[index] = {
      ...userMemory.memories[index],
      ...updates
    }

    await this.saveUserMemory(userId, userMemory)

    return userMemory.memories[index]
  }

  /**
   * Delete memory
   */
  async deleteMemory(userId: string, memoryId: string): Promise<boolean> {
    const userMemory = await this.getUserMemory(userId)
    const initialLength = userMemory.memories.length

    userMemory.memories = userMemory.memories.filter(m => m.id !== memoryId)

    if (userMemory.memories.length < initialLength) {
      await this.saveUserMemory(userId, userMemory)
      return true
    }

    return false
  }

  /**
   * Consolidate memories (merge similar ones)
   */
  async consolidateMemories(userId: string, threshold: number = 0.9): Promise<number> {
    const userMemory = await this.getUserMemory(userId)
    let consolidated = 0

    for (let i = 0; i < userMemory.memories.length; i++) {
      for (let j = i + 1; j < userMemory.memories.length; j++) {
        const similarity = this.cosineSimilarity(
          userMemory.memories[i].embedding,
          userMemory.memories[j].embedding
        )

        if (similarity >= threshold) {
          // Merge memories
          const mergedMemory = this.mergeMemories(
            userMemory.memories[i],
            userMemory.memories[j]
          )

          userMemory.memories[i] = mergedMemory
          userMemory.memories.splice(j, 1)
          consolidated++
          j--
        }
      }
    }

    if (consolidated > 0) {
      await this.saveUserMemory(userId, userMemory)
    }

    return consolidated
  }

  /**
   * Apply forgetting curve (remove old, unimportant memories)
   */
  async applyForgettingCurve(userId: string): Promise<number> {
    const userMemory = await this.getUserMemory(userId)
    const now = Date.now()
    const initialCount = userMemory.memories.length

    userMemory.memories = userMemory.memories.filter(memory => {
      // Check if expired
      if (memory.expiresAt && memory.expiresAt < now) {
        return false
      }

      // Apply forgetting curve based on config
      const age = now - memory.createdAt
      const daysSinceCreated = age / (1000 * 60 * 60 * 24)
      const daysSinceAccessed = (now - memory.lastAccessed) / (1000 * 60 * 60 * 24)

      let retentionProbability = 1.0

      switch (userMemory.config.forgettingCurve) {
        case 'exponential':
          // Ebbinghaus forgetting curve
          retentionProbability = Math.exp(-daysSinceAccessed / 30)
          break

        case 'linear':
          retentionProbability = Math.max(0, 1 - daysSinceAccessed / 365)
          break

        case 'custom':
          // Custom curve based on importance and access
          retentionProbability =
            memory.importance * (1 - daysSinceAccessed / 365) +
            Math.min(memory.accessCount / 100, 0.5)
          break
      }

      // Keep if above threshold or very important
      return (
        retentionProbability > 0.1 ||
        memory.importance > 0.8 ||
        memory.accessCount > 10
      )
    })

    const forgotten = initialCount - userMemory.memories.length

    if (forgotten > 0) {
      await this.saveUserMemory(userId, userMemory)
    }

    return forgotten
  }

  /**
   * Get memory statistics
   */
  async getStats(userId: string): Promise<MemoryStats> {
    const userMemory = await this.getUserMemory(userId)
    return userMemory.stats
  }

  /**
   * Update memory configuration
   */
  async updateConfig(
    userId: string,
    config: Partial<MemoryConfig>
  ): Promise<MemoryConfig> {
    const userMemory = await this.getUserMemory(userId)

    userMemory.config = {
      ...userMemory.config,
      ...config
    }

    await this.saveUserMemory(userId, userMemory)

    return userMemory.config
  }

  /**
   * Clear all memories for user
   */
  async clearMemories(userId: string): Promise<boolean> {
    const memories = await this.memoryStore.getItem<Record<string, VectorMemory>>(
      this.MEMORY_KEY
    ) || {}

    if (memories[userId]) {
      delete memories[userId]
      await this.memoryStore.setItem(this.MEMORY_KEY, memories)
      return true
    }

    return false
  }

  /**
   * Export memories
   */
  async exportMemories(userId: string): Promise<Memory[]> {
    const userMemory = await this.getUserMemory(userId)
    return userMemory.memories
  }

  /**
   * Import memories
   */
  async importMemories(userId: string, memories: Memory[]): Promise<number> {
    const userMemory = await this.getUserMemory(userId)

    let imported = 0
    for (const memory of memories) {
      // Check for duplicates
      const exists = userMemory.memories.some(m => m.content === memory.content)

      if (!exists) {
        userMemory.memories.push(memory)
        imported++
      }
    }

    if (imported > 0) {
      await this.saveUserMemory(userId, userMemory)
    }

    return imported
  }

  // ===================================
  // PRIVATE HELPER METHODS
  // ===================================

  /**
   * Calculate memory importance
   */
  private calculateImportance(content: string, type: Memory['type']): number {
    let importance = 0.5

    // Type-based importance
    switch (type) {
      case 'personal':
        importance = 0.8
        break
      case 'factual':
        importance = 0.6
        break
      case 'procedural':
        importance = 0.7
        break
      case 'episodic':
        importance = 0.5
        break
      case 'semantic':
        importance = 0.6
        break
    }

    // Content-based importance (simple heuristics)
    if (content.includes('important') || content.includes('remember')) {
      importance += 0.1
    }

    if (content.length > 200) {
      importance += 0.05
    }

    return Math.min(importance, 1.0)
  }

  /**
   * Cosine similarity between vectors
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
  }

  /**
   * Apply memory decay
   */
  private applyMemoryDecay(memory: Memory, baseRelevance: number): number {
    const now = Date.now()
    const age = now - memory.createdAt
    const daysSinceCreated = age / (1000 * 60 * 60 * 24)
    const daysSinceAccessed = (now - memory.lastAccessed) / (1000 * 60 * 60 * 24)

    // Time decay
    const timeDecay = Math.exp(-daysSinceAccessed / 30)

    // Access boost
    const accessBoost = Math.min(memory.accessCount / 10, 1.0)

    // Importance multiplier
    const importanceMultiplier = 0.5 + memory.importance * 0.5

    return baseRelevance * timeDecay * importanceMultiplier + accessBoost * 0.2
  }

  /**
   * Generate reasoning for memory relevance
   */
  private generateReasoning(memory: Memory, relevance: number): string {
    const reasons: string[] = []

    if (relevance > 0.8) {
      reasons.push('Highly relevant')
    } else if (relevance > 0.6) {
      reasons.push('Moderately relevant')
    } else {
      reasons.push('Somewhat relevant')
    }

    if (memory.importance > 0.7) {
      reasons.push('high importance')
    }

    if (memory.accessCount > 5) {
      reasons.push(`accessed ${memory.accessCount} times`)
    }

    const daysSinceAccessed =
      (Date.now() - memory.lastAccessed) / (1000 * 60 * 60 * 24)

    if (daysSinceAccessed < 7) {
      reasons.push('recently accessed')
    }

    return reasons.join(', ')
  }

  /**
   * Merge two similar memories
   */
  private mergeMemories(mem1: Memory, mem2: Memory): Memory {
    return {
      ...mem1,
      content: `${mem1.content}\n\nRelated: ${mem2.content}`,
      importance: Math.max(mem1.importance, mem2.importance),
      accessCount: mem1.accessCount + mem2.accessCount,
      lastAccessed: Math.max(mem1.lastAccessed, mem2.lastAccessed),
      tags: [...new Set([...mem1.tags, ...mem2.tags])],
      metadata: {
        ...mem1.metadata,
        relatedMemories: [
          ...mem1.metadata.relatedMemories,
          ...mem2.metadata.relatedMemories,
          mem2.id
        ]
      }
    }
  }

  /**
   * Enforce memory limits
   */
  private async enforceMemoryLimits(userMemory: VectorMemory): Promise<void> {
    const config = userMemory.config

    // Check max memories
    if (userMemory.memories.length > config.maxMemories) {
      // Sort by importance and recency
      userMemory.memories.sort((a, b) => {
        const scoreA = a.importance * 0.6 + (a.accessCount / 100) * 0.4
        const scoreB = b.importance * 0.6 + (b.accessCount / 100) * 0.4
        return scoreB - scoreA
      })

      userMemory.memories = userMemory.memories.slice(0, config.maxMemories)
    }

    // Auto-forget if enabled
    if (config.autoForget) {
      await this.applyForgettingCurve(userMemory.userId)
    }
  }

  /**
   * Save user memory
   */
  private async saveUserMemory(
    userId: string,
    userMemory: VectorMemory
  ): Promise<void> {
    const memories = await this.memoryStore.getItem<Record<string, VectorMemory>>(
      this.MEMORY_KEY
    ) || {}

    memories[userId] = userMemory

    await this.memoryStore.setItem(this.MEMORY_KEY, memories)
  }

  /**
   * Get default configuration
   */
  private getDefaultConfig(): MemoryConfig {
    return {
      maxMemories: 10000,
      retentionDays: 365,
      importanceThreshold: 0.3,
      autoForget: true,
      forgettingCurve: 'exponential'
    }
  }

  /**
   * Get default stats
   */
  private getDefaultStats(): MemoryStats {
    return {
      totalMemories: 0,
      personalMemories: 0,
      factualMemories: 0,
      averageImportance: 0,
      storageUsed: 0
    }
  }
}

export default new VectorMemoryService()
