import type { ClaudeCommand } from '@/types/claude'

class Logger {
  private logs: ClaudeCommand[] = []
  private maxLogs = 100

  log(command: string, args: string[], response?: string): void {
    const logEntry: ClaudeCommand = {
      command,
      args,
      timestamp: new Date(),
      response,
    }

    this.logs.push(logEntry)

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Also log to console in development
    if (import.meta.env.DEV) {
      console.log(`[Claude CLI] ${command}`, args, response ? `→ ${response}` : '')
    }
  }

  getLogs(): ClaudeCommand[] {
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  getLastLog(): ClaudeCommand | null {
    return this.logs.length > 0 ? this.logs[this.logs.length - 1] : null
  }
}

export const claudeLogger = new Logger()
