/**
 * AI Chat Studio v3.0 - Workflow Service Tests
 *
 * Tests for workflow automation and scheduling
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import workflowService from '../workflowService'
import type { Workflow, WorkflowAction, WorkflowTrigger, ScheduledTask } from '../../types'

// Mock AI service and other external dependencies
const mockAICall = vi.fn()
const mockWebhookCall = vi.fn()
const mockNotification = vi.fn()

describe('WorkflowService', () => {
  const mockTrigger: WorkflowTrigger = {
    type: 'manual',
    config: {}
  }

  const mockActions: WorkflowAction[] = [
    {
      id: 'action_1',
      type: 'ai_prompt',
      config: {
        prompt: 'Test prompt: {{input}}',
        model: 'gpt-3.5-turbo'
      }
    }
  ]

  beforeEach(() => {
    // Initialize workflow service
    workflowService.initialize()

    // Reset mocks
    mockAICall.mockClear()
    mockWebhookCall.mockClear()
    mockNotification.mockClear()

    // Mock successful responses
    mockAICall.mockResolvedValue({
      content: 'AI response',
      tokens: 50
    })

    mockWebhookCall.mockResolvedValue({
      status: 200,
      data: { success: true }
    })
  })

  afterEach(async () => {
    // Clean up workflows and tasks
    const workflows = await workflowService.getAllWorkflows()
    for (const workflow of workflows) {
      await workflowService.deleteWorkflow(workflow.id)
    }

    const tasks = await workflowService.getAllScheduledTasks()
    for (const task of tasks) {
      await workflowService.deleteScheduledTask(task.id)
    }

    // Stop scheduler
    workflowService.destroy()
  })

  describe('initialization', () => {
    it('should initialize successfully', () => {
      workflowService.initialize()
      // Should not throw
      expect(true).toBe(true)
    })

    it('should be idempotent', () => {
      workflowService.initialize()
      workflowService.initialize()
      // Should not throw
      expect(true).toBe(true)
    })
  })

  describe('createWorkflow', () => {
    it('should create a workflow successfully', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'test_workflow_1',
        name: 'Test Workflow',
        description: 'A test workflow',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      expect(workflow).toBeDefined()
      expect(workflow.id).toBe('test_workflow_1')
      expect(workflow.name).toBe('Test Workflow')
      expect(workflow.isEnabled).toBe(true)
      expect(workflow.runCount).toBe(0)
    })

    it('should set creation and update timestamps', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'test_workflow_2',
        name: 'Test Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      expect(workflow.createdAt).toBeDefined()
      expect(workflow.updatedAt).toBeDefined()
      expect(workflow.createdAt).toBe(workflow.updatedAt)
    })

    it('should reject duplicate workflow IDs', async () => {
      await workflowService.createWorkflow({
        id: 'duplicate_id',
        name: 'Workflow 1',
        description: 'Test',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      await expect(
        workflowService.createWorkflow({
          id: 'duplicate_id',
          name: 'Workflow 2',
          description: 'Test',
          trigger: mockTrigger,
          actions: mockActions,
          isEnabled: true,
          userId: 'test_user'
        })
      ).rejects.toThrow()
    })

    it('should validate workflow structure', async () => {
      await expect(
        workflowService.createWorkflow({
          id: 'invalid_workflow',
          name: '',
          description: 'Test',
          trigger: mockTrigger,
          actions: [],
          isEnabled: true,
          userId: 'test_user'
        })
      ).rejects.toThrow()
    })
  })

  describe('getWorkflow', () => {
    it('should retrieve an existing workflow', async () => {
      const created = await workflowService.createWorkflow({
        id: 'test_workflow',
        name: 'Test Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      const retrieved = await workflowService.getWorkflow(created.id)

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(created.id)
      expect(retrieved!.name).toBe(created.name)
    })

    it('should return null for non-existent workflow', async () => {
      const retrieved = await workflowService.getWorkflow('non_existent')
      expect(retrieved).toBeNull()
    })
  })

  describe('getAllWorkflows', () => {
    it('should return empty array when no workflows exist', async () => {
      const workflows = await workflowService.getAllWorkflows()
      expect(workflows).toEqual([])
    })

    it('should return all workflows', async () => {
      await workflowService.createWorkflow({
        id: 'workflow_1',
        name: 'Workflow 1',
        description: 'Test',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      await workflowService.createWorkflow({
        id: 'workflow_2',
        name: 'Workflow 2',
        description: 'Test',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      const workflows = await workflowService.getAllWorkflows()

      expect(workflows).toHaveLength(2)
      expect(workflows.map(w => w.id)).toContain('workflow_1')
      expect(workflows.map(w => w.id)).toContain('workflow_2')
    })
  })

  describe('updateWorkflow', () => {
    it('should update workflow properties', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'test_workflow',
        name: 'Original Name',
        description: 'Original description',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      const updated = await workflowService.updateWorkflow(workflow.id, {
        name: 'Updated Name',
        description: 'Updated description',
        isEnabled: false
      })

      expect(updated!.name).toBe('Updated Name')
      expect(updated!.description).toBe('Updated description')
      expect(updated!.isEnabled).toBe(false)
      expect(updated!.updatedAt).toBeGreaterThan(workflow.updatedAt)
    })

    it('should preserve unchanged properties', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'test_workflow',
        name: 'Test Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      const updated = await workflowService.updateWorkflow(workflow.id, {
        name: 'Updated Name'
      })

      expect(updated!.description).toBe(workflow.description)
      expect(updated!.trigger).toEqual(workflow.trigger)
      expect(updated!.actions).toEqual(workflow.actions)
    })
  })

  describe('deleteWorkflow', () => {
    it('should delete an existing workflow', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'test_workflow',
        name: 'Test Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      const result = await workflowService.deleteWorkflow(workflow.id)
      expect(result).toBe(true)

      const retrieved = await workflowService.getWorkflow(workflow.id)
      expect(retrieved).toBeNull()
    })

    it('should return false for non-existent workflow', async () => {
      const result = await workflowService.deleteWorkflow('non_existent')
      expect(result).toBe(false)
    })
  })

  describe('executeWorkflow', () => {
    it('should execute a simple workflow', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'simple_workflow',
        name: 'Simple Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'action_1',
            type: 'ai_prompt',
            config: {
              prompt: 'Say hello to {{name}}',
              model: 'gpt-3.5-turbo'
            }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      const context = { name: 'Alice' }
      const result = await workflowService.executeWorkflow(workflow.id, context)

      expect(result).toBeDefined()
      expect(workflow.runCount).toBe(1)
    })

    it('should replace variables in action configs', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'variable_workflow',
        name: 'Variable Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'action_1',
            type: 'ai_prompt',
            config: {
              prompt: 'User: {{username}}, Age: {{age}}',
              model: 'gpt-3.5-turbo'
            }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      const context = { username: 'Bob', age: 25 }
      await workflowService.executeWorkflow(workflow.id, context)

      // Verify that mockAICall was called with replaced variables
      expect(mockAICall).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'User: Bob, Age: 25'
        })
      )
    })

    it('should execute multiple actions in sequence', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'multi_action_workflow',
        name: 'Multi-Action Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'action_1',
            type: 'ai_prompt',
            config: { prompt: 'Step 1', model: 'gpt-3.5-turbo' }
          },
          {
            id: 'action_2',
            type: 'ai_prompt',
            config: { prompt: 'Step 2', model: 'gpt-3.5-turbo' }
          },
          {
            id: 'action_3',
            type: 'notification',
            config: { message: 'Done' }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      await workflowService.executeWorkflow(workflow.id, {})

      // All actions should be executed
      expect(mockAICall).toHaveBeenCalledTimes(2)
      expect(mockNotification).toHaveBeenCalledTimes(1)
    })

    it('should not execute disabled workflows', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'disabled_workflow',
        name: 'Disabled Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: false,
        userId: 'test_user'
      })

      await expect(
        workflowService.executeWorkflow(workflow.id, {})
      ).rejects.toThrow('Workflow is disabled')
    })

    it('should handle action errors gracefully', async () => {
      mockAICall.mockRejectedValue(new Error('API Error'))

      const workflow = await workflowService.createWorkflow({
        id: 'error_workflow',
        name: 'Error Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      await expect(
        workflowService.executeWorkflow(workflow.id, {})
      ).rejects.toThrow('API Error')
    })

    it('should pass output from one action to the next', async () => {
      mockAICall.mockResolvedValue({ content: 'First response', tokens: 50 })

      const workflow = await workflowService.createWorkflow({
        id: 'chained_workflow',
        name: 'Chained Workflow',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'action_1',
            type: 'ai_prompt',
            config: { prompt: 'First', model: 'gpt-3.5-turbo' }
          },
          {
            id: 'action_2',
            type: 'ai_prompt',
            config: { prompt: 'Use previous: {{previousOutput}}', model: 'gpt-3.5-turbo' }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      await workflowService.executeWorkflow(workflow.id, {})

      // Second action should have access to first action's output
      const lastCall = mockAICall.mock.calls[mockAICall.mock.calls.length - 1]
      expect(lastCall[0].prompt).toContain('First response')
    })
  })

  describe('Trigger Types', () => {
    it('should support manual triggers', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'manual_trigger_workflow',
        name: 'Manual Trigger',
        description: 'Test',
        trigger: { type: 'manual', config: {} },
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      // Manual triggers can be executed directly
      const result = await workflowService.executeWorkflow(workflow.id, {})
      expect(result).toBeDefined()
    })

    it('should support schedule triggers', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'schedule_trigger_workflow',
        name: 'Schedule Trigger',
        description: 'Test',
        trigger: {
          type: 'schedule',
          config: { cron: '0 0 * * *' } // Daily at midnight
        },
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      expect(workflow.trigger.type).toBe('schedule')
      expect(workflow.trigger.config.cron).toBe('0 0 * * *')
    })

    it('should support webhook triggers', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'webhook_trigger_workflow',
        name: 'Webhook Trigger',
        description: 'Test',
        trigger: {
          type: 'webhook',
          config: { secret: 'webhook_secret' }
        },
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      expect(workflow.trigger.type).toBe('webhook')
      expect(workflow.trigger.config.secret).toBe('webhook_secret')
    })

    it('should support event triggers', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'event_trigger_workflow',
        name: 'Event Trigger',
        description: 'Test',
        trigger: {
          type: 'event',
          config: { eventType: 'conversation.ended' }
        },
        actions: mockActions,
        isEnabled: true,
        userId: 'test_user'
      })

      expect(workflow.trigger.type).toBe('event')
      expect(workflow.trigger.config.eventType).toBe('conversation.ended')
    })
  })

  describe('Action Types', () => {
    it('should execute AI prompt actions', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'ai_action_workflow',
        name: 'AI Action',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'ai_action',
            type: 'ai_prompt',
            config: {
              prompt: 'Test prompt',
              model: 'gpt-4'
            }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      await workflowService.executeWorkflow(workflow.id, {})

      expect(mockAICall).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: 'Test prompt',
          model: 'gpt-4'
        })
      )
    })

    it('should execute webhook actions', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'webhook_action_workflow',
        name: 'Webhook Action',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'webhook_action',
            type: 'webhook',
            config: {
              url: 'https://example.com/webhook',
              method: 'POST',
              body: { data: '{{input}}' }
            }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      await workflowService.executeWorkflow(workflow.id, { input: 'test data' })

      expect(mockWebhookCall).toHaveBeenCalled()
    })

    it('should execute notification actions', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'notification_action_workflow',
        name: 'Notification Action',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'notification_action',
            type: 'notification',
            config: {
              message: 'Task completed: {{result}}',
              type: 'success'
            }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      await workflowService.executeWorkflow(workflow.id, { result: 'Done' })

      expect(mockNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Task completed: Done',
          type: 'success'
        })
      )
    })

    it('should execute transform actions', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'transform_action_workflow',
        name: 'Transform Action',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'transform_action',
            type: 'transform',
            config: {
              transformation: 'uppercase',
              input: '{{text}}'
            }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      const result = await workflowService.executeWorkflow(workflow.id, { text: 'hello' })

      expect(result).toContain('HELLO')
    })

    it('should execute export actions', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'export_action_workflow',
        name: 'Export Action',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'export_action',
            type: 'export',
            config: {
              format: 'json',
              data: '{{output}}'
            }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      const result = await workflowService.executeWorkflow(workflow.id, { output: { key: 'value' } })

      expect(result).toBeDefined()
    })
  })

  describe('Scheduled Tasks', () => {
    const mockTask: Omit<ScheduledTask, 'runHistory'> = {
      id: 'test_task_1',
      workflowId: 'workflow_1',
      name: 'Test Task',
      schedule: '0 0 * * *', // Daily at midnight
      isEnabled: true,
      createdAt: Date.now(),
      lastRunAt: undefined,
      nextRunAt: undefined,
      userId: 'test_user'
    }

    describe('createScheduledTask', () => {
      it('should create a scheduled task', async () => {
        const task = await workflowService.createScheduledTask(mockTask)

        expect(task).toBeDefined()
        expect(task.id).toBe(mockTask.id)
        expect(task.schedule).toBe(mockTask.schedule)
        expect(task.runHistory).toEqual([])
      })

      it('should calculate next run time', async () => {
        const task = await workflowService.createScheduledTask(mockTask)

        expect(task.nextRunAt).toBeDefined()
        expect(task.nextRunAt!).toBeGreaterThan(Date.now())
      })

      it('should validate cron expression', async () => {
        const invalidTask = {
          ...mockTask,
          id: 'invalid_task',
          schedule: 'invalid cron'
        }

        await expect(
          workflowService.createScheduledTask(invalidTask)
        ).rejects.toThrow('Invalid cron expression')
      })
    })

    describe('getScheduledTask', () => {
      it('should retrieve a scheduled task', async () => {
        const created = await workflowService.createScheduledTask(mockTask)
        const retrieved = await workflowService.getScheduledTask(created.id)

        expect(retrieved).toBeDefined()
        expect(retrieved!.id).toBe(created.id)
      })
    })

    describe('updateScheduledTask', () => {
      it('should update task properties', async () => {
        const task = await workflowService.createScheduledTask(mockTask)

        const updated = await workflowService.updateScheduledTask(task.id, {
          schedule: '0 */6 * * *', // Every 6 hours
          isEnabled: false
        })

        expect(updated!.schedule).toBe('0 */6 * * *')
        expect(updated!.isEnabled).toBe(false)
      })
    })

    describe('deleteScheduledTask', () => {
      it('should delete a scheduled task', async () => {
        const task = await workflowService.createScheduledTask(mockTask)

        const result = await workflowService.deleteScheduledTask(task.id)
        expect(result).toBe(true)

        const retrieved = await workflowService.getScheduledTask(task.id)
        expect(retrieved).toBeNull()
      })
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing required context variables', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'missing_var_workflow',
        name: 'Missing Variable',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'action_1',
            type: 'ai_prompt',
            config: {
              prompt: 'Hello {{requiredVar}}',
              model: 'gpt-3.5-turbo'
            }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      // Should handle gracefully - either replace with empty string or throw
      const result = await workflowService.executeWorkflow(workflow.id, {})

      expect(result).toBeDefined()
    })

    it('should handle circular dependencies', async () => {
      const workflow = await workflowService.createWorkflow({
        id: 'circular_workflow',
        name: 'Circular',
        description: 'Test',
        trigger: mockTrigger,
        actions: [
          {
            id: 'action_1',
            type: 'ai_prompt',
            config: { prompt: 'Use {{action_2}}', model: 'gpt-3.5-turbo' }
          },
          {
            id: 'action_2',
            type: 'ai_prompt',
            config: { prompt: 'Use {{action_1}}', model: 'gpt-3.5-turbo' }
          }
        ],
        isEnabled: true,
        userId: 'test_user'
      })

      // Should detect and prevent circular dependencies
      await expect(
        workflowService.executeWorkflow(workflow.id, {})
      ).rejects.toThrow()
    })
  })
})
