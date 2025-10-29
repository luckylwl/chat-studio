import React, { useState, useEffect } from 'react'
import { PromptLab, PromptVariant, PromptTestCase, PromptTestResult } from '../types'
import { Play, Plus, Trash2, BarChart2, Download, Copy } from 'lucide-react'
import localforage from 'localforage'
import toast from 'react-hot-toast'

export const PromptEngineeringLab: React.FC = () => {
  const [labs, setLabs] = useState<PromptLab[]>([])
  const [currentLab, setCurrentLab] = useState<PromptLab | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [showNewLabModal, setShowNewLabModal] = useState(false)

  useEffect(() => {
    loadLabs()
  }, [])

  const loadLabs = async () => {
    const saved = await localforage.getItem<PromptLab[]>('prompt_labs') || []
    setLabs(saved)
  }

  const saveLabs = async (updatedLabs: PromptLab[]) => {
    await localforage.setItem('prompt_labs', updatedLabs)
    setLabs(updatedLabs)
  }

  const createLab = async (name: string, basePrompt: string) => {
    const newLab: PromptLab = {
      id: `lab_${Date.now()}`,
      name,
      basePrompt,
      variants: [{
        id: 'var_1',
        name: 'Original',
        prompt: basePrompt
      }],
      testCases: [],
      results: [],
      createdAt: Date.now()
    }

    const updated = [...labs, newLab]
    await saveLabs(updated)
    setCurrentLab(newLab)
    setShowNewLabModal(false)
    toast.success('Lab created')
  }

  const addVariant = () => {
    if (!currentLab) return

    const newVariant: PromptVariant = {
      id: `var_${Date.now()}`,
      name: `Variant ${currentLab.variants.length + 1}`,
      prompt: currentLab.basePrompt
    }

    const updated = labs.map(lab =>
      lab.id === currentLab.id
        ? { ...lab, variants: [...lab.variants, newVariant] }
        : lab
    )

    saveLabs(updated)
    setCurrentLab({ ...currentLab, variants: [...currentLab.variants, newVariant] })
  }

  const addTestCase = () => {
    if (!currentLab) return

    const newTestCase: PromptTestCase = {
      id: `test_${Date.now()}`,
      input: ''
    }

    const updated = labs.map(lab =>
      lab.id === currentLab.id
        ? { ...lab, testCases: [...lab.testCases, newTestCase] }
        : lab
    )

    saveLabs(updated)
    setCurrentLab({ ...currentLab, testCases: [...currentLab.testCases, newTestCase] })
  }

  const runTests = async () => {
    if (!currentLab) return
    if (currentLab.testCases.length === 0) {
      toast.error('Add test cases first')
      return
    }

    setIsRunning(true)
    const results: PromptTestResult[] = []

    try {
      for (const variant of currentLab.variants) {
        for (const testCase of currentLab.testCases) {
          const startTime = Date.now()

          // Replace {{input}} placeholder in prompt
          const finalPrompt = variant.prompt.replace('{{input}}', testCase.input)

          // Mock AI call - integrate with actual AI service
          const response = await mockAICall(finalPrompt, variant.model || 'gpt-4')

          const result: PromptTestResult = {
            variantId: variant.id,
            testCaseId: testCase.id,
            output: response.content,
            score: calculateScore(response.content, testCase.expectedOutput),
            duration: Date.now() - startTime,
            tokens: response.tokens
          }

          results.push(result)
        }
      }

      const updated = labs.map(lab =>
        lab.id === currentLab.id
          ? { ...lab, results }
          : lab
      )

      await saveLabs(updated)
      setCurrentLab({ ...currentLab, results })
      toast.success('Tests completed')
    } catch (error: any) {
      toast.error(error.message || 'Test execution failed')
    } finally {
      setIsRunning(false)
    }
  }

  const calculateScore = (output: string, expected?: string): number => {
    if (!expected) return 0.5 // Default score when no expected output

    // Simple similarity scoring
    const outputWords = output.toLowerCase().split(/\s+/)
    const expectedWords = expected.toLowerCase().split(/\s+/)
    const overlap = outputWords.filter(w => expectedWords.includes(w)).length

    return overlap / Math.max(outputWords.length, expectedWords.length)
  }

  const exportResults = () => {
    if (!currentLab) return

    const csv = [
      ['Variant', 'Test Case', 'Input', 'Output', 'Score', 'Duration (ms)', 'Tokens'].join(','),
      ...currentLab.results.map(r => {
        const variant = currentLab.variants.find(v => v.id === r.variantId)
        const testCase = currentLab.testCases.find(t => t.id === r.testCaseId)
        return [
          variant?.name || '',
          testCase?.id || '',
          `"${testCase?.input.replace(/"/g, '""') || ''}"`,
          `"${r.output.replace(/"/g, '""')}"`,
          r.score.toFixed(3),
          r.duration.toString(),
          r.tokens.toString()
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${currentLab.name}_results.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Prompt Engineering Lab
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Test and optimize prompt variants
            </p>
          </div>
          <button
            onClick={() => setShowNewLabModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={16} />
            New Lab
          </button>
        </div>

        {/* Lab Selector */}
        {labs.length > 0 && (
          <div className="mt-4">
            <select
              value={currentLab?.id || ''}
              onChange={(e) => {
                const lab = labs.find(l => l.id === e.target.value)
                setCurrentLab(lab || null)
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select a lab...</option>
              {labs.map(lab => (
                <option key={lab.id} value={lab.id}>
                  {lab.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Content */}
      {currentLab ? (
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex gap-2">
            <button
              onClick={addVariant}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Variant
            </button>
            <button
              onClick={addTestCase}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <Plus size={16} />
              Add Test Case
            </button>
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Play size={16} />
              {isRunning ? 'Running...' : 'Run All Tests'}
            </button>
            {currentLab.results.length > 0 && (
              <button
                onClick={exportResults}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
              >
                <Download size={16} />
                Export Results
              </button>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex">
            {/* Left: Variants & Test Cases */}
            <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4">
              {/* Variants */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Prompt Variants ({currentLab.variants.length})
                </h3>
                <div className="space-y-3">
                  {currentLab.variants.map((variant, i) => (
                    <div
                      key={variant.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                    >
                      <input
                        type="text"
                        value={variant.name}
                        onChange={(e) => {
                          const updated = labs.map(lab =>
                            lab.id === currentLab.id
                              ? {
                                  ...lab,
                                  variants: lab.variants.map(v =>
                                    v.id === variant.id ? { ...v, name: e.target.value } : v
                                  )
                                }
                              : lab
                          )
                          saveLabs(updated)
                        }}
                        className="w-full mb-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-medium"
                      />
                      <textarea
                        value={variant.prompt}
                        onChange={(e) => {
                          const updated = labs.map(lab =>
                            lab.id === currentLab.id
                              ? {
                                  ...lab,
                                  variants: lab.variants.map(v =>
                                    v.id === variant.id ? { ...v, prompt: e.target.value } : v
                                  )
                                }
                              : lab
                          )
                          saveLabs(updated)
                        }}
                        rows={4}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-mono"
                        placeholder="Enter prompt (use {{input}} for test case input)"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Test Cases */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Test Cases ({currentLab.testCases.length})
                </h3>
                <div className="space-y-3">
                  {currentLab.testCases.map((testCase, i) => (
                    <div
                      key={testCase.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3"
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Input
                      </label>
                      <input
                        type="text"
                        value={testCase.input}
                        onChange={(e) => {
                          const updated = labs.map(lab =>
                            lab.id === currentLab.id
                              ? {
                                  ...lab,
                                  testCases: lab.testCases.map(t =>
                                    t.id === testCase.id ? { ...t, input: e.target.value } : t
                                  )
                                }
                              : lab
                          )
                          saveLabs(updated)
                        }}
                        className="w-full mb-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Test input..."
                      />
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Expected Output (optional)
                      </label>
                      <input
                        type="text"
                        value={testCase.expectedOutput || ''}
                        onChange={(e) => {
                          const updated = labs.map(lab =>
                            lab.id === currentLab.id
                              ? {
                                  ...lab,
                                  testCases: lab.testCases.map(t =>
                                    t.id === testCase.id ? { ...t, expectedOutput: e.target.value } : t
                                  )
                                }
                              : lab
                          )
                          saveLabs(updated)
                        }}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        placeholder="Expected output for scoring..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Results */}
            <div className="w-1/2 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Test Results
              </h3>

              {currentLab.results.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  Run tests to see results
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Score Summary */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                      Average Scores
                    </h4>
                    {currentLab.variants.map(variant => {
                      const variantResults = currentLab.results.filter(r => r.variantId === variant.id)
                      const avgScore = variantResults.reduce((sum, r) => sum + r.score, 0) / variantResults.length
                      return (
                        <div key={variant.id} className="flex items-center justify-between py-1">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{variant.name}</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            {(avgScore * 100).toFixed(1)}%
                          </span>
                        </div>
                      )
                    })}
                  </div>

                  {/* Detailed Results */}
                  {currentLab.results.map(result => {
                    const variant = currentLab.variants.find(v => v.id === result.variantId)
                    const testCase = currentLab.testCases.find(t => t.id === result.testCaseId)
                    return (
                      <div key={`${result.variantId}_${result.testCaseId}`} className="bg-white dark:bg-gray-800 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {variant?.name}
                          </span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            Score: {(result.score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-sm mb-2">
                          <span className="text-gray-600 dark:text-gray-400">Input: </span>
                          <span className="text-gray-900 dark:text-white">{testCase?.input}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Output: </span>
                          <span className="text-gray-900 dark:text-white">{result.output}</span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {result.duration}ms • {result.tokens} tokens
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          {labs.length === 0 ? (
            <div className="text-center">
              <p className="mb-4">No labs created yet</p>
              <button
                onClick={() => setShowNewLabModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create Your First Lab
              </button>
            </div>
          ) : (
            'Select a lab from the dropdown above'
          )}
        </div>
      )}

      {/* New Lab Modal */}
      {showNewLabModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Create New Lab
            </h3>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                createLab(
                  formData.get('name') as string,
                  formData.get('basePrompt') as string
                )
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Lab Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="e.g., Email Generator Optimization"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Base Prompt
                  </label>
                  <textarea
                    name="basePrompt"
                    required
                    rows={6}
                    placeholder="Enter your base prompt. Use {{input}} as a placeholder for test inputs..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowNewLabModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Lab
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

async function mockAICall(prompt: string, model: string): Promise<{ content: string; tokens: number }> {
  // Mock AI response - integrate with actual AI service
  await new Promise(resolve => setTimeout(resolve, 1000))

  return {
    content: `Mock response for: ${prompt.slice(0, 50)}...`,
    tokens: Math.floor(Math.random() * 300) + 50
  }
}

export default PromptEngineeringLab
