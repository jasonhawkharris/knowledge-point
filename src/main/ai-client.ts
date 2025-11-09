import fs from 'fs'
import path from 'path'
import OpenAI from 'openai'

let openaiClient: OpenAI | null = null

export function setApiKey(apiKey: string) {
  openaiClient = new OpenAI({ apiKey })
}

export function hasApiKey(): boolean {
  return openaiClient !== null
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

export async function sendMessage(
  userMessage: string,
  files: FileContext[],
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<string> {
  if (!openaiClient) {
    throw new Error('API key not set. Please configure your OpenAI API key.')
  }

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

  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 2048,
    })

    const assistantMessage = response.choices[0].message.content || ''
    return assistantMessage
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`OpenAI API error: ${error.message}`)
    }
    throw error
  }
}
