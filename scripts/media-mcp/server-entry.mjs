import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import {
  callTool,
  loadCredentials,
  mcpToolResult,
  safeErrorMessage,
  toolDefinitions,
} from '../../plugins/ergouzi-media-mcp/scripts/lib.mjs';

const SERVER_INFO = {
  name: 'ergouzi-media-mcp',
  version: __ERGOUZI_MEDIA_MCP_VERSION__,
};

const server = new Server(SERVER_INFO, {
  capabilities: { tools: { listChanged: false } },
  instructions:
    'Use media API tools for Ergouzi asynchronous image and video predictions. Before create_prediction, confirm that the user explicitly requested the billable task. Keep task IDs and do not resubmit an existing task.',
});

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolDefinitions(),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  let credentials;
  try {
    credentials = await loadCredentials();
    return mcpToolResult(
      await callTool(
        request.params.name,
        request.params.arguments ?? {},
        credentials,
      ),
    );
  } catch (error) {
    return mcpToolResult(safeErrorMessage(error, credentials), true);
  }
});

await server.connect(new StdioServerTransport());
