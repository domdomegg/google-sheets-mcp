import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases({
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
	data: z.array(z.object({
		range: z.string().describe('The A1 notation of the range to update'),
		values: z.array(z.array(z.unknown())).describe('The data to write'),
	})).describe('Array of range/values pairs to update'),
	valueInputOption: z.enum(['RAW', 'USER_ENTERED']).default('USER_ENTERED').describe('How input data should be interpreted'),
	includeValuesInResponse: z.boolean().default(false).describe('Whether to include the updated values in the response'),
}, {});

const outputSchema = z.object({
	spreadsheetId: z.string(),
	totalUpdatedRows: z.number().optional(),
	totalUpdatedColumns: z.number().optional(),
	totalUpdatedCells: z.number().optional(),
	totalUpdatedSheets: z.number().optional(),
	responses: z.array(z.object({
		spreadsheetId: z.string().optional(),
		updatedRange: z.string().optional(),
		updatedRows: z.number().optional(),
		updatedColumns: z.number().optional(),
		updatedCells: z.number().optional(),
	})).optional(),
});

export function registerValuesBatchUpdate(server: McpServer, config: Config): void {
	server.registerTool(
		'values_batch_update',
		{
			title: 'Batch update values',
			description: 'Write cell values to multiple ranges in a single request',
			inputSchema,
			outputSchema,
		},
		async ({spreadsheetId, data, valueInputOption, includeValuesInResponse}) => {
			const result = await makeSheetsApiCall(
				'POST',
				`/spreadsheets/${spreadsheetId}/values:batchUpdate`,
				config.token,
				{
					valueInputOption,
					includeValuesInResponse,
					data,
				},
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
