import { BatchJob, BatchJobResult, ChatConfig } from '../types'
import localforage from 'localforage'
import toast from 'react-hot-toast'

class BatchProcessingService {
  private readonly BATCH_JOBS_KEY = 'batch_jobs'
  private activeJobs = new Map<string, BatchJob>()

  // Create and run batch job
  async createBatchJob(
    name: string,
    prompts: string[],
    model: string,
    config: ChatConfig,
    onProgress?: (progress: number) => void
  ): Promise<BatchJob> {
    const job: BatchJob = {
      id: `batch_${Date.now()}`,
      name,
      prompts,
      model,
      config,
      status: 'pending',
      results: [],
      createdAt: Date.now(),
      progress: 0
    }

    this.activeJobs.set(job.id, job)
    await this.saveBatchJob(job)

    // Start processing in background
    this.processBatchJob(job, onProgress).catch(console.error)

    return job
  }

  private async processBatchJob(
    job: BatchJob,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    const updatedJob = this.activeJobs.get(job.id)!
    updatedJob.status = 'running'
    await this.saveBatchJob(updatedJob)

    const results: BatchJobResult[] = []

    for (let i = 0; i < job.prompts.length; i++) {
      const prompt = job.prompts[i]
      const startTime = Date.now()

      try {
        // Call AI service (would use your actual AI service)
        const response = await this.callAI(prompt, job.model, job.config)

        results.push({
          promptIndex: i,
          prompt,
          response: response.content,
          tokens: response.tokens,
          duration: Date.now() - startTime
        })
      } catch (error: any) {
        results.push({
          promptIndex: i,
          prompt,
          response: '',
          tokens: 0,
          duration: Date.now() - startTime,
          error: error.message
        })
      }

      // Update progress
      const progress = ((i + 1) / job.prompts.length) * 100
      updatedJob.progress = progress
      updatedJob.results = results
      await this.saveBatchJob(updatedJob)

      if (onProgress) {
        onProgress(progress)
      }
    }

    updatedJob.status = 'completed'
    updatedJob.completedAt = Date.now()
    updatedJob.results = results
    await this.saveBatchJob(updatedJob)

    toast.success(`Batch job "${job.name}" completed!`)
  }

  // Get batch job by ID
  async getBatchJob(jobId: string): Promise<BatchJob | null> {
    const jobs = await this.getAllBatchJobs()
    return jobs.find(j => j.id === jobId) || null
  }

  // Get all batch jobs
  async getAllBatchJobs(): Promise<BatchJob[]> {
    return (await localforage.getItem<BatchJob[]>(this.BATCH_JOBS_KEY)) || []
  }

  // Delete batch job
  async deleteBatchJob(jobId: string): Promise<void> {
    const jobs = await this.getAllBatchJobs()
    const filtered = jobs.filter(j => j.id !== jobId)
    await localforage.setItem(this.BATCH_JOBS_KEY, filtered)
    this.activeJobs.delete(jobId)
  }

  // Export results to CSV
  exportResultsToCSV(job: BatchJob): string {
    const headers = ['Index', 'Prompt', 'Response', 'Tokens', 'Duration (ms)', 'Error']
    const rows = job.results.map(r => [
      r.promptIndex.toString(),
      `"${r.prompt.replace(/"/g, '""')}"`,
      `"${r.response.replace(/"/g, '""')}"`,
      r.tokens.toString(),
      r.duration.toString(),
      r.error || ''
    ])

    const csv = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n')

    return csv
  }

  // Export results to JSON
  exportResultsToJSON(job: BatchJob): string {
    return JSON.stringify(job, null, 2)
  }

  // Pause batch job
  async pauseBatchJob(jobId: string): Promise<void> {
    const job = this.activeJobs.get(jobId)
    if (job) {
      job.status = 'paused' as any
      await this.saveBatchJob(job)
    }
  }

  // Get statistics
  getJobStatistics(job: BatchJob): {
    totalPrompts: number
    completed: number
    failed: number
    totalTokens: number
    avgDuration: number
    totalDuration: number
  } {
    const completed = job.results.filter(r => !r.error).length
    const failed = job.results.filter(r => r.error).length
    const totalTokens = job.results.reduce((sum, r) => sum + r.tokens, 0)
    const totalDuration = job.results.reduce((sum, r) => sum + r.duration, 0)
    const avgDuration = totalDuration / (job.results.length || 1)

    return {
      totalPrompts: job.prompts.length,
      completed,
      failed,
      totalTokens,
      avgDuration,
      totalDuration
    }
  }

  private async saveBatchJob(job: BatchJob): Promise<void> {
    const jobs = await this.getAllBatchJobs()
    const index = jobs.findIndex(j => j.id === job.id)

    if (index !== -1) {
      jobs[index] = job
    } else {
      jobs.push(job)
    }

    await localforage.setItem(this.BATCH_JOBS_KEY, jobs)
  }

  private async callAI(
    prompt: string,
    model: string,
    config: ChatConfig
  ): Promise<{ content: string; tokens: number }> {
    // Mock AI call - integrate with your actual AI service
    await new Promise(resolve => setTimeout(resolve, 500))

    return {
      content: `Response to: ${prompt.slice(0, 50)}...`,
      tokens: Math.floor(Math.random() * 500) + 100
    }
  }
}

export const batchProcessingService = new BatchProcessingService()
export default batchProcessingService
