import type { GeneratedFile } from '@/types/project'

export const generateZip = async (
  files: GeneratedFile[],
  _projectName: string,
  readme?: string
): Promise<Blob> => {
  // This is a placeholder - actual implementation will use the 'archiver' library
  // For now, we'll create a simple structure

  const fileContents: Record<string, string> = {}

  files.forEach((file) => {
    fileContents[file.path] = file.content
  })

  if (readme) {
    fileContents['README.md'] = readme
  }

  // In a real implementation, we would use archiver like this:
  // const archiver = require('archiver')
  // const archive = archiver('zip', { zlib: { level: 9 } })
  // ... add files and generate blob

  // For now, return a placeholder blob
  const jsonContent = JSON.stringify(fileContents, null, 2)
  return new Blob([jsonContent], { type: 'application/json' })
}

export const downloadZip = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export const generateProjectStructure = (files: GeneratedFile[]): string => {
  const structure: string[] = []
  const dirs = new Set<string>()

  files.forEach((file) => {
    const parts = file.path.split('/')
    let currentPath = ''

    parts.forEach((part, index) => {
      if (index < parts.length - 1) {
        currentPath += part + '/'
        if (!dirs.has(currentPath)) {
          dirs.add(currentPath)
          structure.push(`${'  '.repeat(index)}📁 ${part}/`)
        }
      } else {
        structure.push(`${'  '.repeat(index)}📄 ${part}`)
      }
    })
  })

  return structure.join('\n')
}
