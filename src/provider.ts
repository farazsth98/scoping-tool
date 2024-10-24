import * as vscode from 'vscode';
import { getLoc } from './helpers';
import { getScopeToolState } from './helpers';

export class ScopedFile extends vscode.TreeItem {
	/// The number of lines of code for this file
	private _loc: number = 0;

	/// The estimate (in days) for this file
	private _estimate: number = 0;

	/// The actual filepath (this is different from the label which is shown in the panel) for this file
	private _filepath: string = "";

	/// The index in the scope tool state where this file is stored
	public index: number = -1;

	constructor(public label: string, public readonly collapsibleState: vscode.TreeItemCollapsibleState, index: number, onlyLabel: boolean) {
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
			this.index = index;

			this.command = {
				command: 'scope-tool.estimateFile',
				title: this.label,
				arguments: [this.index] // Pass in the index so the caller can modify it
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

export class ScopeToolProvider implements vscode.TreeDataProvider<ScopedFile> {
	constructor() {}

	getTreeItem(element: ScopedFile): vscode.TreeItem {
		return element;
	}

	getChildren(_element?: ScopedFile): Thenable<ScopedFile[]> {
		let scopeToolState = getScopeToolState();

        // Add up the total LOC and estimate in days for the
        // currently in-scope files.
		let totalLoc = 0;
		let totalEstimate = 0;

		for (let file of scopeToolState) {
			totalLoc += file.loc;
			totalEstimate += file.estimate;
		}

		// Add two hacky files at the end. 
		// One for a divider, and one that shows total LOC and estimate
		let divider = new ScopedFile('----------------------------', 
			vscode.TreeItemCollapsibleState.None, 
			0, true
		);
		let statFile = new ScopedFile(
			`${totalLoc} lines of code, ${totalEstimate} days to audit`, 
			vscode.TreeItemCollapsibleState.None, 
			0, true
		);

		return Promise.resolve(scopeToolState.concat([divider, statFile]));
	}

	// Used to refresh the view after changes are made
	private _onDidChangeTreeData: vscode.EventEmitter<ScopedFile | undefined | null | void> = new vscode.EventEmitter<ScopedFile | undefined | null | void>();
	readonly onDidChangeTreeData: vscode.Event<ScopedFile | undefined | null | void> = this._onDidChangeTreeData.event;
  
	refresh(): void {
	  this._onDidChangeTreeData.fire();
	}
}