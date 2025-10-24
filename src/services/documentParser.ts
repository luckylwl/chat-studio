import * as pdfjsLib from 'pdfjs-dist'
import * as mammoth from 'mammoth'
import * as XLSX from 'xlsx'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`

export interface ParsedDocument {
  text: string
  metadata: {
    pageCount?: number
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    producer?: string
    creationDate?: string
    modificationDate?: string
  }
  type: 'pdf' | 'docx' | 'xlsx' | 'txt'
}

/**
 * Parse PDF file and extract text content
 */
export async function parsePDF(file: File): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    const metadata = await pdf.getMetadata()
    const textContent: string[] = []

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: any) => item.str)
        .join(' ')
      textContent.push(`[Page ${pageNum}]\n${pageText}`)
    }

    return {
      text: textContent.join('\n\n'),
      metadata: {
        pageCount: pdf.numPages,
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        subject: metadata.info?.Subject,
        keywords: metadata.info?.Keywords,
        creator: metadata.info?.Creator,
        producer: metadata.info?.Producer,
        creationDate: metadata.info?.CreationDate,
        modificationDate: metadata.info?.ModDate
      },
      type: 'pdf'
    }
  } catch (error: any) {
    console.error('PDF parsing error:', error)
    throw new Error(`PDF 解析失败: ${error.message}`)
  }
}

/**
 * Parse DOCX file and extract text content
 */
export async function parseDOCX(file: File): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })

    if (result.messages.length > 0) {
      console.warn('DOCX parsing warnings:', result.messages)
    }

    return {
      text: result.value,
      metadata: {},
      type: 'docx'
    }
  } catch (error: any) {
    console.error('DOCX parsing error:', error)
    throw new Error(`Word 文档解析失败: ${error.message}`)
  }
}

/**
 * Parse XLSX file and extract data
 */
export async function parseXLSX(file: File): Promise<ParsedDocument> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })

    const textContent: string[] = []

    // Process each worksheet
    workbook.SheetNames.forEach((sheetName) => {
      const worksheet = workbook.Sheets[sheetName]

      // Convert to CSV format for easier text representation
      const csv = XLSX.utils.sheet_to_csv(worksheet)

      // Convert to JSON for structured data
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

      textContent.push(`[工作表: ${sheetName}]`)
      textContent.push(csv)
      textContent.push('')
    })

    return {
      text: textContent.join('\n'),
      metadata: {
        title: workbook.Props?.Title,
        author: workbook.Props?.Author,
        subject: workbook.Props?.Subject,
        keywords: workbook.Props?.Keywords,
        creator: workbook.Props?.Creator
      },
      type: 'xlsx'
    }
  } catch (error: any) {
    console.error('XLSX parsing error:', error)
    throw new Error(`Excel 文件解析失败: ${error.message}`)
  }
}

/**
 * Parse text file
 */
export async function parseTXT(file: File): Promise<ParsedDocument> {
  try {
    const text = await file.text()

    return {
      text,
      metadata: {},
      type: 'txt'
    }
  } catch (error: any) {
    console.error('TXT parsing error:', error)
    throw new Error(`文本文件解析失败: ${error.message}`)
  }
}

/**
 * Auto-detect file type and parse accordingly
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase()

  switch (extension) {
    case 'pdf':
      return parsePDF(file)

    case 'docx':
    case 'doc':
      return parseDOCX(file)

    case 'xlsx':
    case 'xls':
    case 'csv':
      return parseXLSX(file)

    case 'txt':
    case 'md':
    case 'markdown':
      return parseTXT(file)

    default:
      throw new Error(`不支持的文件格式: .${extension}`)
  }
}

/**
 * Format parsed document for AI consumption
 */
export function formatDocumentForAI(doc: ParsedDocument, filename: string): string {
  const parts: string[] = []

  parts.push(`📄 文档: ${filename}`)
  parts.push(`类型: ${doc.type.toUpperCase()}`)

  if (doc.metadata.pageCount) {
    parts.push(`页数: ${doc.metadata.pageCount}`)
  }

  if (doc.metadata.title) {
    parts.push(`标题: ${doc.metadata.title}`)
  }

  if (doc.metadata.author) {
    parts.push(`作者: ${doc.metadata.author}`)
  }

  parts.push('')
  parts.push('内容:')
  parts.push('---')

  // Limit text length to prevent token overflow
  const maxLength = 10000
  const text = doc.text.length > maxLength
    ? doc.text.substring(0, maxLength) + '\n\n...(内容过长，已截断)'
    : doc.text

  parts.push(text)
  parts.push('---')

  return parts.join('\n')
}

/**
 * Chunk large documents for better processing
 */
export function chunkDocument(doc: ParsedDocument, maxChunkSize: number = 2000): string[] {
  const chunks: string[] = []
  const words = doc.text.split(/\s+/)

  let currentChunk: string[] = []
  let currentLength = 0

  for (const word of words) {
    if (currentLength + word.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '))
      currentChunk = []
      currentLength = 0
    }

    currentChunk.push(word)
    currentLength += word.length + 1
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '))
  }

  return chunks
}
