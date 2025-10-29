/**
 * Prompt 库管理服务
 *
 * 功能:
 * - Prompt 存储和管理
 * - 分类和标签
 * - 搜索和过滤
 * - 变量插值
 * - 导入/导出
 */

export interface PromptTemplate {
  id: string
  name: string
  description: string
  content: string
  variables: string[] // 变量占位符，如 {{name}}, {{topic}}
  category: PromptCategory
  tags: string[]
  author?: string
  isPublic: boolean
  usageCount: number
  rating?: number
  createdAt: number
  updatedAt: number
}

export type PromptCategory =
  | 'writing'
  | 'coding'
  | 'analysis'
  | 'creative'
  | 'business'
  | 'education'
  | 'translation'
  | 'summary'
  | 'other'

export const CATEGORY_INFO: Record<PromptCategory, { name: string; description: string }> = {
  writing: { name: '写作', description: '文章、文案、创作' },
  coding: { name: '编程', description: '代码生成、调试、优化' },
  analysis: { name: '分析', description: '数据分析、逻辑推理' },
  creative: { name: '创意', description: '头脑风暴、创新想法' },
  business: { name: '商务', description: '商业计划、市场分析' },
  education: { name: '教育', description: '学习辅导、知识讲解' },
  translation: { name: '翻译', description: '语言翻译、本地化' },
  summary: { name: '总结', description: '内容总结、提炼要点' },
  other: { name: '其他', description: '其他类型' }
}

