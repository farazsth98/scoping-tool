// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

let SCOPE_TOOL_STATE_KEY = "SCOPE_TOOL_STATE_KEY";

function getLoc(filepath: string): number {
	let clocOutput = spawnSync("cloc", [filepath], { encoding : 'utf8' }).stdout;

	// Parse the output. This code only runs `cloc` on files, not directories, so
	// we always know where the lines of code is in the output.
	let lines = clocOutput.split("\n");
	lines = lines[lines.length - 3].split(" ");
	let loc: number = +lines[lines.length - 1];

	return loc;
}

class ScopedFile extends vscode.TreeItem {
	private _loc: number = 0;
	private _estimate: number = 0;
	private _filepath: string = "";

	constructor(public label: string, public readonly collapsibleState: vscode.TreeItemCollapsibleState, onlyLabel: boolean) {
		super(label, collapsibleState);

		// The `onlyLabel` case is for the very last line that indicates total
		// LOC and estimate time. For that, we only set the label with no special
		// processing.
		if (!onlyLabel) {
			// Always remove the workspace folder from the actual label that is shown.
			let workspaceFolder = vscode.workspace.workspaceFolders![0].uri.path;

			let finalLabel = label.substring(workspaceFolder.length);   

			let loc = getLoc(label);

			this._filepath = finalLabel;
			this._loc = loc;
			this.label = `${this._filepath} - ${loc} lines`;

			this.command = {
				command: 'scope-tool.estimateFile',
				title: this.label,
				arguments: [finalLabel]
			};
		}
	}

	public get loc(): number {
		return this._loc;
	}

	public get estimate(): number {
		return this._estimate;
	}

	public set estimate(estimate: number) {
		this._estimate = estimate;

		this.label = `${this._filepath} - ${this._loc} lines, ${this._estimate} days`;
	}
}

class ExposedContext {
	private static _context: vscode.ExtensionContext;

	public static get(): vscode.ExtensionContext {
		return this._context;
	}

	public static set(context: vscode.ExtensionContext) {
		this._context = context;
	}
}

export class ScopeToolProvider implements vscode.TreeDataProvider<ScopedFile> {
	constructor() {}

	getTreeItem(element: ScopedFile): vscode.TreeItem {
		return element;
	}

	getChildren(_element?: ScopedFile): Thenable<ScopedFile[]> {
		let scopeToolState = getScopeToolState();

		let totalLoc = 0;
		let totalEstimate = 0;

		for (let file of scopeToolState) {
			totalLoc += file.loc;
			totalEstimate += file.estimate;
		}

		// Add two hacky files, one for a divider, and one that shows total LOC and estimate
		let divider = new ScopedFile('----------------------------', vscode.TreeItemCollapsibleState.None, true);
		let finalFile = new ScopedFile(`${totalLoc} lines of code, ${totalEstimate} days to audit`, vscode.TreeItemCollapsibleState.None, true);

		return Promise.resolve(scopeToolState.concat([divider, finalFile]));
	}

	private _onDidChangeTreeData: vscode.EventEmitter<ScopedFile | undefined | null | void> = new vscode.EventEmitter<ScopedFile | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ScopedFile | undefined | null | void> = this._onDidChangeTreeData.event;
  
	refresh(): void {
	  this._onDidChangeTreeData.fire();
	}
}

export function activate(context: vscode.ExtensionContext) {
	// Expose the context
	ExposedContext.set(context);

	// Set up the scope tool state in this workspace.
	setScopeToolState([]);

	// Create the scope tool view container
	let scopeToolProvider = new ScopeToolProvider()

	context.subscriptions.push(
		vscode.commands.registerCommand('scope-tool.markForScoping', async (file) => {
			markForScoping(file.path);

			scopeToolProvider.refresh();
		},
		vscode.commands.registerCommand('scope-tool.estimateFile', async (file) => {
			let scopeToolState = getScopeToolState();

			// Yes, this is hacky... Need to find a better way than to iterate
			// over this array every time but scopes are usually not large enough
			// for this to matter, so...

			const input = await vscode.window.showInputBox({
				prompt: 'Enter your estimate in days (floating point works)',
				placeHolder: '1'
			});

			if (input) {
				const days = +input;
				
				// Need to check for NaN
				if (!Number.isNaN(days)) {
					for (let scopedFile of scopeToolState) {
						// Only one file will match this
						if (scopedFile.label.indexOf(file) !== -1) {
							scopedFile.estimate = days;
						}
					}
				}

				scopeToolProvider.refresh();
			}
		})
	));

	vscode.window.registerTreeDataProvider(
		'scopeTool',
		scopeToolProvider,
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}

function getScopeToolState(): ScopedFile[] {
	// This access is safe because the state is created on extension activation
	return ExposedContext.get().workspaceState.get(SCOPE_TOOL_STATE_KEY)!;
}

function setScopeToolState(state: ScopedFile[]) {
	ExposedContext.get().workspaceState.update(SCOPE_TOOL_STATE_KEY, state);
}

function markForScoping(filePath: string) {
	let scopeToolState = getScopeToolState();

	scopeToolState.push(new ScopedFile(filePath, vscode.TreeItemCollapsibleState.None, false));

	setScopeToolState(scopeToolState);
}
