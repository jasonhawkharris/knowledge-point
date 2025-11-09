import fs from 'fs'
import path from 'path'

export interface FileNode {
  name: string
  path: string
  isDirectory: boolean
  children?: FileNode[]
}

const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.vscode',
  '.idea',
  'dist',
  'build',
  '__pycache__',
  '.env',
  'venv',
])

function shouldIgnore(name: string): boolean {
  return IGNORED_DIRS.has(name) || name.startsWith('.')
}

export async function getDirectoryTree(dirPath: string, maxDepth: number = 10, currentDepth: number = 0): Promise<FileNode> {
  const name = path.basename(dirPath)
  
  try {
    const stats = fs.statSync(dirPath)
    
    if (!stats.isDirectory() || currentDepth >= maxDepth) {
      return {
        name,
        path: dirPath,
        isDirectory: stats.isDirectory(),
      }
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true })
    const children: FileNode[] = []

    for (const entry of entries) {
      if (shouldIgnore(entry.name)) continue

      const childPath = path.join(dirPath, entry.name)
      const child = await getDirectoryTree(childPath, maxDepth, currentDepth + 1)
      children.push(child)
    }

    return {
      name,
      path: dirPath,
      isDirectory: true,
      children: children.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) {
          return b.isDirectory ? 1 : -1
        }
        return a.name.localeCompare(b.name)
      }),
    }
  } catch (error) {
    console.error(`Error reading directory ${dirPath}:`, error)
    return {
      name,
      path: dirPath,
      isDirectory: false,
    }
  }
}
