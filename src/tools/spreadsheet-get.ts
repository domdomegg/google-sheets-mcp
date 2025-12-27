import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases({
	spreadsheetId: z.string().describe('The ID of the spreadsheet to retrieve'),
	includeGridData: z.boolean().default(false).describe('Whether to include grid data (cell values). Default false for metadata only.'),
	ranges: z.array(z.string()).optional().describe('Ranges to return grid data for (e.g., "Sheet1!A1:B10"). Only used if includeGridData is true.'),
}, {});

const sheetPropertiesSchema = z.object({
	sheetId: z.number(),
	title: z.string(),
	index: z.number(),
	sheetType: z.string().optional(),
	gridProperties: z.object({
		rowCount: z.number().optional(),
		columnCount: z.number().optional(),
		frozenRowCount: z.number().optional(),
		frozenColumnCount: z.number().optional(),
	}).optional(),
});

const outputSchema = z.object({
	spreadsheetId: z.string(),
	properties: z.object({
		title: z.string(),
		locale: z.string().optional(),
		autoRecalc: z.string().optional(),
		timeZone: z.string().optional(),
	}),
	sheets: z.array(z.object({
		properties: sheetPropertiesSchema,
	})).optional(),
	spreadsheetUrl: z.string().optional(),
});

export function registerSpreadsheetGet(server: McpServer, config: Config): void {
	server.registerTool(
		'spreadsheet_get',
		{
			title: 'Get spreadsheet',
			description: 'Get spreadsheet metadata including title, sheets list, and optionally cell data',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({spreadsheetId, includeGridData, ranges}) => {
			const params = new URLSearchParams();
			if (includeGridData) {
				params.set('includeGridData', 'true');
			}

			if (ranges?.length) {
				for (const range of ranges) {
					params.append('ranges', range);
				}
			}

			const queryString = params.toString();
			const endpoint = `/spreadsheets/${spreadsheetId}${queryString ? `?${queryString}` : ''}`;
			const result = await makeSheetsApiCall('GET', endpoint, config.token);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
