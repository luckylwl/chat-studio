import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import { useAppStore } from '@/store'
import { toast } from 'react-hot-toast'
import { generateId } from '@/utils'
import type { APIProvider } from '@/types'

const QuickSetup: React.FC = () => {
  const navigate = useNavigate()
  const { addAPIProvider, setUser, user } = useAppStore()

  const [config, setConfig] = useState({
    baseURL: 'https://api.example.com/v1',
    apiKey: '',
    modelId: 'gpt-3.5-turbo',
    modelName: 'My Custom Model'
  })

  const handleQuickSetup = () => {
    try {
      const providerId = generateId()

      const newProvider: APIProvider = {
        id: providerId,
        name: 'Wukong API',
        baseURL: config.baseURL,
        apiKey: config.apiKey,
        models: [{
          id: config.modelId,
          name: config.modelName,
          provider: providerId,
          maxTokens: 4096,
          description: '快速配置的Wukong模型'
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
            defaultModel: config.modelId
          }
        })
      }

      toast.success('配置成功！正在跳转...')

      setTimeout(() => {
        navigate('/chat')
      }, 1000)

    } catch (error) {
      toast.error('配置失败，请重试')
      console.error(error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            快速配置 AI Chat Studio
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            一键配置你的Wukong API
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Base URL
            </label>
            <Input
              value={config.baseURL}
              onChange={(e) => setConfig({ ...config, baseURL: e.target.value })}
              placeholder="API Base URL"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <Input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="API Key"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                模型ID
              </label>
              <Input
                value={config.modelId}
                onChange={(e) => setConfig({ ...config, modelId: e.target.value })}
                placeholder="gpt-3.5-turbo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                显示名称
              </label>
              <Input
                value={config.modelName}
                onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                placeholder="模型名称"
              />
            </div>
          </div>

          <Button
            onClick={handleQuickSetup}
            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-2.5"
            size="lg"
          >
            立即配置并开始使用
          </Button>

          <div className="text-center mt-4">
            <button
              onClick={() => navigate('/chat')}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              跳过，直接进入应用
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default QuickSetup