import { EventEmitter } from '@/utils/EventEmitter'

interface TrainingDataItem {
  id: string
  input: string
  output: string
  category: string
  quality: 'high' | 'medium' | 'low'
  timestamp: Date
  metadata?: {
    source?: string
    tags?: string[]
    verified?: boolean
    difficulty?: 'easy' | 'medium' | 'hard'
    language?: string
  }
}

interface TrainingDataset {
  id: string
  name: string
  description: string
  items: TrainingDataItem[]
  createdAt: Date
  updatedAt: Date
  version: string
  status: 'draft' | 'validated' | 'ready' | 'training' | 'completed'
  validationResults?: {
    passRate: number
    coverage: number
    issues: string[]
  }
  statistics: {
    totalItems: number
    qualityDistribution: Record<string, number>
    categoryDistribution: Record<string, number>
    avgInputLength: number
    avgOutputLength: number
  }
}

interface FineTuningJob {
  id: string
  name: string
  modelId: string
  baseModel: string
  datasetId: string
  status: 'pending' | 'preparing' | 'training' | 'validating' | 'completed' | 'failed' | 'cancelled'
  progress: number
  startTime?: Date
  endTime?: Date
  estimatedDuration?: number
  config: {
    epochs: number
    batchSize: number
    learningRate: number
    validationSplit: number
    earlyStoppingPatience: number
    maxTrainingTime: number // minutes
    optimizer: 'adam' | 'sgd' | 'rmsprop'
    lossFunction: 'cross_entropy' | 'mse' | 'mae'
  }
  metrics: {
    loss: number[]
    accuracy: number[]
    validationLoss: number[]
    validationAccuracy: number[]
    perplexity?: number[]
    bleuScore?: number[]
  }
  logs: TrainingLog[]
  resultModel?: {
    id: string
    name: string
    size: number
    performance: {
      accuracy: number
      f1Score: number
      inferenceSpeed: number // tokens/second
      memoryUsage: number // MB
    }
  }
}

interface TrainingLog {
  timestamp: Date
  level: 'info' | 'warning' | 'error' | 'debug'
  message: string
  epoch?: number
  batch?: number
  metrics?: Record<string, number>
}

interface ModelEvaluation {
  id: string
  modelId: string
  testDatasetId: string
  timestamp: Date
  results: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    perplexity?: number
    bleuScore?: number
    rougeScore?: number
  }
  benchmarks: {
    inferenceSpeed: number // tokens/second
    memoryUsage: number // MB
    cpuUsage: number // %
    responseTime: number // ms
  }
  qualitativeResults: {
    coherence: number // 1-10
    relevance: number // 1-10
    fluency: number // 1-10
    creativity: number // 1-10
  }
  testCases: Array<{
    input: string
    expectedOutput: string
    actualOutput: string
    score: number
    notes?: string
  }>
}

interface TrainingTemplate {
  id: string
  name: string
  description: string
  category: 'chatbot' | 'text_completion' | 'classification' | 'summarization' | 'translation' | 'code_generation'
  config: FineTuningJob['config']
  dataRequirements: {
    minSamples: number
    maxSamples: number
    requiredFields: string[]
    format: 'chat' | 'completion' | 'classification'
  }
  preProcessing: {
    tokenization: boolean
    normalization: boolean
    augmentation: boolean
    filtering: boolean
  }
}

interface ModelVersionControl {
  modelId: string
  versions: Array<{
    version: string
    timestamp: Date
    changes: string
    performance: Record<string, number>
    size: number
    trainingJobId?: string
  }>
  currentVersion: string
  branches: Array<{
    name: string
    version: string
    description: string
  }>
}

class ModelTrainingService extends EventEmitter {
  private static instance: ModelTrainingService
  private datasets: Map<string, TrainingDataset> = new Map()
  private trainingJobs: Map<string, FineTuningJob> = new Map()
  private evaluations: Map<string, ModelEvaluation> = new Map()
  private templates: TrainingTemplate[] = []
  private versionControl: Map<string, ModelVersionControl> = new Map()
  private isInitialized = false

  constructor() {
    super()
    this.initializeTemplates()
  }

