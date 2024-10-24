import { spawnSync } from 'child_process';
import { ExposedContext, SCOPE_TOOL_STATE_KEY } from './types';
import { ScopedFile } from './provider';
import * as vscode from 'vscode';

export function getLoc(filepath: string): number {
	let clocOutput = spawnSync("cloc", [filepath], { encoding : 'utf8' }).stdout;

	// Parse the output. This code only runs `cloc` on files, not directories, so
	// we always know where the lines of code is in the output.
	let lines = clocOutput.split("\n");
	lines = lines[lines.length - 3].split(" ");
	let loc: number = +lines[lines.length - 1];

	return loc;
}

export function getScopeToolState(): ScopedFile[] {
	// This access is safe because the state is created on extension activation,
    // so it will always exist
	return ExposedContext.get().workspaceState.get(SCOPE_TOOL_STATE_KEY)!;
}

export function setScopeToolState(state: ScopedFile[]) {
	ExposedContext.get().workspaceState.update(SCOPE_TOOL_STATE_KEY, state);
}

export function markForScoping(filePath: string) {
	let scopeToolState = getScopeToolState();

	scopeToolState.push(
		new ScopedFile(
			filePath, 
			vscode.TreeItemCollapsibleState.None,
			scopeToolState.length, 
			false));

	setScopeToolState(scopeToolState);
}

// `fileIndex` is the index of this file within the scope tool state
export function estimateFile(fileIndex: number, days: number) {
    let scopeToolState = getScopeToolState();

    // Need to check for NaN
    if (!Number.isNaN(days)) {
        scopeToolState[fileIndex].estimate = days;
    }
}