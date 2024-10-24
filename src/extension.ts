// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { ExposedContext } from './types';
import { ScopeToolProvider, ScopedFile } from './provider';
import { setScopeToolState, markForScoping, estimateFile } from './helpers';

export function activate(context: vscode.ExtensionContext) {
	// Expose the context
	ExposedContext.set(context);

	// Set up an empty scope tool state in this workspace.
	setScopeToolState([]);

	// Create the scope tool view container
	let scopeToolProvider = new ScopeToolProvider()

	context.subscriptions.push(
		// `file` is the file that is being marked for scoping
		vscode.commands.registerCommand('scope-tool.markForScoping', async (file) => {
			markForScoping(file.path);

			scopeToolProvider.refresh();
		}),
		// `fileIndex` is the index of this scoped file in the scope tool state
		vscode.commands.registerCommand('scope-tool.estimateFile', async (fileIndex) => {
			const input = await vscode.window.showInputBox({
				prompt: 'Enter your estimate in days (floating point works)',
				placeHolder: '1'
			});

			if (input) {
				const days = +input;
				
				// `estimateFile()` handles the case where `days` is `NaN`.
				estimateFile(fileIndex, days);

				scopeToolProvider.refresh();
			}
		}),
		vscode.commands.registerCommand('scope-tool.clearWorkspace', async (file) => {
			setScopeToolState([]);

			scopeToolProvider.refresh();
		}),
	);

	vscode.window.registerTreeDataProvider(
		'scopeTool',
		scopeToolProvider,
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}