  static getInstance(): ModelTrainingService {
    if (!ModelTrainingService.instance) {
      ModelTrainingService.instance = new ModelTrainingService()
    }
    return ModelTrainingService.instance
  }

  async initialize(): Promise<void> {
    try {
      await this.loadStoredData()
      this.isInitialized = true
      this.emit('initialized')
    } catch (error) {
      console.error('Failed to initialize model training service:', error)
      throw error
    }
  }

  private async loadStoredData(): Promise<void> {
    // Load datasets
    const storedDatasets = localStorage.getItem('training_datasets')
    if (storedDatasets) {
      const datasets = JSON.parse(storedDatasets)
      datasets.forEach((dataset: any) => {
        this.datasets.set(dataset.id, {
          ...dataset,
          createdAt: new Date(dataset.createdAt),
          updatedAt: new Date(dataset.updatedAt),
          items: dataset.items.map((item: any) => ({
            ...item,
            timestamp: new Date(item.timestamp)
          }))
        })
      })
    }

    // Load training jobs
    const storedJobs = localStorage.getItem('training_jobs')
    if (storedJobs) {
      const jobs = JSON.parse(storedJobs)
      jobs.forEach((job: any) => {
        this.trainingJobs.set(job.id, {
          ...job,
          startTime: job.startTime ? new Date(job.startTime) : undefined,
          endTime: job.endTime ? new Date(job.endTime) : undefined,
          logs: job.logs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          }))
        })
      })
    }

    // Load evaluations
    const storedEvaluations = localStorage.getItem('model_evaluations')
    if (storedEvaluations) {
      const evaluations = JSON.parse(storedEvaluations)
      evaluations.forEach((evaluation: any) => {
        this.evaluations.set(evaluation.id, {
          ...evaluation,
          timestamp: new Date(evaluation.timestamp)
        })
      })
    }
  }

  private initializeTemplates(): void {
    this.templates = [
      {
        id: 'chatbot',
        name: '聊天机器人',
        description: '训练对话型AI助手，提供自然流畅的多轮对话能力',
        category: 'chatbot',
        config: {
          epochs: 3,
          batchSize: 4,
          learningRate: 0.00005,
          validationSplit: 0.2,
          earlyStoppingPatience: 2,
          maxTrainingTime: 180,
          optimizer: 'adam',
          lossFunction: 'cross_entropy'
        },
        dataRequirements: {
          minSamples: 100,
          maxSamples: 10000,
          requiredFields: ['input', 'output'],
          format: 'chat'
        },
        preProcessing: {
          tokenization: true,
          normalization: true,
          augmentation: false,
          filtering: true
        }
      },
      {
        id: 'text_completion',
        name: '文本补全',
        description: '训练文本续写和补全模型，适用于创意写作和内容生成',
        category: 'text_completion',
        config: {
          epochs: 5,
          batchSize: 8,
          learningRate: 0.0001,
          validationSplit: 0.15,
          earlyStoppingPatience: 3,
          maxTrainingTime: 240,
          optimizer: 'adam',
          lossFunction: 'cross_entropy'
        },
        dataRequirements: {
          minSamples: 200,
          maxSamples: 50000,
          requiredFields: ['input', 'output'],
          format: 'completion'
        },
        preProcessing: {
          tokenization: true,
          normalization: true,
          augmentation: true,
          filtering: true
        }
      },
      {
        id: 'classification',
        name: '文本分类',
        description: '训练文本分类模型，用于情感分析、主题分类等任务',
        category: 'classification',
        config: {
          epochs: 10,
          batchSize: 16,
          learningRate: 0.001,
          validationSplit: 0.25,
          earlyStoppingPatience: 5,
          maxTrainingTime: 120,
          optimizer: 'adam',
          lossFunction: 'cross_entropy'
        },
        dataRequirements: {
          minSamples: 500,
          maxSamples: 100000,
          requiredFields: ['input', 'category'],
          format: 'classification'
        },
        preProcessing: {
          tokenization: true,
          normalization: true,
          augmentation: true,
          filtering: true
        }
      },
      {
        id: 'code_generation',
        name: '代码生成',
        description: '训练代码生成模型，提供编程辅助和代码自动完成功能',
        category: 'code_generation',
        config: {
          epochs: 3,
          batchSize: 2,
          learningRate: 0.00003,
          validationSplit: 0.2,
          earlyStoppingPatience: 2,
          maxTrainingTime: 300,
          optimizer: 'adam',
          lossFunction: 'cross_entropy'
        },
        dataRequirements: {
          minSamples: 50,
          maxSamples: 5000,
          requiredFields: ['input', 'output'],
          format: 'completion'
        },
        preProcessing: {
          tokenization: true,
          normalization: false,
          augmentation: false,
          filtering: true
        }
      }
    ]
  }

  // Dataset Management
  async createDataset(name: string, description: string, category: string = 'general'): Promise<TrainingDataset> {
    const dataset: TrainingDataset = {
      id: `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      items: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
      status: 'draft',
      statistics: {
        totalItems: 0,
        qualityDistribution: {},
        categoryDistribution: {},
        avgInputLength: 0,
        avgOutputLength: 0
      }
    }

    this.datasets.set(dataset.id, dataset)
    await this.saveDatasets()
    this.emit('dataset_created', dataset)
    return dataset
  }

  async addTrainingData(datasetId: string, items: Omit<TrainingDataItem, 'id' | 'timestamp'>[]): Promise<void> {
    const dataset = this.datasets.get(datasetId)
    if (!dataset) {
      throw new Error(`Dataset ${datasetId} not found`)
    }

    const newItems: TrainingDataItem[] = items.map(item => ({
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date()
    }))

    dataset.items.push(...newItems)
    dataset.updatedAt = new Date()
    this.updateDatasetStatistics(dataset)

    await this.saveDatasets()
    this.emit('training_data_added', { datasetId, items: newItems })
  }

  async validateDataset(datasetId: string): Promise<void> {
    const dataset = this.datasets.get(datasetId)
    if (!dataset) {
      throw new Error(`Dataset ${datasetId} not found`)
    }

    const issues: string[] = []
    let passedItems = 0

    // Validation checks
    for (const item of dataset.items) {
      let passed = true

      // Check input/output quality
      if (!item.input.trim() || !item.output.trim()) {
        issues.push(`Item ${item.id}: Empty input or output`)
        passed = false
      }

      // Check length constraints
      if (item.input.length < 10 || item.input.length > 2000) {
        issues.push(`Item ${item.id}: Input length out of range (10-2000 chars)`)
        passed = false
      }

      if (item.output.length < 5 || item.output.length > 1000) {
        issues.push(`Item ${item.id}: Output length out of range (5-1000 chars)`)
        passed = false
      }

      // Check for duplicates
      const duplicates = dataset.items.filter(other =>
        other.id !== item.id && other.input.toLowerCase() === item.input.toLowerCase()
      )
      if (duplicates.length > 0) {
        issues.push(`Item ${item.id}: Duplicate input found`)
        passed = false
      }

      if (passed) passedItems++
    }

    const passRate = dataset.items.length > 0 ? passedItems / dataset.items.length : 0
    const coverage = this.calculateCategoryCoverage(dataset)

    dataset.validationResults = {
      passRate,
      coverage,
      issues
    }

    dataset.status = passRate >= 0.8 && coverage >= 0.6 ? 'validated' : 'draft'
    dataset.updatedAt = new Date()

    await this.saveDatasets()
    this.emit('dataset_validated', { datasetId, results: dataset.validationResults })
  }

  private calculateCategoryCoverage(dataset: TrainingDataset): number {
    const categories = new Set(dataset.items.map(item => item.category))
    const expectedCategories = 5 // Assume we want at least 5 categories for good coverage
    return Math.min(categories.size / expectedCategories, 1.0)
  }

  private updateDatasetStatistics(dataset: TrainingDataset): void {
    const stats = dataset.statistics

    stats.totalItems = dataset.items.length

    // Quality distribution
    stats.qualityDistribution = {}
    dataset.items.forEach(item => {
      stats.qualityDistribution[item.quality] = (stats.qualityDistribution[item.quality] || 0) + 1
    })

    // Category distribution
    stats.categoryDistribution = {}
    dataset.items.forEach(item => {
      stats.categoryDistribution[item.category] = (stats.categoryDistribution[item.category] || 0) + 1
    })

    // Average lengths
    if (stats.totalItems > 0) {
      stats.avgInputLength = dataset.items.reduce((sum, item) => sum + item.input.length, 0) / stats.totalItems
      stats.avgOutputLength = dataset.items.reduce((sum, item) => sum + item.output.length, 0) / stats.totalItems
    }
  }

  // Fine-tuning Management
  async startFineTuning(
    name: string,
    baseModel: string,
    datasetId: string,
    templateId?: string,
    customConfig?: Partial<FineTuningJob['config']>
  ): Promise<FineTuningJob> {
    const dataset = this.datasets.get(datasetId)
    if (!dataset || dataset.status !== 'validated') {
      throw new Error('Dataset not found or not validated')
    }

    const template = templateId ? this.templates.find(t => t.id === templateId) : this.templates[0]
    if (!template) {
      throw new Error('Training template not found')
    }

    const job: FineTuningJob = {
      id: `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      modelId: `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      baseModel,
      datasetId,
      status: 'pending',
      progress: 0,
      config: { ...template.config, ...customConfig },
      metrics: {
        loss: [],
        accuracy: [],
        validationLoss: [],
        validationAccuracy: []
      },
      logs: []
    }

    this.trainingJobs.set(job.id, job)
    await this.saveTrainingJobs()

    // Start training simulation
    this.simulateTraining(job.id)

    this.emit('training_started', job)
    return job
  }

  private async simulateTraining(jobId: string): Promise<void> {
    const job = this.trainingJobs.get(jobId)
    if (!job) return

    job.status = 'preparing'
    job.startTime = new Date()
    this.addTrainingLog(job, 'info', 'Starting model preparation...')

    // Simulate preparation
    await this.sleep(2000)
    job.status = 'training'
    job.progress = 5
    this.addTrainingLog(job, 'info', 'Training started')

    // Simulate training epochs
    for (let epoch = 1; epoch <= job.config.epochs; epoch++) {
      this.addTrainingLog(job, 'info', `Starting epoch ${epoch}/${job.config.epochs}`)

      for (let batch = 1; batch <= 10; batch++) {
        await this.sleep(500)

        const progress = ((epoch - 1) * 10 + batch) / (job.config.epochs * 10) * 80 + 5
        job.progress = Math.min(progress, 85)

        // Simulate metrics
        const loss = Math.max(0.1, 2.0 - (epoch * 0.3) + (Math.random() - 0.5) * 0.2)
        const accuracy = Math.min(0.98, 0.3 + (epoch * 0.15) + (Math.random() - 0.5) * 0.1)
        const valLoss = loss + (Math.random() - 0.5) * 0.1
        const valAccuracy = accuracy - (Math.random() * 0.05)

        job.metrics.loss.push(loss)
        job.metrics.accuracy.push(accuracy)
        job.metrics.validationLoss.push(valLoss)
        job.metrics.validationAccuracy.push(valAccuracy)

        this.addTrainingLog(job, 'debug', `Epoch ${epoch}, Batch ${batch}: Loss=${loss.toFixed(4)}, Acc=${accuracy.toFixed(4)}`, epoch, batch, {
          loss, accuracy, validationLoss: valLoss, validationAccuracy: valAccuracy
        })

        this.emit('training_progress', { jobId, progress: job.progress, metrics: job.metrics })
      }
    }

    // Validation phase
    job.status = 'validating'
    job.progress = 90
    this.addTrainingLog(job, 'info', 'Starting model validation...')
    await this.sleep(3000)

    // Complete training
    job.status = 'completed'
    job.progress = 100
    job.endTime = new Date()
    job.resultModel = {
      id: job.modelId,
      name: `${job.name} - Trained Model`,
      size: Math.floor(Math.random() * 500 + 100), // 100-600 MB
      performance: {
        accuracy: job.metrics.validationAccuracy[job.metrics.validationAccuracy.length - 1] || 0.85,
        f1Score: Math.random() * 0.2 + 0.8,
        inferenceSpeed: Math.floor(Math.random() * 50 + 20), // 20-70 tokens/sec
        memoryUsage: Math.floor(Math.random() * 200 + 100) // 100-300 MB
      }
    }

    this.addTrainingLog(job, 'info', `Training completed successfully. Final accuracy: ${job.resultModel.performance.accuracy.toFixed(4)}`)

    await this.saveTrainingJobs()
    this.emit('training_completed', job)
  }

  private addTrainingLog(
    job: FineTuningJob,
    level: TrainingLog['level'],
    message: string,
    epoch?: number,
    batch?: number,
    metrics?: Record<string, number>
  ): void {
    job.logs.push({
      timestamp: new Date(),
      level,
      message,
      epoch,
      batch,
      metrics
    })
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async cancelTraining(jobId: string): Promise<void> {
    const job = this.trainingJobs.get(jobId)
    if (!job) {
      throw new Error(`Training job ${jobId} not found`)
    }

    if (['completed', 'failed', 'cancelled'].includes(job.status)) {
      throw new Error(`Cannot cancel job in ${job.status} status`)
    }

    job.status = 'cancelled'
    job.endTime = new Date()
    this.addTrainingLog(job, 'warning', 'Training cancelled by user')

    await this.saveTrainingJobs()
    this.emit('training_cancelled', job)
  }

  // Model Evaluation
  async evaluateModel(modelId: string, testDatasetId: string): Promise<ModelEvaluation> {
    const testDataset = this.datasets.get(testDatasetId)
    if (!testDataset) {
      throw new Error(`Test dataset ${testDatasetId} not found`)
    }

    const evaluation: ModelEvaluation = {
      id: `eval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      modelId,
      testDatasetId,
      timestamp: new Date(),
      results: {
        accuracy: Math.random() * 0.3 + 0.7, // 0.7-1.0
        precision: Math.random() * 0.25 + 0.75,
        recall: Math.random() * 0.25 + 0.75,
        f1Score: Math.random() * 0.25 + 0.75,
        perplexity: Math.random() * 5 + 3, // 3-8
        bleuScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
        rougeScore: Math.random() * 0.3 + 0.7
      },
      benchmarks: {
        inferenceSpeed: Math.floor(Math.random() * 40 + 20),
        memoryUsage: Math.floor(Math.random() * 150 + 100),
        cpuUsage: Math.floor(Math.random() * 30 + 20),
        responseTime: Math.floor(Math.random() * 200 + 100)
      },
      qualitativeResults: {
        coherence: Math.floor(Math.random() * 3 + 8), // 8-10
        relevance: Math.floor(Math.random() * 3 + 8),
        fluency: Math.floor(Math.random() * 3 + 8),
        creativity: Math.floor(Math.random() * 4 + 7) // 7-10
      },
      testCases: testDataset.items.slice(0, 10).map(item => ({
        input: item.input,
        expectedOutput: item.output,
        actualOutput: this.simulateModelOutput(item.input),
        score: Math.random() * 0.4 + 0.6
      }))
    }

    this.evaluations.set(evaluation.id, evaluation)
    await this.saveEvaluations()
    this.emit('model_evaluated', evaluation)
    return evaluation
  }

  private simulateModelOutput(input: string): string {
    // Simple simulation of model output
    const responses = [
      "这是一个很好的问题。让我来为您详细解答...",
      "根据您的描述，我认为最好的方法是...",
      "我理解您的需求，建议您可以尝试...",
      "这个话题很有趣，从我的理解来看...",
      "基于现有的信息，我的建议是..."
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  // Data Management
  getDatasets(): TrainingDataset[] {
    return Array.from(this.datasets.values())
  }

  getDataset(id: string): TrainingDataset | undefined {
    return this.datasets.get(id)
  }

  getTrainingJobs(): FineTuningJob[] {
    return Array.from(this.trainingJobs.values())
  }

  getTrainingJob(id: string): FineTuningJob | undefined {
    return this.trainingJobs.get(id)
  }

  getEvaluations(): ModelEvaluation[] {
    return Array.from(this.evaluations.values())
  }

  getTemplates(): TrainingTemplate[] {
    return [...this.templates]
  }

  // Storage
  private async saveDatasets(): Promise<void> {
    const datasets = Array.from(this.datasets.values())
    localStorage.setItem('training_datasets', JSON.stringify(datasets))
  }

  private async saveTrainingJobs(): Promise<void> {
    const jobs = Array.from(this.trainingJobs.values())
    localStorage.setItem('training_jobs', JSON.stringify(jobs))
  }

  private async saveEvaluations(): Promise<void> {
    const evaluations = Array.from(this.evaluations.values())
    localStorage.setItem('model_evaluations', JSON.stringify(evaluations))
  }

  // Utilities
  generateTrainingReport(jobId: string): string {
    const job = this.trainingJobs.get(jobId)
    if (!job) return 'Job not found'

    return `
训练报告 - ${job.name}
====================

基础信息:
- 模型ID: ${job.modelId}
- 基础模型: ${job.baseModel}
- 数据集: ${job.datasetId}
- 状态: ${job.status}
- 训练时间: ${job.startTime?.toLocaleString()} - ${job.endTime?.toLocaleString()}

配置参数:
- 训练轮数: ${job.config.epochs}
- 批次大小: ${job.config.batchSize}
- 学习率: ${job.config.learningRate}
- 验证比例: ${job.config.validationSplit}

训练结果:
${job.resultModel ? `
- 最终准确率: ${job.resultModel.performance.accuracy.toFixed(4)}
- F1分数: ${job.resultModel.performance.f1Score.toFixed(4)}
- 推理速度: ${job.resultModel.performance.inferenceSpeed} tokens/sec
- 内存使用: ${job.resultModel.performance.memoryUsage} MB
- 模型大小: ${job.resultModel.size} MB
` : '训练未完成'}

训练日志摘要:
${job.logs.slice(-5).map(log => `[${log.timestamp.toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}`).join('\n')}
    `.trim()
  }

  async exportDataset(datasetId: string, format: 'json' | 'csv' | 'jsonl' = 'json'): Promise<string> {
    const dataset = this.datasets.get(datasetId)
    if (!dataset) {
      throw new Error(`Dataset ${datasetId} not found`)
    }

    switch (format) {
      case 'json':
        return JSON.stringify(dataset, null, 2)

      case 'csv':
        const headers = 'id,input,output,category,quality,timestamp'
        const rows = dataset.items.map(item =>
          `"${item.id}","${item.input.replace(/"/g, '""')}","${item.output.replace(/"/g, '""')}","${item.category}","${item.quality}","${item.timestamp.toISOString()}"`
        )
        return [headers, ...rows].join('\n')

      case 'jsonl':
        return dataset.items.map(item => JSON.stringify(item)).join('\n')

      default:
        throw new Error(`Unsupported format: ${format}`)
    }
  }

  async importDataset(data: string, format: 'json' | 'csv' | 'jsonl', datasetId?: string): Promise<TrainingDataset> {
    let items: Omit<TrainingDataItem, 'id' | 'timestamp'>[] = []

    try {
      switch (format) {
        case 'json':
          const jsonData = JSON.parse(data)
          items = Array.isArray(jsonData) ? jsonData : jsonData.items || []
          break

        case 'jsonl':
          items = data.split('\n').filter(line => line.trim()).map(line => JSON.parse(line))
          break

        case 'csv':
          const lines = data.split('\n')
          const headers = lines[0].split(',').map(h => h.replace(/"/g, ''))
          items = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.replace(/"/g, ''))
            return {
              input: values[headers.indexOf('input')] || '',
              output: values[headers.indexOf('output')] || '',
              category: values[headers.indexOf('category')] || 'general',
              quality: (values[headers.indexOf('quality')] as any) || 'medium'
            }
          }).filter(item => item.input && item.output)
          break
      }

      if (datasetId && this.datasets.has(datasetId)) {
        await this.addTrainingData(datasetId, items)
        return this.datasets.get(datasetId)!
      } else {
        const dataset = await this.createDataset(
          `Imported Dataset ${new Date().toLocaleString()}`,
          `Imported from ${format.toUpperCase()} file`,
          'imported'
        )
        await this.addTrainingData(dataset.id, items)
        return dataset
      }
    } catch (error) {
      throw new Error(`Failed to import dataset: ${error}`)
    }
  }

  isReady(): boolean {
    return this.isInitialized
  }
}

export default ModelTrainingService.getInstance()
export {
  ModelTrainingService,
  type TrainingDataset,
  type TrainingDataItem,
  type FineTuningJob,
  type ModelEvaluation,
  type TrainingTemplate,
  type TrainingLog
}