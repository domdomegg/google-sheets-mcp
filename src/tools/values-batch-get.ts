import {z} from 'zod';
import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';
import {makeSheetsApiCall} from '../utils/sheets-api.js';
import {jsonResult} from '../utils/response.js';

const inputSchema = {
	spreadsheetId: z.string().describe('The ID of the spreadsheet'),
	ranges: z.array(z.string()).describe('Array of A1 notation ranges to read (e.g., ["Sheet1!A1:D10", "Sheet2!A:A"])'),
	majorDimension: z.enum(['ROWS', 'COLUMNS']).default('ROWS').describe('Whether to return data as rows or columns'),
	valueRenderOption: z.enum(['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA']).default('FORMATTED_VALUE').describe('How values should be rendered'),
	dateTimeRenderOption: z.enum(['SERIAL_NUMBER', 'FORMATTED_STRING']).default('FORMATTED_STRING').describe('How dates should be rendered'),
};

const valueRangeSchema = z.object({
	range: z.string(),
	majorDimension: z.string().optional(),
	values: z.array(z.array(z.unknown())).optional(),
});

const outputSchema = z.object({
	spreadsheetId: z.string(),
	valueRanges: z.array(valueRangeSchema).optional(),
});

export function registerValuesBatchGet(server: McpServer, config: Config): void {
	server.registerTool(
		'values_batch_get',
		{
			title: 'Batch get values',
			description: 'Read cell values from multiple ranges in a single request',
			inputSchema,
			outputSchema,
			annotations: {
				readOnlyHint: true,
			},
		},
		async ({spreadsheetId, ranges, majorDimension, valueRenderOption, dateTimeRenderOption}) => {
			const params = new URLSearchParams({
				majorDimension,
				valueRenderOption,
				dateTimeRenderOption,
			});

			for (const range of ranges) {
				params.append('ranges', range);
			}

			const result = await makeSheetsApiCall(
				'GET',
				`/spreadsheets/${spreadsheetId}/values:batchGet?${params.toString()}`,
				config.token,
			);
			return jsonResult(outputSchema.parse(result));
		},
	);
}
