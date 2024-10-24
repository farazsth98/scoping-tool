import * as vscode from 'vscode';

export let SCOPE_TOOL_STATE_KEY = "SCOPE_TOOL_STATE_KEY";


export class ExposedContext {
	private static _context: vscode.ExtensionContext;

	public static get(): vscode.ExtensionContext {
		return this._context;
	}

	public static set(context: vscode.ExtensionContext) {
		this._context = context;
	}
}