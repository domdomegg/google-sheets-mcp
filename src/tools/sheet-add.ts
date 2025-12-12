import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
	title: z.string().describe('Title of the new sheet'),
	index: z.number().optional().describe('The index to insert the sheet at. If not specified, appended to the end.'),
	rowCount: z.number().optional().describe('Number of rows (default 1000)'),
	columnCount: z.number().optional().describe('Number of columns (default 26)'),
};

const outputSchema = z.object({
	sheetId: z.number(),
	title: z.string(),
	index: z.number(),
});

export function registerSheetAdd(server: McpServer, config: Config): void {
	server.registerTool(
		'sheet_add',
		{
			title: 'Add sheet',
			description: 'Add a new sheet (tab) to a spreadsheet',
			inputSchema,
			outputSchema,
		},
		async ({spreadsheetId, title, index, rowCount, columnCount}) => {
			const sheetProperties: Record<string, unknown> = {title};
			if (index !== undefined) {
				sheetProperties.index = index;
			}

			if (rowCount || columnCount) {
				sheetProperties.gridProperties = {
					...(rowCount && {rowCount}),
					...(columnCount && {columnCount}),
				};
			}

			const result = await makeSheetsApiCall(
				'POST',
				`/spreadsheets/${spreadsheetId}:batchUpdate`,
				config.token,
				{
					requests: [{
						addSheet: {properties: sheetProperties},
					}],
				},
			) as {
				replies: {addSheet: {properties: {sheetId: number; title: string; index: number}}}[];
			};

			const addedSheet = result.replies[0]!.addSheet.properties;
			return jsonResult(outputSchema.parse({
				sheetId: addedSheet.sheetId,
				title: addedSheet.title,
				index: addedSheet.index,
			}));
		},
	);
}
