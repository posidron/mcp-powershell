import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { z } from 'zod';
const execAsync = promisify(exec);
/**
 * PowerShell MCP Server
 *
 * A Model Context Protocol server for interacting with PowerShell.
 * Provides tools for executing PowerShell commands, managing modules,
 * and querying system information.
 */
class PowerShellMcpServer {
    constructor() {
        // Create an MCP server with metadata
        this.server = new McpServer({
            name: 'PowerShell MCP Server',
            version: '1.0.0',
        });
        this.registerTools();
    }
    /**
     * Register tools with the MCP server.
     */
    registerTools() {
        // Execute a PowerShell command
        this.server.tool('execute_ps', {
            command: z.string().describe('PowerShell command to execute'),
        }, async ({ command }) => {
            try {
                const { stdout, stderr } = await execAsync(`powershell -Command "${command.replace(/"/g, '\\"')}"`);
                if (stderr) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: `Error executing PowerShell command: ${stderr}`,
                            },
                        ],
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout,
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Error executing PowerShell command: ${error.message}`,
                        },
                    ],
                };
            }
        });
        // Get system information
        this.server.tool('get_system_info', {}, async () => {
            try {
                const command = `
            $ComputerInfo = Get-ComputerInfo
            $PSVersion = $PSVersionTable
            $EnvVars = Get-ChildItem Env: | Sort-Object Name

            $Output = [PSCustomObject]@{
              ComputerName = $ComputerInfo.CsName
              OSName = $ComputerInfo.WindowsProductName
              OSVersion = $ComputerInfo.OsVersion
              OSBuild = $ComputerInfo.OsBuildNumber
              ProcessorName = $ComputerInfo.CsProcessors.Name
              TotalMemory = "$([math]::Round($ComputerInfo.CsTotalPhysicalMemory / 1GB, 2)) GB"
              PSVersion = "$($PSVersion.PSVersion)"
              PSEdition = "$($PSVersion.PSEdition)"
              PSBuildVersion = "$($PSVersion.BuildVersion)"
              CLRVersion = "$($PSVersion.CLRVersion)"
            }

            ConvertTo-Json -InputObject $Output -Depth 3
          `;
                const { stdout, stderr } = await execAsync(`powershell -Command "${command.replace(/"/g, '\\"')}"`);
                if (stderr) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: `Error retrieving system information: ${stderr}`,
                            },
                        ],
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout,
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Error retrieving system information: ${error.message}`,
                        },
                    ],
                };
            }
        });
        // List installed modules
        this.server.tool('list_modules', {}, async () => {
            try {
                const command = `
            Get-Module -ListAvailable |
            Select-Object Name, Version, ModuleType, Path |
            Sort-Object Name |
            ConvertTo-Json
          `;
                const { stdout, stderr } = await execAsync(`powershell -Command "${command.replace(/"/g, '\\"')}"`);
                if (stderr) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: `Error listing PowerShell modules: ${stderr}`,
                            },
                        ],
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout,
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Error listing PowerShell modules: ${error.message}`,
                        },
                    ],
                };
            }
        });
        // Get help for a PowerShell command
        this.server.tool('get_command_help', {
            command: z.string().describe('PowerShell command to get help for'),
        }, async ({ command }) => {
            try {
                const psCommand = `
            $Help = Get-Help ${command} -Full
            $Output = [PSCustomObject]@{
              Name = $Help.Name
              Synopsis = $Help.Synopsis
              Syntax = $Help.Syntax | Out-String
              Description = $Help.Description | Out-String
              Parameters = $Help.Parameters.Parameter | ForEach-Object {
                [PSCustomObject]@{
                  Name = $_.Name
                  Type = $_.Type.Name
                  Required = $_.Required
                  Description = $_.Description | Out-String
                }
              }
              Examples = $Help.Examples.Example | ForEach-Object {
                [PSCustomObject]@{
                  Title = $_.Title
                  Code = $_.Code
                  Remarks = $_.Remarks | Out-String
                }
              }
            }
            ConvertTo-Json -InputObject $Output -Depth 5
          `;
                const { stdout, stderr } = await execAsync(`powershell -Command "${psCommand.replace(/"/g, '\\"')}"`);
                if (stderr) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: `Error retrieving help: ${stderr}`,
                            },
                        ],
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout,
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Error retrieving help: ${error.message}`,
                        },
                    ],
                };
            }
        });
        // Find commands by name, noun, or verb
        this.server.tool('find_commands', {
            search: z.string().describe('Search term for PowerShell commands'),
        }, async ({ search }) => {
            try {
                const command = `
            Get-Command -Name "*${search}*" -ErrorAction SilentlyContinue |
            Select-Object Name, CommandType, Version, Source |
            Sort-Object Name |
            ConvertTo-Json
          `;
                const { stdout, stderr } = await execAsync(`powershell -Command "${command.replace(/"/g, '\\"')}"`);
                if (stderr) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: `Error finding commands: ${stderr}`,
                            },
                        ],
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout || 'No commands found matching the search term.',
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Error finding commands: ${error.message}`,
                        },
                    ],
                };
            }
        });
        // Run a PowerShell script file
        this.server.tool('run_script', {
            scriptPath: z.string().describe('Path to the PowerShell script file'),
            parameters: z.string().optional().describe('Optional parameters to pass to the script'),
        }, async ({ scriptPath, parameters }) => {
            try {
                const fullCommand = parameters
                    ? `powershell -File "${scriptPath}" ${parameters}`
                    : `powershell -File "${scriptPath}"`;
                const { stdout, stderr } = await execAsync(fullCommand);
                if (stderr) {
                    return {
                        isError: true,
                        content: [
                            {
                                type: 'text',
                                text: `Error running script: ${stderr}`,
                            },
                        ],
                    };
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: stdout || 'Script executed successfully with no output.',
                        },
                    ],
                };
            }
            catch (error) {
                return {
                    isError: true,
                    content: [
                        {
                            type: 'text',
                            text: `Error running script: ${error.message}`,
                        },
                    ],
                };
            }
        });
    }
    /**
     * Start the MCP server.
     * This connects the server to stdin/stdout for Claude Desktop integration.
     */
    async start() {
        try {
            // Start receiving messages on stdin and sending messages on stdout
            const transport = new StdioServerTransport();
            await this.server.connect(transport);
            console.error('PowerShell MCP Server started and ready for connections.');
        }
        catch (error) {
            console.error('Failed to start PowerShell MCP Server:', error);
            process.exit(1);
        }
    }
}
// Start the server
const server = new PowerShellMcpServer();
server.start().catch((error) => {
    console.error('Failed to start PowerShell MCP Server:', error);
    process.exit(1);
});
