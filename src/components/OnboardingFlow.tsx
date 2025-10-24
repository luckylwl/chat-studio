import React, { useState } from 'react'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from './ui'
import { useAppStore } from '@/store'
import { toast } from 'react-hot-toast'
import {
  CheckIcon,
  CpuChipIcon,
  KeyIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { generateId } from '@/utils'
import type { APIProvider } from '@/types'

interface OnboardingFlowProps {
  onComplete: () => void
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1)
  const [apiConfig, setApiConfig] = useState({
    name: '',
    baseURL: '',
    apiKey: '',
    modelId: '',
    modelName: ''
  })

  const { addAPIProvider, setUser, user } = useAppStore()

  const steps = [
    {
      title: '欢迎使用 AI Chat Studio',
      description: '让我们花2分钟设置您的第一个AI模型',
      icon: <SparklesIcon className="h-8 w-8" />
    },
    {
      title: '配置API提供商',
      description: '添加您的AI服务API信息',
      icon: <KeyIcon className="h-8 w-8" />
    },
    {
      title: '创建您的模型',
      description: '为您的AI助手起个名字',
      icon: <CpuChipIcon className="h-8 w-8" />
    },
    {
      title: '完成设置',
      description: '一切就绪，开始对话吧！',
      icon: <ChatBubbleLeftRightIcon className="h-8 w-8" />
    }
  ]

  const handleNext = () => {
    if (step === 2) {
      // 验证API配置
      if (!apiConfig.baseURL || !apiConfig.apiKey) {
        toast.error('请填写完整的API信息')
        return
      }
    }

    if (step === 3) {
      // 验证模型配置
      if (!apiConfig.modelId || !apiConfig.modelName) {
        toast.error('请填写模型信息')
        return
      }
    }

    if (step === 4) {
      // 完成配置
      handleComplete()
      return
    }

    setStep(step + 1)
  }

  const handleComplete = () => {
    try {
      const providerId = generateId()

      const newProvider: APIProvider = {
        id: providerId,
        name: apiConfig.name || 'My API Provider',
        baseURL: apiConfig.baseURL,
        apiKey: apiConfig.apiKey,
        models: [{
          id: apiConfig.modelId,
          name: apiConfig.modelName,
          provider: providerId,
          maxTokens: 4096,
          description: '通过引导流程配置的模型'
        }],
        isEnabled: true
      }

      addAPIProvider(newProvider)

      // 设置为默认模型
      if (user) {
        setUser({
          ...user,
          preferences: {
            ...user.preferences,
            defaultModel: apiConfig.modelId
          }
        })
      }

      toast.success('🎉 配置完成！欢迎使用 AI Chat Studio')
      onComplete()
    } catch (error) {
      toast.error('配置失败，请重试')
    }
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6">
              <SparklesIcon className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              欢迎使用 AI Chat Studio
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
              一个现代化、功能丰富的AI对话应用。支持多种AI模型，自定义配置，让您的AI体验更加个性化。
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <CpuChipIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">多模型支持</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <KeyIcon className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">自定义API</span>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">智能对话</span>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                配置您的API
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                请填写您的AI服务API信息
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API名称 (可选)
                </label>
                <Input
                  value={apiConfig.name}
                  onChange={(e) => setApiConfig({ ...apiConfig, name: e.target.value })}
                  placeholder="例如: 我的OpenAI API"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Base URL *
                </label>
                <Input
                  value={apiConfig.baseURL}
                  onChange={(e) => setApiConfig({ ...apiConfig, baseURL: e.target.value })}
                  placeholder="https://wukong-api.laiyewk.com/v1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  您刚才配置的: https://wukong-api.laiyewk.com/v1
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  API Key *
                </label>
                <Input
                  type="password"
                  value={apiConfig.apiKey}
                  onChange={(e) => setApiConfig({ ...apiConfig, apiKey: e.target.value })}
                  placeholder="sk-..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  您刚才的API Key可以直接粘贴到这里
                </p>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                创建您的模型
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                为您的AI助手取个好听的名字
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  模型ID *
                </label>
                <Input
                  value={apiConfig.modelId}
                  onChange={(e) => setApiConfig({ ...apiConfig, modelId: e.target.value })}
                  placeholder="gpt-3.5-turbo"
                />
                <p className="text-xs text-gray-500 mt-1">
                  建议: gpt-3.5-turbo, gpt-4, 或您API支持的模型名
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  显示名称 *
                </label>
                <Input
                  value={apiConfig.modelName}
                  onChange={(e) => setApiConfig({ ...apiConfig, modelName: e.target.value })}
                  placeholder="我的智能助手"
                />
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="text-center py-8">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckIcon className="h-12 w-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              一切就绪！
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              您的AI模型已配置完成，现在可以开始精彩的对话了！
            </p>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">配置摘要:</h4>
              <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <p>• API: {apiConfig.name || '自定义API'}</p>
                <p>• 模型: {apiConfig.modelName}</p>
                <p>• 地址: {apiConfig.baseURL}</p>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          {/* 进度指示器 */}
          <div className="flex items-center justify-center mb-6">
            {steps.map((_, index) => (
              <React.Fragment key={index}>
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                  ${index + 1 <= step
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-400'
                  }
                `}>
                  {index + 1 < step ? (
                    <CheckIcon className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-16 h-0.5 transition-all
                    ${index + 1 < step ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}
                  `} />
                )}
              </React.Fragment>
            ))}
          </div>

          <CardTitle className="text-center">
            第 {step} 步，共 {steps.length} 步
          </CardTitle>
        </CardHeader>

        <CardContent>
          {renderStepContent()}

          {/* 操作按钮 */}
          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onComplete()}
              disabled={step === 1}
            >
              {step === 1 ? '跳过引导' : '上一步'}
            </Button>

            <Button
              onClick={handleNext}
              className="min-w-[100px]"
            >
              {step === 4 ? '开始使用' : '下一步'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default OnboardingFlow