import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases({
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
	range: z.string().describe('The A1 notation of the range to update (e.g., "Sheet1!A1:D10")'),
	values: z.array(z.array(z.unknown())).describe('The data to write, as a 2D array of values (rows of columns)'),
	valueInputOption: z.enum(['RAW', 'USER_ENTERED']).default('USER_ENTERED').describe('How input data should be interpreted: RAW (as-is) or USER_ENTERED (parsed like typed in UI, e.g., "=A1+B1" becomes formula)'),
	includeValuesInResponse: z.boolean().default(false).describe('Whether to include the updated values in the response'),
}, {});

const outputSchema = z.object({
	spreadsheetId: z.string(),
	updatedRange: z.string().optional(),
	updatedRows: z.number().optional(),
	updatedColumns: z.number().optional(),
	updatedCells: z.number().optional(),
	updatedData: z.object({
		range: z.string(),
		majorDimension: z.string().optional(),
		values: z.array(z.array(z.unknown())).optional(),
	}).optional(),
});

export function registerValuesUpdate(server: McpServer, config: Config): void {
	server.registerTool(
		'values_update',
		{
			title: 'Update values',
			description: 'Write cell values to a spreadsheet range (overwrites existing data)',
			inputSchema,
			outputSchema,
		},
		async ({spreadsheetId, range, values, valueInputOption, includeValuesInResponse}) => {
			const params = new URLSearchParams({
				valueInputOption,
				includeValuesInResponse: String(includeValuesInResponse),
			});

			const encodedRange = encodeURIComponent(range);
			const result = await makeSheetsApiCall(
				'PUT',
				`/spreadsheets/${spreadsheetId}/values/${encodedRange}?${params.toString()}`,
				config.token,
				{values},
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
