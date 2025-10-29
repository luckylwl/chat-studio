import React, { useState, useEffect } from 'react'
import { BatchJob } from '../types'
import batchProcessingService from '../services/batchProcessingService'
import { Play, Download, Trash2, FileText, BarChart } from 'lucide-react'
import toast from 'react-hot-toast'

export const BatchProcessor: React.FC = () => {
  const [jobs, setJobs] = useState<BatchJob[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedJob, setSelectedJob] = useState<BatchJob | null>(null)

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    const allJobs = await batchProcessingService.getAllBatchJobs()
    setJobs(allJobs)
  }

  const createBatchJob = async (formData: {
    name: string
    prompts: string
    model: string
  }) => {
    try {
      const prompts = formData.prompts
        .split('\n')
        .map(p => p.trim())
        .filter(p => p)

      if (prompts.length === 0) {
        toast.error('Please enter at least one prompt')
        return
      }

      const job = await batchProcessingService.createBatchJob(
        formData.name,
        prompts,
        formData.model,
        {
          model: formData.model,
          temperature: 0.7,
          maxTokens: 1000,
          stream: false
        },
        (progress) => {
          console.log(`Progress: ${progress}%`)
          loadJobs() // Reload to show progress
        }
      )

      toast.success(`Batch job "${job.name}" created`)
      setShowCreateModal(false)
      loadJobs()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create batch job')
    }
  }

  const deleteJob = async (jobId: string) => {
    if (!confirm('Delete this batch job?')) return

    try {
      await batchProcessingService.deleteBatchJob(jobId)
      toast.success('Job deleted')
      loadJobs()
    } catch (error) {
      toast.error('Failed to delete job')
    }
  }

  const exportJob = (job: BatchJob, format: 'csv' | 'json') => {
    const content = format === 'csv'
      ? batchProcessingService.exportResultsToCSV(job)
      : batchProcessingService.exportResultsToJSON(job)

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${job.name}.${format}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Batch Processing
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Play size={16} />
            New Batch Job
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Process multiple prompts in parallel and export results
        </p>
      </div>

      {/* Jobs List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {jobs.map(job => {
            const stats = batchProcessingService.getJobStatistics(job)

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {job.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Model: {job.model} • Created: {new Date(job.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedJob(job)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="View Results"
                    >
                      <BarChart size={16} />
                    </button>
                    <button
                      onClick={() => exportJob(job, 'csv')}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                      title="Export CSV"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => deleteJob(job.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Progress
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.round(job.progress)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        job.status === 'completed'
                          ? 'bg-green-600'
                          : job.status === 'failed'
                          ? 'bg-red-600'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Status</p>
                    <p className="font-semibold text-gray-900 dark:text-white capitalize">
                      {job.status}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Completed</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {stats.completed}/{stats.totalPrompts}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Failed</p>
                    <p className="font-semibold text-red-600">{stats.failed}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Total Tokens</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {stats.totalTokens.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Avg Duration</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {Math.round(stats.avgDuration)}ms
                    </p>
                  </div>
                </div>
              </div>
            )
          })}

          {jobs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No batch jobs yet. Create one to get started!
            </div>
          )}
        </div>
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create Batch Job
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                createBatchJob({
                  name: formData.get('name') as string,
                  prompts: formData.get('prompts') as string,
                  model: formData.get('model') as string
                })
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Job Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Product Descriptions"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Model
                  </label>
                  <select
                    name="model"
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    <option value="claude-3-opus">Claude 3 Opus</option>
                    <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Prompts (one per line)
                  </label>
                  <textarea
                    name="prompts"
                    required
                    rows={10}
                    placeholder="Enter prompts, one per line..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <Play size={16} />
                  Start Batch Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Results Modal */}
      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Results: {selectedJob.name}
              </h3>
              <button
                onClick={() => setSelectedJob(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {selectedJob.results.map((result, i) => (
                <div
                  key={i}
                  className={`p-3 border rounded-lg ${
                    result.error
                      ? 'border-red-300 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prompt #{i + 1}
                    </span>
                    <span className="text-xs text-gray-500">
                      {result.tokens} tokens • {result.duration}ms
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-mono">
                    {result.prompt}
                  </p>
                  {result.error ? (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Error: {result.error}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-900 dark:text-white">
                      {result.response}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchProcessor
