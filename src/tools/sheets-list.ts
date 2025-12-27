import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases({
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
}, {});

const sheetSchema = z.object({
	sheetId: z.number(),
	title: z.string(),
	index: z.number(),
	sheetType: z.string().optional(),
	rowCount: z.number().optional(),
	columnCount: z.number().optional(),
});

const outputSchema = z.object({
	spreadsheetId: z.string(),
	title: z.string(),
	sheets: z.array(sheetSchema),
});

export function registerSheetsList(server: McpServer, config: Config): void {
	server.registerTool(
		'sheets_list',
		{
			title: 'List sheets',
			description: 'List all sheets (tabs) in a spreadsheet with their properties',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({spreadsheetId}) => {
			const result = await makeSheetsApiCall(
				'GET',
				`/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,sheets.properties`,
				config.token,
			) as {
				spreadsheetId: string;
				properties: {title: string};
				sheets?: {properties: {sheetId: number; title: string; index: number; sheetType?: string; gridProperties?: {rowCount?: number; columnCount?: number}}}[];
			};

			const sheets = (result.sheets ?? []).map((s) => ({
				sheetId: s.properties.sheetId,
				title: s.properties.title,
				index: s.properties.index,
				sheetType: s.properties.sheetType,
				rowCount: s.properties.gridProperties?.rowCount,
				columnCount: s.properties.gridProperties?.columnCount,
			}));

			return jsonResult(outputSchema.parse({
				spreadsheetId: result.spreadsheetId,
				title: result.properties.title,
				sheets,
			}));
		},
	);
}
