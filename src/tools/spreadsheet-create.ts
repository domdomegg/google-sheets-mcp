import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';
import {strictSchemaWithAliases} from '../utils/schema.js';

const inputSchema = strictSchemaWithAliases({
	title: z.string().describe('Title of the new spreadsheet'),
	sheets: z.array(z.object({
		title: z.string().describe('Title of the sheet'),
	})).optional().describe('Initial sheets to create. If not provided, a default "Sheet1" is created.'),
}, {});

const outputSchema = z.object({
	spreadsheetId: z.string(),
	properties: z.object({
		title: z.string(),
		locale: z.string().optional(),
		autoRecalc: z.string().optional(),
		timeZone: z.string().optional(),
	}),
	spreadsheetUrl: z.string().optional(),
});

export function registerSpreadsheetCreate(server: McpServer, config: Config): void {
	server.registerTool(
		'spreadsheet_create',
		{
			title: 'Create spreadsheet',
			description: 'Create a new Google Sheets spreadsheet',
			inputSchema,
			outputSchema,
		},
		async ({title, sheets}) => {
			const body: Record<string, unknown> = {
				properties: {title},
			};

			if (sheets?.length) {
				body.sheets = sheets.map((sheet: {title: string}) => ({
					properties: {title: sheet.title},
				}));
			}

			const result = await makeSheetsApiCall('POST', '/spreadsheets', config.token, body);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
