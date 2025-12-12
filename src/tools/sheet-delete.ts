import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
	sheetId: z.number().describe('The ID of the sheet to delete (not the title - use sheets_sheets_list to get sheet IDs)'),
};

const outputSchema = z.object({
	success: z.boolean(),
	deletedSheetId: z.number(),
});

export function registerSheetDelete(server: McpServer, config: Config): void {
	server.registerTool(
		'sheet_delete',
		{
			title: 'Delete sheet',
			description: 'Delete a sheet (tab) from a spreadsheet',
			inputSchema,
			outputSchema,
		},
		async ({spreadsheetId, sheetId}) => {
			await makeSheetsApiCall(
				'POST',
				`/spreadsheets/${spreadsheetId}:batchUpdate`,
				config.token,
				{
					requests: [{
						deleteSheet: {sheetId},
					}],
				},
			);

			return jsonResult(outputSchema.parse({
				success: true,
				deletedSheetId: sheetId,
			}));
		},
	);
}
