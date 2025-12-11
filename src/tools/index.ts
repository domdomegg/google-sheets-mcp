import type {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import type {Config} from './types.js';

// Spreadsheet
import {registerSpreadsheetGet} from './spreadsheet-get.js';
import {registerSpreadsheetCreate} from './spreadsheet-create.js';

// Values
import {registerValuesGet} from './values-get.js';
import {registerValuesBatchGet} from './values-batch-get.js';
import {registerValuesUpdate} from './values-update.js';
import {registerValuesBatchUpdate} from './values-batch-update.js';
import {registerValuesAppend} from './values-append.js';
import {registerValuesClear} from './values-clear.js';

// Sheets (tabs)
import {registerSheetsList} from './sheets-list.js';
import {registerSheetAdd} from './sheet-add.js';
import {registerSheetDelete} from './sheet-delete.js';

// Batch operations
import {registerBatchUpdate} from './batch-update.js';

export type {Config} from './types.js';

export function registerAll(server: McpServer, config: Config): void {
	// Spreadsheet
	registerSpreadsheetGet(server, config);
	registerSpreadsheetCreate(server, config);

	// Values
	registerValuesGet(server, config);
	registerValuesBatchGet(server, config);
	registerValuesUpdate(server, config);
	registerValuesBatchUpdate(server, config);
	registerValuesAppend(server, config);
	registerValuesClear(server, config);

	// Sheets (tabs)
	registerSheetsList(server, config);
	registerSheetAdd(server, config);
	registerSheetDelete(server, config);

	// Batch operations
	registerBatchUpdate(server, config);
}
