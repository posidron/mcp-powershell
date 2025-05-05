# PowerShell MCP Server

A Model Context Protocol server for interacting with PowerShell. This server provides tools for executing PowerShell commands, retrieving system information, managing modules, and more.

<a href="https://glama.ai/mcp/servers/@posidron/mcp-powershell">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/@posidron/mcp-powershell/badge" alt="PowerShell Server MCP server" />
</a>

## Requirements

- Node.js 18+
- PowerShell 5.1 or PowerShell Core 7+

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npm run build
   ```

## Configuration

### For Claude Desktop
Edit config: `$HOME/Library/Application\ Support/Claude/claude_desktop_config.json`

Add to mcpServers:
```json
{
  "mcpServers": {
    "mcp-powershell": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-powershell/dist/index.js"
      ]
    }
  }
}
```

### For VS Code
Edit config: `$HOME/Library/Application\ Support/Code/User/settings.json`

Add to settings:
```json
"mcp": {
  "servers": {
    "mcp-powershell": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-powershell/dist/index.js"
      ]
    }
  }
}
```

### For Cursor IDE
Edit config: `$HOME/.cursor/mcp.json`

Add to mcpServers:
```json
{
  "mcpServers": {
    "mcp-powershell": {
      "command": "node",
      "args": [
        "/absolute/path/to/mcp-powershell/dist/index.js"
      ]
    }
  }
}
```

## Available Tools

This PowerShell MCP server provides the following tools:

### execute_ps
Execute a PowerShell command and get the result.

```
Parameters:
- command (string): PowerShell command to execute
```

Example usage:
```
execute_ps(command: "Get-Process | Select-Object -First 5")
```

### get_system_info
Retrieve detailed system information, including OS details, processor, memory, and PowerShell version.

```
Parameters: None
```

Example usage:
```
get_system_info()
```

### list_modules
List all installed PowerShell modules with details like name, version, and type.

```
Parameters: None
```

Example usage:
```
list_modules()
```

### get_command_help
Get detailed help for a specific PowerShell command, including syntax, parameters, and examples.

```
Parameters:
- command (string): PowerShell command to get help for
```

Example usage:
```
get_command_help(command: "Get-Process")
```

### find_commands
Search for PowerShell commands by name or pattern.

```
Parameters:
- search (string): Search term for PowerShell commands
```

Example usage:
```
find_commands(search: "Process")
```

### run_script
Run a PowerShell script file with optional parameters.

```
Parameters:
- scriptPath (string): Path to the PowerShell script file
- parameters (string, optional): Optional parameters to pass to the script
```

Example usage:
```
run_script(scriptPath: "/path/to/script.ps1", parameters: "-Name 'Test' -Value 123")
```

## Development

To run in development mode:
```bash
npm run dev
```

## Extending the Server

To add your own PowerShell tools:

1. Edit `src/index.ts`
2. Add new tools in the `registerTools()` method
3. Follow the existing pattern for consistent error handling
4. Build with `npm run build`

### Adding a Tool Example

```typescript
// In the registerTools() method:
this.server.tool(
  "my_ps_tool",
  {
    param1: z.string().describe("Description of parameter 1"),
    param2: z.number().optional().describe("Optional numeric parameter"),
  },
  async ({ param1, param2 }) => {
    try {
      // Your PowerShell command
      const command = `Your-PowerShell-Command -Param1 "${param1}" ${param2 ? `-Param2 ${param2}` : ''}`;

      const { stdout, stderr } = await execAsync(`powershell -Command "${command.replace(/"/g, '\\"')}"`);

      if (stderr) {
        return {
          isError: true,
          content: [
            {
              type: "text" as const,
              text: `Error in my_ps_tool: ${stderr}`,
            },
          ],
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: stdout,
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text" as const,
            text: `Error in my_ps_tool: ${(error as Error).message}`,
          },
        ],
      };
    }
  }
);
```

## Security Considerations

- This server executes PowerShell commands directly on your system
- Commands are executed with the same privileges as the process running the MCP server
- Use caution when exposing destructive operations
- Consider implementing additional validation for sensitive commands

## Troubleshooting

### Common Issues

1. **PowerShell execution policy restrictions**
   - You may need to adjust your PowerShell execution policy to allow script execution
   - Use `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser` to allow local scripts

2. **Path not found errors**
   - Ensure file paths are absolute or properly relative to the working directory
   - Use appropriate path separators for your OS

3. **Command not found errors**
   - Some commands may require specific modules to be installed
   - Use `Install-Module ModuleName` to install required modules

## License

MIT