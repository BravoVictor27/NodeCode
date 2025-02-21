// setupGraphViewExtension.ts
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

// Configuration
const projectRoot = process.cwd();
const extensionName = 'windsurf-graph-view-extension';

// Utility to write files
function writeFile(filePath: string, content: string) {
    const fullPath = path.join(projectRoot, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim(), 'utf8');
    console.log(`Created: ${filePath}`);
}

// 1. Create package.json
writeFile('package.json', `
{
    "name": "${extensionName}",
    "displayName": "Windsurf Graph View Extension",
    "description": "Visualizes codebases as an interactive graph in Windsurf",
    "version": "0.0.1",
    "publisher": "YourName",
    "engines": { "vscode": "^1.85.0" },
    "categories": ["Other"],
    "activationEvents": ["onCommand:windsurfGraphView.showGraph"],
    "main": "./dist/extension.js",
    "contributes": {
        "commands": [{
            "command": "windsurfGraphView.showGraph",
            "title": "Show Graph View"
        }]
    },
    "scripts": {
        "build": "webpack",
        "test": "jest"
    },
    "devDependencies": {
        "@types/vscode": "^1.85.0",
        "@types/node": "^18.19.0",
        "typescript": "^5.3.3",
        "webpack": "^5.89.0",
        "webpack-cli": "^5.1.4",
        "ts-loader": "^9.5.0",
        "jest": "^29.7.0",
        "@types/jest": "^29.5.11"
    },
    "dependencies": {
        "cytoscape": "^3.28.0"
    }
}
`);

// 2. Create tsconfig.json
writeFile('tsconfig.json', `
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "strict": true,
        "esModuleInterop": true,
        "outDir": "./dist",
        "rootDir": "./src",
        "noImplicitAny": true,
        "skipLibCheck": true
    },
    "include": ["src/**/*"]
}
`);

// 3. Create webpack.config.js
writeFile('webpack.config.js', `
const path = require('path');

module.exports = {
    entry: './src/extension.ts',
    target: 'node',
    mode: 'production',
    module: {
        rules: [{
            test: /\.ts$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'extension.js',
        path: path.resolve(__dirname, 'dist'),
        libraryTarget: 'commonjs2'
    },
    externals: {
        vscode: 'commonjs vscode'
    }
};
`);

// 4. Create src/extension.ts
writeFile('src/extension.ts', `
import * as vscode from 'vscode';
import { initializeGraphView } from './ui/graphView';

export function activate(context: vscode.ExtensionContext) {
    console.log('Congratulations, your extension "WindsurfGraphViewExtension" is now active!');
    const disposable = vscode.commands.registerCommand('windsurfGraphView.showGraph', () => {
        initializeGraphView(context);
    });
    context.subscriptions.push(disposable);
}

export function deactivate() {}
`);

// 5. Create src/ui/graphView.ts
writeFile('src/ui/graphView.ts', `
import * as vscode from 'vscode';

export function initializeGraphView(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'windsurfGraphView',
        'Windsurf Graph View',
        vscode.ViewColumn.One,
        { enableScripts: true, localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'node_modules'))] }
    );

    const cytoscapePath = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'node_modules', 'cytoscape', 'dist', 'cytoscape.min.js'))
    );

    panel.webview.html = \`
        <!DOCTYPE html>
        <html>
        <head>
            <script src="\${cytoscapePath}"></script>
            <style>
                #graph-container { width: 100%; height: 100vh; }
            </style>
        </head>
        <body>
            <div id="graph-container"></div>
            <script>
                const cy = cytoscape({
                    container: document.getElementById('graph-container'),
                    elements: [
                        { data: { id: 'file1.ts', label: 'file1.ts' } },
                        { data: { id: 'file2.ts', label: 'file2.ts' } },
                        { data: { id: 'file3.ts', label: 'file3.ts' } },
                        { data: { source: 'file1.ts', target: 'file2.ts' } },
                        { data: { source: 'file2.ts', target: 'file3.ts' } }
                    ],
                    style: [
                        { selector: 'node', style: { 'background-color': 'blue', 'label': 'data(label)' } },
                        { selector: 'edge', style: { 'width': 2, 'line-color': 'gray' } }
                    ],
                    layout: { name: 'grid' }
                });
            </script>
        </body>
        </html>
    \`;
}
`);

// 6. Create basic docs/Overview.md
writeFile('docs/Overview.md', `
# Windsurf Graph View Extension

This extension visualizes codebases as an interactive graph in Windsurf, similar to Obsidian's graph view. 

- **Goals:** Improve navigation, refactoring, and understanding of codebases.
- **Target:** Developers using Windsurf.

See [[Features]] and [[TechStack]] for more details.
`);

// 7. Install dependencies and build
console.log('Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });
console.log('Building the extension...');
execSync('npm run build', { stdio: 'inherit' });

console.log('Setup complete! Run the extension in Windsurf by pressing F5 or using the debug panel.');