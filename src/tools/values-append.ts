import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases({
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
	range: z.string().describe('The A1 notation of a range to search for data. Data will be appended after the last row with data in this range (e.g., "Sheet1!A:A" to append to column A, or "Sheet1" to append to the sheet)'),
	values: z.array(z.array(z.unknown())).describe('The data to append, as a 2D array of values (rows of columns)'),
	valueInputOption: z.enum(['RAW', 'USER_ENTERED']).default('USER_ENTERED').describe('How input data should be interpreted: RAW (as-is) or USER_ENTERED (parsed like typed in UI)'),
	insertDataOption: z.enum(['OVERWRITE', 'INSERT_ROWS']).default('INSERT_ROWS').describe('How to handle existing data: OVERWRITE writes over existing, INSERT_ROWS inserts new rows'),
	includeValuesInResponse: z.boolean().default(false).describe('Whether to include the appended values in the response'),
}, {});

const outputSchema = z.object({
	spreadsheetId: z.string(),
	tableRange: z.string().optional(),
	updates: z.object({
		spreadsheetId: z.string().optional(),
		updatedRange: z.string().optional(),
		updatedRows: z.number().optional(),
		updatedColumns: z.number().optional(),
		updatedCells: z.number().optional(),
		updatedData: z.object({
			range: z.string(),
			majorDimension: z.string().optional(),
			values: z.array(z.array(z.unknown())).optional(),
		}).optional(),
	}).optional(),
});

export function registerValuesAppend(server: McpServer, config: Config): void {
	server.registerTool(
		'values_append',
		{
			title: 'Append values',
			description: 'Append rows of data after the last row with data in a range',
			inputSchema,
			outputSchema,
		},
		async ({spreadsheetId, range, values, valueInputOption, insertDataOption, includeValuesInResponse}) => {
			const params = new URLSearchParams({
				valueInputOption,
				insertDataOption,
				includeValuesInResponse: String(includeValuesInResponse),
			});

			const encodedRange = encodeURIComponent(range);
			const result = await makeSheetsApiCall(
				'POST',
				`/spreadsheets/${spreadsheetId}/values/${encodedRange}:append?${params.toString()}`,
				config.token,
				{values},
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
