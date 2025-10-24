import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  CodeBracketIcon,
  PlayIcon,
  DocumentCheckIcon,
  ArrowDownTrayIcon,
  CpuChipIcon,
  BeakerIcon,
  BugAntIcon,
  SparklesIcon,
  ClipboardIcon,
  CheckIcon
} from '@heroicons/react/24/outline'
import { Button } from './ui'
import { cn } from '@/utils'
import { toast } from 'react-hot-toast'

interface CodeTemplate {
  id: string
  name: string
  category: string
  description: string
  language: string
  template: string
  variables: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'array'
    description: string
    default?: any
  }>
  testCases?: Array<{
    input: any
    expected: any
    description: string
  }>
}

interface GeneratedCode {
  id: string
  name: string
  language: string
  code: string
  template: string
  variables: Record<string, any>
  createdAt: number
  isValid: boolean
  testResults?: Array<{
    passed: boolean
    error?: string
    output?: any
  }>
  performance?: {
    executionTime: number
    memoryUsage: number
    complexity: string
  }
}

interface SmartCodeGeneratorProps {
  onCodeGenerated?: (code: GeneratedCode) => void
  className?: string
}

export const SmartCodeGenerator: React.FC<SmartCodeGeneratorProps> = ({
  onCodeGenerated,
  className
}) => {
  const [templates, setTemplates] = useState<CodeTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<CodeTemplate | null>(null)
  const [generatedCodes, setGeneratedCodes] = useState<GeneratedCode[]>([])
  const [currentCode, setCurrentCode] = useState<GeneratedCode | null>(null)
  const [variables, setVariables] = useState<Record<string, any>>({})
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('javascript')
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  const codeEditorRef = useRef<HTMLTextAreaElement>(null)

  // 预定义代码模板
  useEffect(() => {
    const defaultTemplates: CodeTemplate[] = [
      {
        id: 'react-component',
        name: 'React组件',
        category: 'Frontend',
        description: '生成React功能组件',
        language: 'tsx',
        template: `import React, { useState } from 'react'

interface {{componentName}}Props {
  {{#each props}}
  {{name}}: {{type}}
  {{/each}}
}

export const {{componentName}}: React.FC<{{componentName}}Props> = ({
  {{#each props}}{{name}}{{#unless @last}}, {{/unless}}{{/each}}
}) => {
  {{#if hasState}}
  const [{{stateName}}, set{{capitalize stateName}}] = useState({{defaultValue}})
  {{/if}}

  return (
    <div className="{{className}}">
      <h2>{{componentName}}</h2>
      {{#if hasState}}
      <p>{{{stateName}}}</p>
      {{/if}}
    </div>
  )
}

export default {{componentName}}`,
        variables: [
          { name: 'componentName', type: 'string', description: '组件名称', default: 'MyComponent' },
          { name: 'props', type: 'array', description: '属性列表', default: [] },
          { name: 'hasState', type: 'boolean', description: '是否包含状态', default: true },
          { name: 'stateName', type: 'string', description: '状态名称', default: 'data' },
          { name: 'defaultValue', type: 'string', description: '默认值', default: "''" },
          { name: 'className', type: 'string', description: 'CSS类名', default: 'container' }
        ]
      },
      {
        id: 'api-endpoint',
        name: 'API端点',
        category: 'Backend',
        description: '生成Express API端点',
        language: 'javascript',
        template: `const express = require('express')
const router = express.Router()

{{#if hasValidation}}
const { body, validationResult } = require('express-validator')
{{/if}}

{{#if hasAuth}}
const auth = require('../middleware/auth')
{{/if}}

// {{description}}
router.{{method}}('{{path}}'{{#if hasAuth}}, auth{{/if}}{{#if hasValidation}}, [
  {{#each validations}}
  body('{{field}}').{{rule}}('{{message}}'),
  {{/each}}
]{{/if}}, async (req, res) => {
  try {
    {{#if hasValidation}}
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }
    {{/if}}

    {{#if method === 'get'}}
    const {{resourceName}} = await {{modelName}}.findAll()
    res.json({{resourceName}})
    {{else if method === 'post'}}
    const {{resourceName}} = await {{modelName}}.create(req.body)
    res.status(201).json({{resourceName}})
    {{else if method === 'put'}}
    const {{resourceName}} = await {{modelName}}.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )
    res.json({{resourceName}})
    {{else if method === 'delete'}}
    await {{modelName}}.findByIdAndDelete(req.params.id)
    res.status(204).send()
    {{/if}}

  } catch (error) {
    console.error(error)
    res.status(500).json({ error: '{{errorMessage}}' })
  }
})

module.exports = router`,
        variables: [
          { name: 'method', type: 'string', description: 'HTTP方法', default: 'get' },
          { name: 'path', type: 'string', description: 'API路径', default: '/api/users' },
          { name: 'description', type: 'string', description: '端点描述', default: '获取用户列表' },
          { name: 'resourceName', type: 'string', description: '资源名称', default: 'users' },
          { name: 'modelName', type: 'string', description: '模型名称', default: 'User' },
          { name: 'hasAuth', type: 'boolean', description: '需要认证', default: false },
          { name: 'hasValidation', type: 'boolean', description: '需要验证', default: false },
          { name: 'errorMessage', type: 'string', description: '错误消息', default: '服务器内部错误' }
        ]
      },
      {
        id: 'algorithm',
        name: '算法实现',
        category: 'Algorithm',
        description: '生成算法实现',
        language: 'python',
        template: `def {{algorithmName}}({{parameters}}):
    """
    {{description}}

    Args:
        {{#each args}}
        {{name}} ({{type}}): {{description}}
        {{/each}}

    Returns:
        {{returnType}}: {{returnDescription}}

    Time Complexity: O({{timeComplexity}})
    Space Complexity: O({{spaceComplexity}})
    """
    {{#if hasValidation}}
    # Input validation
    {{#each validations}}
    if {{condition}}:
        raise ValueError("{{message}}")
    {{/each}}
    {{/if}}

    # Algorithm implementation
    {{implementation}}

    return result


{{#if hasTests}}
# Test cases
if __name__ == "__main__":
    {{#each testCases}}
    # Test case {{@index}}
    result = {{../algorithmName}}({{input}})
    assert result == {{expected}}, f"Expected {{expected}}, got {result}"
    print(f"Test {{@index}} passed: {{description}}")
    {{/each}}

    print("All tests passed!")
{{/if}}`,
        variables: [
          { name: 'algorithmName', type: 'string', description: '算法名称', default: 'binary_search' },
          { name: 'parameters', type: 'string', description: '参数列表', default: 'arr, target' },
          { name: 'description', type: 'string', description: '算法描述', default: '二分查找算法' },
          { name: 'timeComplexity', type: 'string', description: '时间复杂度', default: 'log n' },
          { name: 'spaceComplexity', type: 'string', description: '空间复杂度', default: '1' },
          { name: 'implementation', type: 'string', description: '具体实现', default: 'pass  # TODO: 实现算法' },
          { name: 'hasValidation', type: 'boolean', description: '包含输入验证', default: true },
          { name: 'hasTests', type: 'boolean', description: '包含测试用例', default: true }
        ]
      },
      {
        id: 'database-schema',
        name: '数据库模式',
        category: 'Database',
        description: '生成数据库表结构',
        language: 'sql',
        template: `-- {{tableName}} 表结构
CREATE TABLE {{tableName}} (
    {{#each columns}}
    {{name}} {{type}}{{#if notNull}} NOT NULL{{/if}}{{#if primaryKey}} PRIMARY KEY{{/if}}{{#if autoIncrement}} AUTO_INCREMENT{{/if}},
    {{/each}}

    {{#if hasIndexes}}
    -- 索引
    {{#each indexes}}
    INDEX idx_{{name}} ({{columns}}),
    {{/each}}
    {{/if}}

    {{#if hasForeignKeys}}
    -- 外键约束
    {{#each foreignKeys}}
    CONSTRAINT fk_{{name}} FOREIGN KEY ({{column}}) REFERENCES {{referenceTable}}({{referenceColumn}}){{#if onDelete}} ON DELETE {{onDelete}}{{/if}},
    {{/each}}
    {{/if}}

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

{{#if hasComments}}
-- 表注释
ALTER TABLE {{tableName}} COMMENT = '{{tableComment}}';

-- 字段注释
{{#each columnComments}}
ALTER TABLE {{../tableName}} MODIFY COLUMN {{column}} {{type}} COMMENT '{{comment}}';
{{/each}}
{{/if}}`,
        variables: [
          { name: 'tableName', type: 'string', description: '表名', default: 'users' },
          { name: 'tableComment', type: 'string', description: '表注释', default: '用户信息表' },
          { name: 'columns', type: 'array', description: '字段列表', default: [] },
          { name: 'hasIndexes', type: 'boolean', description: '包含索引', default: false },
          { name: 'hasForeignKeys', type: 'boolean', description: '包含外键', default: false },
          { name: 'hasComments', type: 'boolean', description: '包含注释', default: true }
        ]
      }
    ]

    setTemplates(defaultTemplates)
  }, [])

  // AI代码生成
  const generateCode = useCallback(async () => {
    if (!selectedTemplate && !customPrompt) {
      toast.error('请选择模板或输入自定义提示')
      return
    }

    setIsGenerating(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 2000)) // 模拟AI生成

      let generatedCode = ''

      if (selectedTemplate) {
        // 基于模板生成
        generatedCode = processTemplate(selectedTemplate.template, variables)
      } else {
        // 基于自定义提示生成
        generatedCode = await generateFromPrompt(customPrompt, selectedLanguage)
      }

      const newCode: GeneratedCode = {
        id: `code_${Date.now()}`,
        name: selectedTemplate?.name || `自定义代码 ${new Date().toLocaleTimeString()}`,
        language: selectedTemplate?.language || selectedLanguage,
        code: generatedCode,
        template: selectedTemplate?.id || 'custom',
        variables: { ...variables },
        createdAt: Date.now(),
        isValid: true
      }

      setGeneratedCodes(prev => [newCode, ...prev])
      setCurrentCode(newCode)
      onCodeGenerated?.(newCode)

      toast.success('代码生成完成')

    } catch (error) {
      toast.error('代码生成失败')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }, [selectedTemplate, customPrompt, variables, selectedLanguage, onCodeGenerated])

  // 简单模板处理
  const processTemplate = (template: string, vars: Record<string, any>): string => {
    let result = template

    // 替换简单变量
    Object.entries(vars).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      result = result.replace(regex, String(value))
    })

    // 简单条件处理
    result = result.replace(/{{#if (\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, content) => {
      return vars[condition] ? content : ''
    })

    // 简单循环处理
    result = result.replace(/{{#each (\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, content) => {
      const array = vars[arrayName]
      if (!Array.isArray(array)) return ''

      return array.map(item => {
        let itemContent = content
        if (typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
          })
        }
        return itemContent
      }).join('')
    })

    return result
  }

  // 基于提示生成代码
  const generateFromPrompt = async (prompt: string, language: string): Promise<string> => {
    // 模拟AI生成逻辑
    const codeTemplates: Record<string, string> = {
      javascript: `// ${prompt}
function generatedFunction() {
  // TODO: 实现具体功能
  console.log('Generated from prompt: ${prompt}')
}

export default generatedFunction`,

      python: `# ${prompt}
def generated_function():
    """
    Generated from prompt: ${prompt}
    """
    # TODO: 实现具体功能
    print("Generated from prompt: ${prompt}")

if __name__ == "__main__":
    generated_function()`,

      java: `// ${prompt}
public class GeneratedClass {
    public void generatedMethod() {
        // TODO: 实现具体功能
        System.out.println("Generated from prompt: ${prompt}");
    }
}`,

      typescript: `// ${prompt}
interface GeneratedInterface {
  // TODO: 定义接口
}

class GeneratedClass implements GeneratedInterface {
  public generatedMethod(): void {
    // TODO: 实现具体功能
    console.log('Generated from prompt: ${prompt}')
  }
}`
    }

    return codeTemplates[language] || codeTemplates.javascript
  }

  // 运行代码测试
  const runTests = useCallback(async () => {
    if (!currentCode || !selectedTemplate?.testCases) {
      toast.error('没有可用的测试用例')
      return
    }

    setIsTesting(true)

    try {
      await new Promise(resolve => setTimeout(resolve, 1500))

      const testResults = selectedTemplate.testCases.map(testCase => {
        // 模拟测试执行
        const passed = Math.random() > 0.2 // 80%成功率
        return {
          passed,
          error: passed ? undefined : 'Test failed: unexpected output',
          output: passed ? testCase.expected : 'actual output'
        }
      })

      const updatedCode = {
        ...currentCode,
        testResults,
        performance: {
          executionTime: Math.random() * 100,
          memoryUsage: Math.random() * 1024,
          complexity: 'O(n)'
        }
      }

      setCurrentCode(updatedCode)
      setGeneratedCodes(prev => prev.map(c => c.id === updatedCode.id ? updatedCode : c))

      const passedTests = testResults.filter(r => r.passed).length
      const totalTests = testResults.length

      if (passedTests === totalTests) {
        toast.success(`所有测试通过 (${passedTests}/${totalTests})`)
      } else {
        toast.error(`测试失败 (${passedTests}/${totalTests})`)
      }

    } catch (error) {
      toast.error('测试运行失败')
      console.error(error)
    } finally {
      setIsTesting(false)
    }
  }, [currentCode, selectedTemplate])

  // 复制代码
  const copyCode = useCallback(async (codeId: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedStates(prev => ({ ...prev, [codeId]: true }))
      toast.success('代码已复制到剪贴板')

      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [codeId]: false }))
      }, 2000)
    } catch (error) {
      toast.error('复制失败')
    }
  }, [])

  // 下载代码文件
  const downloadCode = useCallback((code: GeneratedCode) => {
    const extensions: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      tsx: 'tsx',
      python: 'py',
      java: 'java',
      sql: 'sql'
    }

    const extension = extensions[code.language] || 'txt'
    const blob = new Blob([code.code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${code.name.replace(/\s+/g, '_')}.${extension}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast.success('代码文件已下载')
  }, [])

  return (
    <div className={cn("h-full flex flex-col bg-white dark:bg-gray-900", className)}>
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <SparklesIcon className="h-6 w-6 text-indigo-500" />
          智能代码生成器
        </h2>

        <div className="flex items-center gap-2">
          <Button
            onClick={generateCode}
            disabled={isGenerating}
            className="gap-2"
          >
            <CpuChipIcon className="h-4 w-4" />
            {isGenerating ? '生成中...' : '生成代码'}
          </Button>

          {currentCode && selectedTemplate?.testCases && (
            <Button
              onClick={runTests}
              disabled={isTesting}
              variant="outline"
              className="gap-2"
            >
              <BeakerIcon className="h-4 w-4" />
              {isTesting ? '测试中...' : '运行测试'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 flex">
        {/* 左侧配置面板 */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
          {/* 模板选择 */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">选择模板</h3>
            <div className="space-y-2">
              {templates.map(template => (
                <div
                  key={template.id}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedTemplate?.id === template.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  onClick={() => {
                    setSelectedTemplate(template)
                    setCustomPrompt('')

                    // 初始化变量默认值
                    const defaultVars: Record<string, any> = {}
                    template.variables.forEach(variable => {
                      defaultVars[variable.name] = variable.default
                    })
                    setVariables(defaultVars)
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{template.name}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                      {template.language}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{template.description}</p>
                  <div className="text-xs text-gray-400 mt-1">{template.category}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 自定义提示 */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">或者自定义生成</h3>
            <div className="space-y-3">
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="tsx">TypeScript React</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="sql">SQL</option>
              </select>

              <textarea
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value)
                  if (e.target.value) setSelectedTemplate(null)
                }}
                placeholder="描述您想要生成的代码..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
              />
            </div>
          </div>

          {/* 模板变量配置 */}
          {selectedTemplate && (
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">配置参数</h3>
              <div className="space-y-3">
                {selectedTemplate.variables.map(variable => (
                  <div key={variable.name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {variable.name}
                    </label>
                    <p className="text-xs text-gray-500 mb-2">{variable.description}</p>

                    {variable.type === 'boolean' ? (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={variables[variable.name] || false}
                          onChange={(e) => setVariables(prev => ({
                            ...prev,
                            [variable.name]: e.target.checked
                          }))}
                          className="mr-2"
                        />
                        启用
                      </label>
                    ) : variable.type === 'number' ? (
                      <input
                        type="number"
                        value={variables[variable.name] || ''}
                        onChange={(e) => setVariables(prev => ({
                          ...prev,
                          [variable.name]: parseFloat(e.target.value) || 0
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                      />
                    ) : (
                      <input
                        type="text"
                        value={variables[variable.name] || ''}
                        onChange={(e) => setVariables(prev => ({
                          ...prev,
                          [variable.name]: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 中间代码编辑区 */}
        <div className="flex-1 flex flex-col">
          {currentCode ? (
            <>
              {/* 代码头部信息 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">{currentCode.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                    <span>{currentCode.language}</span>
                    <span>{new Date(currentCode.createdAt).toLocaleString()}</span>
                    {currentCode.performance && (
                      <span>{currentCode.performance.executionTime.toFixed(1)}ms</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => copyCode(currentCode.id, currentCode.code)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    {copiedStates[currentCode.id] ? (
                      <CheckIcon className="h-4 w-4 text-green-500" />
                    ) : (
                      <ClipboardIcon className="h-4 w-4" />
                    )}
                    {copiedStates[currentCode.id] ? '已复制' : '复制'}
                  </Button>

                  <Button
                    onClick={() => downloadCode(currentCode)}
                    variant="outline"
                    size="sm"
                    className="gap-2"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    下载
                  </Button>
                </div>
              </div>

              {/* 代码编辑器 */}
              <div className="flex-1 relative">
                <textarea
                  ref={codeEditorRef}
                  value={currentCode.code}
                  onChange={(e) => {
                    const updatedCode = { ...currentCode, code: e.target.value }
                    setCurrentCode(updatedCode)
                    setGeneratedCodes(prev => prev.map(c => c.id === updatedCode.id ? updatedCode : c))
                  }}
                  className="w-full h-full p-4 font-mono text-sm border-0 resize-none focus:outline-none bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  spellCheck={false}
                />
              </div>

              {/* 测试结果 */}
              {currentCode.testResults && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="font-medium text-sm text-gray-900 dark:text-gray-100 mb-3">测试结果</h4>
                  <div className="space-y-2">
                    {currentCode.testResults.map((result, index) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded text-sm",
                          result.passed
                            ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                            : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                        )}
                      >
                        {result.passed ? (
                          <DocumentCheckIcon className="h-4 w-4" />
                        ) : (
                          <BugAntIcon className="h-4 w-4" />
                        )}
                        <span>测试 {index + 1}: {result.passed ? '通过' : '失败'}</span>
                        {result.error && <span className="text-xs">({result.error})</span>}
                      </div>
                    ))}
                  </div>

                  {currentCode.performance && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <h5 className="font-medium text-xs text-gray-700 dark:text-gray-300 mb-2">性能指标</h5>
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500">执行时间</span>
                          <p className="font-mono">{currentCode.performance.executionTime.toFixed(2)}ms</p>
                        </div>
                        <div>
                          <span className="text-gray-500">内存使用</span>
                          <p className="font-mono">{currentCode.performance.memoryUsage.toFixed(0)}KB</p>
                        </div>
                        <div>
                          <span className="text-gray-500">时间复杂度</span>
                          <p className="font-mono">{currentCode.performance.complexity}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <CodeBracketIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">开始生成代码</p>
                <p className="text-sm">选择模板或输入自定义提示，然后点击"生成代码"</p>
              </div>
            </div>
          )}
        </div>

        {/* 右侧历史记录 */}
        <div className="w-64 border-l border-gray-200 dark:border-gray-700 p-4">
          <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">历史记录</h3>

          <div className="space-y-2">
            {generatedCodes.map(code => (
              <div
                key={code.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors",
                  currentCode?.id === code.id
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                    : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
                onClick={() => setCurrentCode(code)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-xs truncate">{code.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      copyCode(code.id, code.code)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <ClipboardIcon className="h-3 w-3" />
                  </button>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{code.language}</span>
                  <span>{new Date(code.createdAt).toLocaleTimeString()}</span>
                </div>
                {code.testResults && (
                  <div className="text-xs text-gray-400 mt-1">
                    {code.testResults.filter(r => r.passed).length}/{code.testResults.length} 测试通过
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartCodeGenerator