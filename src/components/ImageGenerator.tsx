import React, { useState } from 'react'
import { SparklesIcon, PhotoIcon, ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { Button, Textarea, Card } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'
import { useAppStore } from '@/store'
import { createVisionService } from '@/services/visionApi'
import type { ImageGenerationRequest } from '@/services/visionApi'

const ImageGenerator: React.FC = () => {
  const [prompt, setPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImages, setGeneratedImages] = useState<Array<{
    id: string
    url: string
    base64?: string
    revisedPrompt?: string
  }>>([])
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024')
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard')
  const [style, setStyle] = useState<'vivid' | 'natural'>('vivid')
  const [selectedImage, setSelectedImage] = useState<string | null>(null)

  const { apiProviders } = useAppStore()

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('请输入图片描述')
      return
    }

    // Find OpenAI provider
    const openaiProvider = apiProviders.find(p => p.id === 'openai' && p.isEnabled)

    if (!openaiProvider || !openaiProvider.apiKey) {
      toast.error('请配置 OpenAI API 密钥以使用图片生成功能')
      return
    }

    setIsGenerating(true)

    try {
      const visionService = createVisionService(openaiProvider)

      const request: ImageGenerationRequest = {
        prompt: prompt.trim(),
        model: 'dall-e-3',
        n: 1,
        size,
        quality,
        style
      }

      const response = await visionService.generateImage(request)

      const newImages = response.data.map((item, index) => ({
        id: `img-${Date.now()}-${index}`,
        url: item.url || `data:image/png;base64,${item.b64_json}`,
        base64: item.b64_json,
        revisedPrompt: item.revised_prompt
      }))

      setGeneratedImages(prev => [...newImages, ...prev])
      toast.success('图片生成成功！')
    } catch (error: any) {
      console.error('Image generation error:', error)
      toast.error(`图片生成失败: ${error.message}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadImage = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `generated-image-${index + 1}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('图片下载成功！')
    } catch (error) {
      toast.error('下载失败，请尝试右键保存图片')
    }
  }

  const removeImage = (id: string) => {
    setGeneratedImages(prev => prev.filter(img => img.id !== id))
  }

  const clearAll = () => {
    setGeneratedImages([])
    setPrompt('')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <SparklesIcon className="w-5 h-5 text-primary-500" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          AI 图片生成
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
          DALL-E 3
        </span>
      </div>

      {/* Prompt Input */}
      <Card className="p-4 space-y-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想生成的图片... 例如: 一只可爱的猫咪坐在月球上，周围有星星，卡通风格"
          className="min-h-[100px] resize-none"
          disabled={isGenerating}
        />

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Size */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              尺寸
            </label>
            <select
              value={size}
              onChange={(e) => setSize(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isGenerating}
            >
              <option value="1024x1024">正方形 (1024×1024)</option>
              <option value="1792x1024">横向 (1792×1024)</option>
              <option value="1024x1792">纵向 (1024×1792)</option>
            </select>
          </div>

          {/* Quality */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              质量
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isGenerating}
            >
              <option value="standard">标准</option>
              <option value="hd">高清 (HD)</option>
            </select>
          </div>

          {/* Style */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              风格
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={isGenerating}
            >
              <option value="vivid">生动 (Vivid)</option>
              <option value="natural">自然 (Natural)</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              生成中...
            </>
          ) : (
            <>
              <SparklesIcon className="w-4 h-4 mr-2" />
              生成图片
            </>
          )}
        </Button>
      </Card>

      {/* Generated Images */}
      {generatedImages.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              生成的图片 ({generatedImages.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-8 text-xs"
            >
              清空全部
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {generatedImages.map((image, index) => (
              <Card key={image.id} className="p-3 space-y-3">
                {/* Image */}
                <div
                  className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 cursor-pointer"
                  onClick={() => setSelectedImage(image.url)}
                >
                  <img
                    src={image.url}
                    alt={`Generated ${index + 1}`}
                    className="w-full h-auto object-contain"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        downloadImage(image.url, index)
                      }}
                      className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white"
                      title="下载"
                    >
                      <ArrowDownTrayIcon className="w-5 h-5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeImage(image.id)
                      }}
                      className="h-10 w-10 p-0 bg-white/20 hover:bg-white/30 text-white"
                      title="删除"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Revised Prompt */}
                {image.revisedPrompt && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                      优化后的提示词:
                    </label>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                      {image.revisedPrompt}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-6xl max-h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 h-10 w-10 p-0 text-white hover:bg-white/20"
            >
              <XMarkIcon className="w-6 h-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ImageGenerator
