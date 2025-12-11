import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
	range: z.string().describe('The A1 notation of the range to read (e.g., "Sheet1!A1:D10", "Sheet1", "A1:D10")'),
	majorDimension: z.enum(['ROWS', 'COLUMNS']).default('ROWS').describe('Whether to return data as rows or columns'),
	valueRenderOption: z.enum(['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA']).default('FORMATTED_VALUE').describe('How values should be rendered: FORMATTED_VALUE (display values), UNFORMATTED_VALUE (raw), or FORMULA (formulas)'),
	dateTimeRenderOption: z.enum(['SERIAL_NUMBER', 'FORMATTED_STRING']).default('FORMATTED_STRING').describe('How dates should be rendered'),
};

const outputSchema = z.object({
	range: z.string(),
	majorDimension: z.string().optional(),
	values: z.array(z.array(z.unknown())).optional(),
});

export function registerValuesGet(server: McpServer, config: Config): void {
	server.registerTool(
		'sheets_values_get',
		{
			title: 'Get values',
			description: 'Read cell values from a spreadsheet range',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({spreadsheetId, range, majorDimension, valueRenderOption, dateTimeRenderOption}) => {
			const params = new URLSearchParams({
				majorDimension,
				valueRenderOption,
				dateTimeRenderOption,
			});

			const encodedRange = encodeURIComponent(range);
			const result = await makeSheetsApiCall(
				'GET',
				`/spreadsheets/${spreadsheetId}/values/${encodedRange}?${params.toString()}`,
				config.token,
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
