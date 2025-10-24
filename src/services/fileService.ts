import { toast } from 'react-hot-toast'

export interface FileAnalysisResult {
  fileName: string
  fileType: string
  size: number
  content?: string
  summary?: string
  metadata?: Record<string, any>
  thumbnail?: string
}

export interface UploadedFile {
  id: string
  file: File
  analysisResult?: FileAnalysisResult
  uploadTime: number
  status: 'uploading' | 'analyzing' | 'completed' | 'error'
  error?: string
}

class FileService {
  private maxFileSize = 50 * 1024 * 1024 // 50MB
  private supportedTypes = {
    images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'],
    documents: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'text/markdown',
      'application/rtf'
    ],
    code: [
      'text/javascript',
      'text/typescript',
      'text/html',
      'text/css',
      'application/json',
      'text/xml',
      'application/xml'
    ]
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (file.size > this.maxFileSize) {
      return {
        valid: false,
        error: `文件大小超过限制（${Math.round(this.maxFileSize / 1024 / 1024)}MB）`
      }
    }

    const allSupportedTypes = [
      ...this.supportedTypes.images,
      ...this.supportedTypes.documents,
      ...this.supportedTypes.code
    ]

    if (!allSupportedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '不支持的文件类型'
      }
    }

    return { valid: true }
  }

  async analyzeFile(file: File): Promise<FileAnalysisResult> {
    const result: FileAnalysisResult = {
      fileName: file.name,
      fileType: file.type,
      size: file.size,
      metadata: {
        lastModified: file.lastModified,
        lastModifiedDate: new Date(file.lastModified).toISOString()
      }
    }

    try {
      if (this.supportedTypes.images.includes(file.type)) {
        return await this.analyzeImage(file, result)
      } else if (this.supportedTypes.documents.includes(file.type)) {
        return await this.analyzeDocument(file, result)
      } else if (this.supportedTypes.code.includes(file.type)) {
        return await this.analyzeCode(file, result)
      }

      throw new Error('Unsupported file type')
    } catch (error) {
      throw new Error(`文件分析失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  private async analyzeImage(file: File, result: FileAnalysisResult): Promise<FileAnalysisResult> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')

      img.onload = () => {
        // 生成缩略图
        const maxThumbnailSize = 200
        const ratio = Math.min(maxThumbnailSize / img.width, maxThumbnailSize / img.height)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio

        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

        result.thumbnail = canvas.toDataURL('image/jpeg', 0.8)
        result.metadata = {
          ...result.metadata,
          dimensions: { width: img.width, height: img.height },
          aspectRatio: (img.width / img.height).toFixed(2)
        }
        result.summary = `图片尺寸: ${img.width}x${img.height}像素，文件大小: ${this.formatFileSize(file.size)}`

        resolve(result)
      }

      img.onerror = () => {
        reject(new Error('无法加载图片'))
      }

      img.src = URL.createObjectURL(file)
    })
  }

  private async analyzeDocument(file: File, result: FileAnalysisResult): Promise<FileAnalysisResult> {
    if (file.type === 'text/plain' || file.type === 'text/markdown') {
      const text = await file.text()
      result.content = text
      result.summary = this.generateTextSummary(text)
      result.metadata = {
        ...result.metadata,
        wordCount: text.split(/\s+/).length,
        lineCount: text.split('\n').length,
        charCount: text.length
      }
    } else if (file.type === 'application/pdf') {
      // PDF analysis - would need pdf-parse or similar library
      result.summary = `PDF文档，大小: ${this.formatFileSize(file.size)}`
      result.content = '[PDF内容需要专门的解析器]'
    } else if (file.type.includes('word')) {
      // Word document analysis - would need mammoth or similar library
      result.summary = `Word文档，大小: ${this.formatFileSize(file.size)}`
      result.content = '[Word文档内容需要专门的解析器]'
    }

    return result
  }

  private async analyzeCode(file: File, result: FileAnalysisResult): Promise<FileAnalysisResult> {
    const text = await file.text()
    result.content = text

    const lines = text.split('\n')
    const nonEmptyLines = lines.filter(line => line.trim().length > 0)
    const commentLines = lines.filter(line => {
      const trimmed = line.trim()
      return trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('#')
    })

    result.metadata = {
      ...result.metadata,
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      language: this.detectLanguage(file.name, file.type)
    }

    result.summary = `${result.metadata.language}代码文件，${lines.length}行，包含${commentLines.length}行注释`

    return result
  }

  private detectLanguage(fileName: string, mimeType: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase()

    const languageMap: Record<string, string> = {
      'js': 'JavaScript',
      'ts': 'TypeScript',
      'jsx': 'React JSX',
      'tsx': 'React TSX',
      'html': 'HTML',
      'css': 'CSS',
      'scss': 'SCSS',
      'less': 'LESS',
      'json': 'JSON',
      'xml': 'XML',
      'py': 'Python',
      'java': 'Java',
      'cpp': 'C++',
      'c': 'C',
      'cs': 'C#',
      'php': 'PHP',
      'rb': 'Ruby',
      'go': 'Go',
      'rs': 'Rust',
      'swift': 'Swift',
      'kt': 'Kotlin'
    }

    return ext ? (languageMap[ext] || ext.toUpperCase()) : '未知'
  }

  private generateTextSummary(text: string): string {
    const words = text.split(/\s+/).length
    const chars = text.length
    const lines = text.split('\n').length

    let summary = `${words}个词，${chars}个字符，${lines}行`

    // 简单的内容预览
    const preview = text.substring(0, 100)
    if (text.length > 100) {
      summary += `\n内容预览: ${preview}...`
    }

    return summary
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  async uploadAndAnalyze(file: File): Promise<UploadedFile> {
    const uploadedFile: UploadedFile = {
      id: Date.now().toString(),
      file,
      uploadTime: Date.now(),
      status: 'uploading'
    }

    try {
      // 验证文件
      const validation = this.validateFile(file)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      uploadedFile.status = 'analyzing'

      // 分析文件
      const analysisResult = await this.analyzeFile(file)
      uploadedFile.analysisResult = analysisResult
      uploadedFile.status = 'completed'

      toast.success(`文件 ${file.name} 上传并分析完成`)

      return uploadedFile
    } catch (error) {
      uploadedFile.status = 'error'
      uploadedFile.error = error instanceof Error ? error.message : '未知错误'
      toast.error(`文件处理失败: ${uploadedFile.error}`)
      throw error
    }
  }

  // 批量上传
  async uploadMultiple(files: FileList): Promise<UploadedFile[]> {
    const results: UploadedFile[] = []

    for (let i = 0; i < files.length; i++) {
      try {
        const result = await this.uploadAndAnalyze(files[i])
        results.push(result)
      } catch (error) {
        // 继续处理其他文件
        console.error(`Failed to process file ${files[i].name}:`, error)
      }
    }

    return results
  }

  // 将文件内容转换为AI可理解的格式
  formatForAI(uploadedFile: UploadedFile): string {
    const { analysisResult } = uploadedFile
    if (!analysisResult) return ''

    let content = `📎 文件: ${analysisResult.fileName}\n`
    content += `📋 类型: ${analysisResult.fileType}\n`
    content += `📏 大小: ${this.formatFileSize(analysisResult.size)}\n`

    if (analysisResult.summary) {
      content += `📝 摘要: ${analysisResult.summary}\n`
    }

    if (analysisResult.content) {
      content += `\n📄 内容:\n${analysisResult.content}\n`
    }

    if (analysisResult.metadata) {
      content += `\n📊 元数据:\n${JSON.stringify(analysisResult.metadata, null, 2)}\n`
    }

    return content
  }
}

export const fileService = new FileService()