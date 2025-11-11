import fs from 'fs'
import path from 'path'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText, tool, stepCountIs } from 'ai'
import { z } from 'zod'

let apiKey: string | null = null

export function setApiKey(key: string) {
  apiKey = key
}

export function hasApiKey(): boolean {
  return apiKey !== null
}

export interface FileContext {
  path: string
  content: string
}

export async function readFiles(filePaths: string[]): Promise<FileContext[]> {
  const files: FileContext[] = []

  for (const filePath of filePaths) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      files.push({ path: filePath, content })
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error)
    }
  }

  return files
}

export interface ToolCall {
  toolName: string
  input: Record<string, unknown>
  output: unknown
}

export interface MessageResponse {
  text: string
  toolCalls: ToolCall[]
}

interface SendMessageOptions {
  allowedFilePaths?: string[]
  importedRootPaths?: string[]
}

function resolveRequestedPath(
  requestedPath: string,
  allowedPathSet: Set<string>,
  allowedPathList: string[],
  importedRootPaths: string[]
): string | null {
  if (!requestedPath || requestedPath.trim().length === 0) {
    return null
  }

  const directResolved = path.resolve(requestedPath)
  if (allowedPathSet.has(directResolved)) {
    return directResolved
  }

  const sanitized = requestedPath
    .trim()
    .replace(/^[./\\]+/, '')

  const candidatePaths: string[] = []

  for (const root of importedRootPaths) {
    const resolvedRoot = path.resolve(root)
    const rootName = path.basename(resolvedRoot)
    const lowerSanitized = sanitized.toLowerCase()
    const rootPrefix = `${rootName.toLowerCase()}${path.sep}`

    let relativePortion = sanitized
    if (lowerSanitized.startsWith(rootPrefix)) {
      relativePortion = sanitized.slice(rootName.length + 1)
    }

    candidatePaths.push(path.join(resolvedRoot, relativePortion))
    candidatePaths.push(path.join(resolvedRoot, sanitized))
  }

  for (const candidate of candidatePaths) {
    const resolvedCandidate = path.resolve(candidate)
    if (allowedPathSet.has(resolvedCandidate)) {
      return resolvedCandidate
    }
  }

  const requestedBase = path.basename(sanitized).toLowerCase()
  if (!requestedBase) {
    return null
  }

  const matchingPaths = allowedPathList.filter(
    (allowedPath) => path.basename(allowedPath).toLowerCase() === requestedBase
  )

  if (matchingPaths.length === 1) {
    return matchingPaths[0]
  }

  return null
}

export async function sendMessage(
  userMessage: string,
  files: FileContext[],
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  options: SendMessageOptions = {}
): Promise<MessageResponse> {
  const { allowedFilePaths = [], importedRootPaths = [] } = options

  if (!apiKey) {
    throw new Error('API key not set. Please configure your OpenRouter API key.')
  }

  const openrouter = createOpenRouter({
    apiKey,
  })

  // Build context from files
  let fileContext = ''
  if (files.length > 0) {
    fileContext = '\n\nContext from selected files:\n'
    fileContext += files
      .map((f) => `\n--- File: ${path.basename(f.path)} ---\n${f.content}`)
      .join('\n')
  }

  // Combine user message with file context
  const messageWithContext = userMessage + fileContext

  // Build messages array
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...conversationHistory,
    { role: 'user', content: messageWithContext },
  ]

  const allowedPathList = allowedFilePaths.map((filePath) => path.resolve(filePath))
  const allowedPathSet = new Set(allowedPathList)
  const rootDirectories = importedRootPaths.map((dirPath) => path.resolve(dirPath))

  const readFileTool = tool<any, any>({
    description: 'Read the contents of a file from the filesystem',
    inputSchema: z.object({
      filePath: z.string().describe('The absolute or relative path to the file to read'),
    }),
    execute: async ({ filePath }: { filePath: string }) => {
      try {
        const normalizedPath = resolveRequestedPath(
          filePath,
          allowedPathSet,
          allowedPathList,
          rootDirectories
        )

        if (!normalizedPath) {
          return {
            success: false,
            filePath,
            error: 'Access denied. Please select or import this file before reading it.',
          }
        }

        const stats = fs.statSync(normalizedPath)
        if (stats.isDirectory()) {
          return {
            success: false,
            filePath,
            error: 'Cannot read a directory path.',
          }
        }

        const content = fs.readFileSync(normalizedPath, 'utf-8')
        return {
          success: true,
          filePath: normalizedPath,
          content,
        }
      } catch (error) {
        return {
          success: false,
          filePath,
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    },
  })

  try {
    const toolCalls: ToolCall[] = []

    const { text } = await generateText({
      model: openrouter.chat('openrouter/polaris-alpha'),
      messages,
      stopWhen: stepCountIs(5),
      tools: {
        readFile: readFileTool,
      },
      onStepFinish: ({ toolCalls: stepToolCalls, toolResults }) => {
        if (stepToolCalls) {
          for (let i = 0; i < stepToolCalls.length; i++) {
            const call = stepToolCalls[i]
            const result = toolResults ? toolResults[i] : undefined
            toolCalls.push({
              toolName: call.toolName,
              input: (call as unknown as { args: Record<string, unknown> }).args || {},
              output: result,
            })
          }
        }
      },
    })

    return { text, toolCalls }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`AI SDK error: ${error.message}`)
    }
    throw error
  }
}
