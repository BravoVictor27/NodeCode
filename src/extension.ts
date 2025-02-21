import * as vscode from 'vscode';
import { initializeGraphView } from './ui/graphView';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "NodeCode" is now active!');
    const disposable = vscode.commands.registerCommand('nodecode.showGraph', () => {
        initializeGraphView(context);
    });
    context.subscriptions.push(disposable);
}

export function deactivate() {}