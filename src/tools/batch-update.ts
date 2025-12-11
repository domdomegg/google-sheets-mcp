import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
	requests: z.array(z.record(z.unknown())).describe('Array of Sheets API request objects. See https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request for available request types. Common requests include: updateCells, repeatCell, autoFill, cutPaste, copyPaste, mergeCells, unmergeCells, updateBorders, addFilterView, addConditionalFormatRule, sortRange, etc.'),
	includeSpreadsheetInResponse: z.boolean().default(false).describe('Whether to include the updated spreadsheet in the response'),
};

const outputSchema = z.object({
	spreadsheetId: z.string(),
	replies: z.array(z.record(z.unknown())).optional(),
	updatedSpreadsheet: z.record(z.unknown()).optional(),
});

export function registerBatchUpdate(server: McpServer, config: Config): void {
	server.registerTool(
		'sheets_batch_update',
		{
			title: 'Batch update',
			description: 'Execute multiple spreadsheet operations in a single request. Use for advanced operations like formatting, merging cells, creating filters, conditional formatting, sorting, etc.',
			inputSchema,
			outputSchema,
		},
		async ({spreadsheetId, requests, includeSpreadsheetInResponse}) => {
			const result = await makeSheetsApiCall(
				'POST',
				`/spreadsheets/${spreadsheetId}:batchUpdate`,
				config.token,
				{
					requests,
					includeSpreadsheetInResponse,
				},
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
