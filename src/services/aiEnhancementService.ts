import { ConversationSummary, KeywordExtraction, SentimentAnalysis, AutoClassification, SmartRecommendation, Message, Conversation } from '../types'

// AI Enhancement Service for intelligent features
class AIEnhancementService {

  // Auto-generate conversation summary
  async generateSummary(conversation: Conversation): Promise<ConversationSummary> {
    const messages = conversation.messages
    const conversationText = messages
      .map(m => `${m.role}: ${m.content}`)
      .join('\n')

    // Call AI to generate summary
    const summaryPrompt = `Summarize the following conversation in 2-3 sentences, extract 3-5 key points, and identify main topics:\n\n${conversationText}`

    try {
      // This would call your AI service
      const response = await this.callAI(summaryPrompt)

      return {
        conversationId: conversation.id,
        summary: this.extractSummary(response),
        keyPoints: this.extractKeyPoints(response),
        topics: this.extractTopics(response),
        generatedAt: Date.now()
      }
    } catch (error) {
      console.error('Error generating summary:', error)
      throw error
    }
  }

  // Extract keywords and entities from message
  async extractKeywords(messageId: string, content: string): Promise<KeywordExtraction> {
    const prompt = `Extract keywords, named entities, and key concepts from the following text. Return as JSON with keywords[], entities[], and concepts[]:\n\n${content}`

    try {
      const response = await this.callAI(prompt)
      const data = this.parseJSON(response)

      return {
        messageId,
        keywords: data.keywords || this.simpleKeywordExtraction(content),
        entities: data.entities || [],
        concepts: data.concepts || []
      }
    } catch (error) {
      // Fallback to simple extraction
      return {
        messageId,
        keywords: this.simpleKeywordExtraction(content),
        entities: [],
        concepts: []
      }
    }
  }

  // Analyze sentiment of message
  async analyzeSentiment(messageId: string, content: string): Promise<SentimentAnalysis> {
    const prompt = `Analyze the sentiment and emotions of this text. Return JSON with sentiment (positive/negative/neutral), score (-1 to 1), and emotions (joy, sadness, anger, fear, surprise) as 0-1 values:\n\n${content}`

    try {
      const response = await this.callAI(prompt)
      const data = this.parseJSON(response)

      return {
        messageId,
        sentiment: data.sentiment || 'neutral',
        score: data.score || 0,
        emotions: data.emotions || {
          joy: 0,
          sadness: 0,
          anger: 0,
          fear: 0,
          surprise: 0
        }
      }
    } catch (error) {
      // Fallback sentiment
      return {
        messageId,
        sentiment: 'neutral',
        score: 0,
        emotions: { joy: 0, sadness: 0, anger: 0, fear: 0, surprise: 0 }
      }
    }
  }

  // Auto-classify conversation
  async classifyConversation(conversation: Conversation): Promise<AutoClassification> {
    const categories = [
      'Technical Support',
      'General Chat',
      'Creative Writing',
      'Code Development',
      'Learning & Education',
      'Business & Strategy',
      'Research',
      'Entertainment'
    ]

    const conversationText = conversation.messages
      .map(m => m.content)
      .join('\n')
      .slice(0, 1000) // First 1000 chars

    const prompt = `Classify this conversation into one of these categories: ${categories.join(', ')}. Also suggest 3-5 relevant tags. Return JSON with category and tags[]:\n\n${conversationText}`

    try {
      const response = await this.callAI(prompt)
      const data = this.parseJSON(response)

      return {
        conversationId: conversation.id,
        category: data.category || 'General Chat',
        tags: data.tags || [],
        confidence: data.confidence || 0.8
      }
    } catch (error) {
      return {
        conversationId: conversation.id,
        category: 'General Chat',
        tags: [],
        confidence: 0.5
      }
    }
  }

  // Generate smart recommendations
  async generateRecommendations(
    userId: string,
    context: {
      recentConversations?: Conversation[]
      currentTopic?: string
      userPreferences?: any
    }
  ): Promise<SmartRecommendation[]> {
    const recommendations: SmartRecommendation[] = []

    // Analyze recent conversations for patterns
    if (context.recentConversations) {
      const topics = new Set<string>()
      const models = new Map<string, number>()

      context.recentConversations.forEach(conv => {
        // Count model usage
        const model = conv.model
        models.set(model, (models.get(model) || 0) + 1)
      })

      // Recommend most used model
      const mostUsedModel = Array.from(models.entries())
        .sort((a, b) => b[1] - a[1])[0]

      if (mostUsedModel) {
        recommendations.push({
          type: 'model',
          itemId: mostUsedModel[0],
          reason: `You've used this model ${mostUsedModel[1]} times recently`,
          confidence: 0.9
        })
      }
    }

    // Recommend prompts based on current topic
    if (context.currentTopic) {
      recommendations.push({
        type: 'prompt',
        itemId: 'system_prompt_1',
        reason: `Relevant to "${context.currentTopic}"`,
        confidence: 0.75
      })
    }

    return recommendations
  }

  // Batch analyze multiple messages
  async batchAnalyzeMessages(messages: Message[]): Promise<{
    keywords: Map<string, KeywordExtraction>
    sentiments: Map<string, SentimentAnalysis>
  }> {
    const keywords = new Map<string, KeywordExtraction>()
    const sentiments = new Map<string, SentimentAnalysis>()

    await Promise.all(
      messages.map(async (message) => {
        const [kw, sent] = await Promise.all([
          this.extractKeywords(message.id, message.content),
          this.analyzeSentiment(message.id, message.content)
        ])
        keywords.set(message.id, kw)
        sentiments.set(message.id, sent)
      })
    )

    return { keywords, sentiments }
  }

  // Private helper methods
  private async callAI(prompt: string): Promise<string> {
    // This should integrate with your existing AI service
    // For now, return mock response
    return JSON.stringify({
      summary: 'This is an AI-generated summary',
      keyPoints: ['Point 1', 'Point 2', 'Point 3'],
      topics: ['AI', 'Technology'],
      keywords: ['AI', 'summary', 'keywords'],
      sentiment: 'positive',
      score: 0.7,
      category: 'Technical Support'
    })
  }

  private parseJSON(text: string): any {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                       text.match(/```\s*([\s\S]*?)\s*```/)

      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }

      return JSON.parse(text)
    } catch (error) {
      console.error('Failed to parse JSON:', error)
      return {}
    }
  }

  private extractSummary(response: string): string {
    const data = this.parseJSON(response)
    return data.summary || 'Summary not available'
  }

  private extractKeyPoints(response: string): string[] {
    const data = this.parseJSON(response)
    return data.keyPoints || []
  }

  private extractTopics(response: string): string[] {
    const data = this.parseJSON(response)
    return data.topics || []
  }

  private simpleKeywordExtraction(text: string): string[] {
    // Simple keyword extraction using word frequency
    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 4)

    const stopWords = new Set([
      'their', 'there', 'these', 'those', 'would', 'could', 'should',
      'which', 'while', 'where', 'about', 'after', 'before'
    ])

    const wordFreq = new Map<string, number>()
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
      }
    })

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word)
  }
}

export const aiEnhancementService = new AIEnhancementService()
export default aiEnhancementService
