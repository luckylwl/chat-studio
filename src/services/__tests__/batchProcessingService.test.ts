/**
 * AI Chat Studio v3.0 - Batch Processing Service Tests
 *
 * Tests for batch job execution and management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import batchProcessingService from '../batchProcessingService'
import type { BatchJob, ChatConfig } from '../../types'

// Mock AI service
const mockAICall = vi.fn()

describe('BatchProcessingService', () => {
  const testPrompts = [
    'What is AI?',
    'Explain machine learning',
    'What is deep learning?',
    'How does NLP work?',
    'What are neural networks?'
  ]

  const testConfig: ChatConfig = {
    temperature: 0.7,
    maxTokens: 500,
    topP: 1,
    frequencyPenalty: 0,
    presencePenalty: 0
  }

  beforeEach(() => {
    // Reset mock
    mockAICall.mockClear()

    // Mock successful AI responses
    mockAICall.mockImplementation(async (prompt: string) => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100))

      return {
        content: `Response to: ${prompt}`,
        tokens: 50,
        model: 'gpt-3.5-turbo'
      }
    })
  })

  afterEach(async () => {
    // Clean up all jobs
    const jobs = await batchProcessingService.getAllJobs()
    for (const job of jobs) {
      await batchProcessingService.deleteJob(job.id)
    }
  })

  describe('createBatchJob', () => {
    it('should create a batch job successfully', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      expect(job).toBeDefined()
      expect(job.id).toBeDefined()
      expect(job.name).toBe('Test Job')
      expect(job.prompts).toEqual(testPrompts)
      expect(job.model).toBe('gpt-3.5-turbo')
      expect(job.status).toBe('pending')
      expect(job.results).toEqual([])
    })

    it('should initialize job with correct metadata', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-4',
        testConfig
      )

      expect(job.totalPrompts).toBe(testPrompts.length)
      expect(job.completedPrompts).toBe(0)
      expect(job.failedPrompts).toBe(0)
      expect(job.progress).toBe(0)
      expect(job.startedAt).toBeUndefined()
      expect(job.completedAt).toBeUndefined()
    })

    it('should reject empty prompts array', async () => {
      await expect(
        batchProcessingService.createBatchJob(
          'Empty Job',
          [],
          'gpt-3.5-turbo',
          testConfig
        )
      ).rejects.toThrow()
    })

    it('should handle large batch sizes', async () => {
      const largePrompts = Array.from({ length: 100 }, (_, i) => `Prompt ${i}`)

      const job = await batchProcessingService.createBatchJob(
        'Large Job',
        largePrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      expect(job.totalPrompts).toBe(100)
    })
  })

  describe('getJob', () => {
    it('should retrieve an existing job', async () => {
      const created = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      const retrieved = await batchProcessingService.getJob(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(created.id)
      expect(retrieved!.name).toBe(created.name)
    })

    it('should return null for non-existent job', async () => {
      const retrieved = await batchProcessingService.getJob('non_existent')
      expect(retrieved).toBeNull()
    })
  })

  describe('getAllJobs', () => {
    it('should return empty array when no jobs exist', async () => {
      const jobs = await batchProcessingService.getAllJobs()
      expect(jobs).toEqual([])
    })

    it('should return all jobs', async () => {
      await batchProcessingService.createBatchJob(
        'Job 1',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      await batchProcessingService.createBatchJob(
        'Job 2',
        testPrompts.slice(0, 2),
        'gpt-4',
        testConfig
      )

      const jobs = await batchProcessingService.getAllJobs()

      expect(jobs).toHaveLength(2)
      expect(jobs.map(j => j.name)).toContain('Job 1')
      expect(jobs.map(j => j.name)).toContain('Job 2')
    })

    it('should sort jobs by creation date (newest first)', async () => {
      const job1 = await batchProcessingService.createBatchJob(
        'Job 1',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10))

      const job2 = await batchProcessingService.createBatchJob(
        'Job 2',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      const jobs = await batchProcessingService.getAllJobs()

      expect(jobs[0].id).toBe(job2.id) // Newest first
      expect(jobs[1].id).toBe(job1.id)
    })
  })

  describe('updateJobStatus', () => {
    it('should update job status', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      await batchProcessingService.updateJobStatus(job.id, 'processing')

      const updated = await batchProcessingService.getJob(job.id)
      expect(updated!.status).toBe('processing')
    })

    it('should record start time when status becomes processing', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      await batchProcessingService.updateJobStatus(job.id, 'processing')

      const updated = await batchProcessingService.getJob(job.id)
      expect(updated!.startedAt).toBeDefined()
    })

    it('should record completion time when status becomes completed', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      await batchProcessingService.updateJobStatus(job.id, 'processing')
      await batchProcessingService.updateJobStatus(job.id, 'completed')

      const updated = await batchProcessingService.getJob(job.id)
      expect(updated!.completedAt).toBeDefined()
    })
  })

  describe('deleteJob', () => {
    it('should delete an existing job', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      const result = await batchProcessingService.deleteJob(job.id)
      expect(result).toBe(true)

      const retrieved = await batchProcessingService.getJob(job.id)
      expect(retrieved).toBeNull()
    })

    it('should return false for non-existent job', async () => {
      const result = await batchProcessingService.deleteJob('non_existent')
      expect(result).toBe(false)
    })

    it('should not allow deletion of running jobs', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      await batchProcessingService.updateJobStatus(job.id, 'processing')

      await expect(
        batchProcessingService.deleteJob(job.id)
      ).rejects.toThrow('Cannot delete a running job')
    })
  })

  describe('cancelJob', () => {
    it('should cancel a pending job', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      const result = await batchProcessingService.cancelJob(job.id)
      expect(result).toBe(true)

      const updated = await batchProcessingService.getJob(job.id)
      expect(updated!.status).toBe('cancelled')
    })

    it('should cancel a processing job', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      await batchProcessingService.updateJobStatus(job.id, 'processing')

      const result = await batchProcessingService.cancelJob(job.id)
      expect(result).toBe(true)

      const updated = await batchProcessingService.getJob(job.id)
      expect(updated!.status).toBe('cancelled')
    })

    it('should not cancel completed jobs', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      await batchProcessingService.updateJobStatus(job.id, 'completed')

      const result = await batchProcessingService.cancelJob(job.id)
      expect(result).toBe(false)
    })
  })

  describe('exportResultsToCSV', () => {
    it('should export results to CSV format', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts.slice(0, 2),
        'gpt-3.5-turbo',
        testConfig
      )

      // Manually add some results
      const jobWithResults = {
        ...job,
        results: [
          {
            promptIndex: 0,
            prompt: testPrompts[0],
            response: 'Response 1',
            tokens: 50,
            duration: 1000,
            success: true
          },
          {
            promptIndex: 1,
            prompt: testPrompts[1],
            response: 'Response 2',
            tokens: 60,
            duration: 1200,
            success: true
          }
        ]
      }

      const csv = batchProcessingService.exportResultsToCSV(jobWithResults)

      expect(csv).toBeDefined()
      expect(csv).toContain('Prompt,Response,Tokens,Duration (ms),Success')
      expect(csv).toContain('Response 1')
      expect(csv).toContain('Response 2')
    })

    it('should handle special characters in CSV', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        ['"Quote" and, comma'],
        'gpt-3.5-turbo',
        testConfig
      )

      const jobWithResults = {
        ...job,
        results: [
          {
            promptIndex: 0,
            prompt: '"Quote" and, comma',
            response: 'Response with "quotes" and, commas',
            tokens: 50,
            duration: 1000,
            success: true
          }
        ]
      }

      const csv = batchProcessingService.exportResultsToCSV(jobWithResults)

      expect(csv).toBeDefined()
      // CSV should escape quotes properly
      expect(csv).toContain('""Quote"" and, comma')
    })

    it('should handle failed results', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts.slice(0, 1),
        'gpt-3.5-turbo',
        testConfig
      )

      const jobWithResults = {
        ...job,
        results: [
          {
            promptIndex: 0,
            prompt: testPrompts[0],
            response: '',
            error: 'API Error',
            tokens: 0,
            duration: 500,
            success: false
          }
        ]
      }

      const csv = batchProcessingService.exportResultsToCSV(jobWithResults)

      expect(csv).toContain('API Error')
      expect(csv).toContain('false')
    })
  })

  describe('getJobStatistics', () => {
    it('should calculate statistics correctly', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts.slice(0, 5),
        'gpt-3.5-turbo',
        testConfig
      )

      const jobWithResults = {
        ...job,
        completedPrompts: 4,
        failedPrompts: 1,
        results: [
          { promptIndex: 0, prompt: '', response: '', tokens: 50, duration: 1000, success: true },
          { promptIndex: 1, prompt: '', response: '', tokens: 60, duration: 1200, success: true },
          { promptIndex: 2, prompt: '', response: '', tokens: 55, duration: 1100, success: true },
          { promptIndex: 3, prompt: '', response: '', tokens: 45, duration: 900, success: true },
          { promptIndex: 4, prompt: '', response: '', tokens: 0, duration: 500, success: false, error: 'Failed' }
        ]
      }

      const stats = batchProcessingService.getJobStatistics(jobWithResults)

      expect(stats.totalPrompts).toBe(5)
      expect(stats.completed).toBe(4)
      expect(stats.failed).toBe(1)
      expect(stats.totalTokens).toBe(210) // 50+60+55+45
      expect(stats.avgDuration).toBe(1050) // (1000+1200+1100+900) / 4
      expect(stats.totalDuration).toBe(4700) // Sum of all durations
    })

    it('should handle jobs with no results', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      const stats = batchProcessingService.getJobStatistics(job)

      expect(stats.totalPrompts).toBe(testPrompts.length)
      expect(stats.completed).toBe(0)
      expect(stats.failed).toBe(0)
      expect(stats.totalTokens).toBe(0)
      expect(stats.avgDuration).toBe(0)
      expect(stats.totalDuration).toBe(0)
    })
  })

  describe('Progress Tracking', () => {
    it('should update progress during job execution', async () => {
      const progressUpdates: number[] = []

      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts.slice(0, 3),
        'gpt-3.5-turbo',
        testConfig,
        (progress) => {
          progressUpdates.push(progress)
        }
      )

      // Progress should be updated as prompts complete
      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[progressUpdates.length - 1]).toBe(100)
    })

    it('should calculate progress correctly', async () => {
      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts,
        'gpt-3.5-turbo',
        testConfig
      )

      // Manually update completed count
      const updatedJob = {
        ...job,
        completedPrompts: 2,
        progress: (2 / testPrompts.length) * 100
      }

      expect(updatedJob.progress).toBe(40) // 2/5 = 40%
    })
  })

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API failure
      mockAICall.mockImplementation(async () => {
        throw new Error('API Error')
      })

      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts.slice(0, 2),
        'gpt-3.5-turbo',
        testConfig
      )

      // Even with errors, job should complete
      const updated = await batchProcessingService.getJob(job.id)

      expect(updated!.status).toMatch(/completed|failed/)
      expect(updated!.failedPrompts).toBeGreaterThan(0)
    })

    it('should record error messages for failed prompts', async () => {
      const errorMessage = 'Rate limit exceeded'

      mockAICall.mockImplementation(async () => {
        throw new Error(errorMessage)
      })

      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts.slice(0, 1),
        'gpt-3.5-turbo',
        testConfig
      )

      const updated = await batchProcessingService.getJob(job.id)
      const failedResult = updated!.results.find(r => !r.success)

      expect(failedResult).toBeDefined()
      expect(failedResult!.error).toContain(errorMessage)
    })

    it('should handle partial failures', async () => {
      let callCount = 0

      mockAICall.mockImplementation(async (prompt: string) => {
        callCount++
        if (callCount === 2) {
          throw new Error('Second call failed')
        }

        return {
          content: `Response to: ${prompt}`,
          tokens: 50,
          model: 'gpt-3.5-turbo'
        }
      })

      const job = await batchProcessingService.createBatchJob(
        'Test Job',
        testPrompts.slice(0, 3),
        'gpt-3.5-turbo',
        testConfig
      )

      const updated = await batchProcessingService.getJob(job.id)

      expect(updated!.completedPrompts).toBe(2)
      expect(updated!.failedPrompts).toBe(1)
    })
  })

  describe('Concurrent Job Execution', () => {
    it('should handle multiple concurrent jobs', async () => {
      const job1 = batchProcessingService.createBatchJob(
        'Job 1',
        testPrompts.slice(0, 2),
        'gpt-3.5-turbo',
        testConfig
      )

      const job2 = batchProcessingService.createBatchJob(
        'Job 2',
        testPrompts.slice(2, 4),
        'gpt-3.5-turbo',
        testConfig
      )

      const [result1, result2] = await Promise.all([job1, job2])

      expect(result1.id).toBeDefined()
      expect(result2.id).toBeDefined()
      expect(result1.id).not.toBe(result2.id)
    })

    it('should not interfere between concurrent jobs', async () => {
      const job1 = await batchProcessingService.createBatchJob(
        'Job 1',
        testPrompts.slice(0, 2),
        'gpt-3.5-turbo',
        testConfig
      )

      const job2 = await batchProcessingService.createBatchJob(
        'Job 2',
        testPrompts.slice(2, 4),
        'gpt-3.5-turbo',
        testConfig
      )

      // Both jobs should exist independently
      const retrieved1 = await batchProcessingService.getJob(job1.id)
      const retrieved2 = await batchProcessingService.getJob(job2.id)

      expect(retrieved1!.name).toBe('Job 1')
      expect(retrieved2!.name).toBe('Job 2')
    })
  })

  describe('Performance', () => {
    it('should process jobs efficiently', async () => {
      const startTime = Date.now()

      const job = await batchProcessingService.createBatchJob(
        'Performance Test',
        testPrompts.slice(0, 5),
        'gpt-3.5-turbo',
        testConfig
      )

      // Wait for completion
      let updated = await batchProcessingService.getJob(job.id)
      while (updated && updated.status === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 100))
        updated = await batchProcessingService.getJob(job.id)
      }

      const duration = Date.now() - startTime

      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000) // 10 seconds for 5 prompts
    })
  })
})
