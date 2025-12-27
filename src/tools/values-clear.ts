import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases({
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
	range: z.string().describe('The A1 notation of the range to clear (e.g., "Sheet1!A1:D10")'),
}, {});

const outputSchema = z.object({
	spreadsheetId: z.string(),
	clearedRange: z.string().optional(),
});

export function registerValuesClear(server: McpServer, config: Config): void {
	server.registerTool(
		'values_clear',
		{
			title: 'Clear values',
			description: 'Clear cell values from a range (keeps formatting)',
			inputSchema,
			outputSchema,
		},
		async ({spreadsheetId, range}) => {
			const encodedRange = encodeURIComponent(range);
			const result = await makeSheetsApiCall(
				'POST',
				`/spreadsheets/${spreadsheetId}/values/${encodedRange}:clear`,
				config.token,
				{},
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