// 内置 Prompt 模板库
export const BUILTIN_PROMPTS: PromptTemplate[] = [
  {
    id: 'prompt_article_writer',
    name: '文章写作助手',
    description: '帮助撰写高质量文章',
    content: `请以专业作者的身份，撰写一篇关于"{{topic}}"的文章。

要求:
- 目标读者: {{audience}}
- 文章长度: {{length}} 字
- 语言风格: {{style}}
- 包含实例和数据支持
- 结构清晰，逻辑连贯

请开始撰写。`,
    variables: ['topic', 'audience', 'length', 'style'],
    category: 'writing',
    tags: ['文章', '写作', '创作'],
    isPublic: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'prompt_code_reviewer',
    name: '代码审查专家',
    description: '深度审查代码质量',
    content: `作为资深软件工程师，请审查以下 {{language}} 代码:

\`\`\`{{language}}
{{code}}
\`\`\`

请从以下角度分析:
1. 代码质量和可读性
2. 性能优化建议
3. 潜在的 Bug 和安全问题
4. 最佳实践建议
5. 重构建议（如有必要）`,
    variables: ['language', 'code'],
    category: 'coding',
    tags: ['代码审查', '质量', '优化'],
    isPublic: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'prompt_business_plan',
    name: '商业计划生成器',
    description: '生成商业计划书',
    content: `请为"{{business_idea}}"这个商业想法撰写一份完整的商业计划书。

包含以下部分:
1. 执行摘要
2. 市场分析（目标市场: {{target_market}}）
3. 竞争分析
4. 产品/服务描述
5. 营销策略
6. 运营计划
7. 财务预测
8. 风险评估

预算范围: {{budget}}
时间框架: {{timeframe}}`,
    variables: ['business_idea', 'target_market', 'budget', 'timeframe'],
    category: 'business',
    tags: ['商业计划', '创业', '分析'],
    isPublic: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'prompt_learning_tutor',
    name: '学习导师',
    description: '个性化学习辅导',
    content: `我想学习"{{subject}}"，我目前的水平是{{level}}。

请为我制定一个学习计划:
1. 学习目标和里程碑
2. 推荐的学习资源
3. 每日学习任务
4. 练习题和项目建议
5. 评估方法

学习时长: {{duration}}
每日可投入时间: {{daily_time}}`,
    variables: ['subject', 'level', 'duration', 'daily_time'],
    category: 'education',
    tags: ['学习', '教育', '辅导'],
    isPublic: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'prompt_translation',
    name: '专业翻译',
    description: '高质量翻译服务',
    content: `请将以下{{source_lang}}文本翻译成{{target_lang}}:

{{text}}

要求:
- 保持原文的语气和风格
- 使用地道的表达
- 必要时提供文化背景说明
- 专业术语准确翻译`,
    variables: ['source_lang', 'target_lang', 'text'],
    category: 'translation',
    tags: ['翻译', '语言', '本地化'],
    isPublic: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'prompt_summarizer',
    name: '智能总结器',
    description: '提炼内容要点',
    content: `请总结以下内容，提炼核心要点:

{{content}}

总结要求:
- 长度: {{summary_length}} 字以内
- 格式: {{format}} (段落/要点列表/表格)
- 包含关键数据和结论
- 保持客观准确`,
    variables: ['content', 'summary_length', 'format'],
    category: 'summary',
    tags: ['总结', '提炼', '要点'],
    isPublic: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'prompt_brainstorming',
    name: '创意头脑风暴',
    description: '激发创新思维',
    content: `让我们为"{{problem}}"进行创意头脑风暴！

请提供:
1. 10 个创新解决方案
2. 每个方案的优缺点
3. 实施难度评估
4. 最具潜力的 3 个方案详细说明

背景信息: {{context}}
限制条件: {{constraints}}`,
    variables: ['problem', 'context', 'constraints'],
    category: 'creative',
    tags: ['创意', '头脑风暴', '创新'],
    isPublic: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'prompt_data_analysis',
    name: '数据分析师',
    description: '深度数据分析',
    content: `作为数据分析专家，请分析以下数据:

{{data}}

分析维度:
1. 数据概览和统计特征
2. 趋势和模式识别
3. 异常值检测
4. 相关性分析
5. 可视化建议
6. 结论和建议

分析重点: {{focus}}`,
    variables: ['data', 'focus'],
    category: 'analysis',
    tags: ['数据分析', '统计', '洞察'],
    isPublic: true,
    usageCount: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
]

class PromptLibraryService {
  private storageKey = 'prompt-library'

  /**
   * 获取所有 Prompt
   */
  async getAllPrompts(): Promise<PromptTemplate[]> {
    const stored = localStorage.getItem(this.storageKey)
    const customPrompts = stored ? JSON.parse(stored) : []
    return [...BUILTIN_PROMPTS, ...customPrompts]
  }

  /**
   * 按分类获取 Prompt
   */
  async getPromptsByCategory(category: PromptCategory): Promise<PromptTemplate[]> {
    const all = await this.getAllPrompts()
    return all.filter(p => p.category === category)
  }

  /**
   * 搜索 Prompt
   */
  async searchPrompts(query: string): Promise<PromptTemplate[]> {
    const all = await this.getAllPrompts()
    const lowerQuery = query.toLowerCase()

    return all.filter(
      p =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.description.toLowerCase().includes(lowerQuery) ||
        p.content.toLowerCase().includes(lowerQuery) ||
        p.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  /**
   * 创建自定义 Prompt
   */
  async createPrompt(prompt: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): Promise<PromptTemplate> {
    const newPrompt: PromptTemplate = {
      ...prompt,
      id: `prompt_custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }

    const all = await this.getAllPrompts()
    const customPrompts = all.filter(p => !p.id.startsWith('prompt_'))
    customPrompts.push(newPrompt)

    localStorage.setItem(this.storageKey, JSON.stringify(customPrompts))
    return newPrompt
  }

  /**
   * 更新 Prompt
   */
  async updatePrompt(id: string, updates: Partial<PromptTemplate>): Promise<PromptTemplate | null> {
    const all = await this.getAllPrompts()
    const index = all.findIndex(p => p.id === id)

    if (index === -1) return null

    const updated = {
      ...all[index],
      ...updates,
      updatedAt: Date.now()
    }

    all[index] = updated

    const customPrompts = all.filter(p => p.id.startsWith('prompt_custom_'))
    localStorage.setItem(this.storageKey, JSON.stringify(customPrompts))

    return updated
  }

  /**
   * 删除 Prompt
   */
  async deletePrompt(id: string): Promise<boolean> {
    // 不能删除内置 Prompt
    if (BUILTIN_PROMPTS.some(p => p.id === id)) {
      return false
    }

    const all = await this.getAllPrompts()
    const filtered = all.filter(p => p.id !== id && p.id.startsWith('prompt_custom_'))

    localStorage.setItem(this.storageKey, JSON.stringify(filtered))
    return true
  }

  /**
   * 应用变量到 Prompt
   */
  applyVariables(prompt: PromptTemplate, variables: Record<string, string>): string {
    let result = prompt.content

    prompt.variables.forEach(varName => {
      const value = variables[varName] || `[${varName}]`
      result = result.replace(new RegExp(`{{${varName}}}`, 'g'), value)
    })

    return result
  }

  /**
   * 增加使用计数
   */
  async incrementUsage(id: string): Promise<void> {
    const all = await this.getAllPrompts()
    const prompt = all.find(p => p.id === id)

    if (prompt) {
      await this.updatePrompt(id, {
        usageCount: prompt.usageCount + 1
      })
    }
  }

  /**
   * 导出 Prompt
   */
  exportPrompts(prompts: PromptTemplate[]): void {
    const blob = new Blob([JSON.stringify(prompts, null, 2)], {
      type: 'application/json'
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `prompts_${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  /**
   * 导入 Prompt
   */
  async importPrompts(file: File): Promise<PromptTemplate[]> {
    const text = await file.text()
    const prompts = JSON.parse(text) as PromptTemplate[]

    const all = await this.getAllPrompts()
    const customPrompts = all.filter(p => p.id.startsWith('prompt_custom_'))

    prompts.forEach(p => {
      if (!customPrompts.some(cp => cp.id === p.id)) {
        customPrompts.push(p)
      }
    })

    localStorage.setItem(this.storageKey, JSON.stringify(customPrompts))
    return prompts
  }
}

export const promptLibraryService = new PromptLibraryService()
export default promptLibraryService
