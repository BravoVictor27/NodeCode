"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// setupGraphViewExtension.ts
var fs = require("fs");
var path = require("path");
var child_process_1 = require("child_process");
// Configuration
var projectRoot = process.cwd();
var extensionName = 'windsurf-graph-view-extension';
// Utility to write files
function writeFile(filePath, content) {
    var fullPath = path.join(projectRoot, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content.trim(), 'utf8');
    console.log("Created: ".concat(filePath));
}
// 1. Create package.json
writeFile('package.json', "\n{\n    \"name\": \"".concat(extensionName, "\",\n    \"displayName\": \"Windsurf Graph View Extension\",\n    \"description\": \"Visualizes codebases as an interactive graph in Windsurf\",\n    \"version\": \"0.0.1\",\n    \"publisher\": \"YourName\",\n    \"engines\": { \"vscode\": \"^1.85.0\" },\n    \"categories\": [\"Other\"],\n    \"activationEvents\": [\"onCommand:windsurfGraphView.showGraph\"],\n    \"main\": \"./dist/extension.js\",\n    \"contributes\": {\n        \"commands\": [{\n            \"command\": \"windsurfGraphView.showGraph\",\n            \"title\": \"Show Graph View\"\n        }]\n    },\n    \"scripts\": {\n        \"build\": \"webpack\",\n        \"test\": \"jest\"\n    },\n    \"devDependencies\": {\n        \"@types/vscode\": \"^1.85.0\",\n        \"@types/node\": \"^18.19.0\",\n        \"typescript\": \"^5.3.3\",\n        \"webpack\": \"^5.89.0\",\n        \"webpack-cli\": \"^5.1.4\",\n        \"ts-loader\": \"^9.5.0\",\n        \"jest\": \"^29.7.0\",\n        \"@types/jest\": \"^29.5.11\"\n    },\n    \"dependencies\": {\n        \"cytoscape\": \"^3.28.0\"\n    }\n}\n"));
// 2. Create tsconfig.json
writeFile('tsconfig.json', "\n{\n    \"compilerOptions\": {\n        \"target\": \"ES2020\",\n        \"module\": \"commonjs\",\n        \"strict\": true,\n        \"esModuleInterop\": true,\n        \"outDir\": \"./dist\",\n        \"rootDir\": \"./src\",\n        \"noImplicitAny\": true,\n        \"skipLibCheck\": true\n    },\n    \"include\": [\"src/**/*\"]\n}\n");
// 3. Create webpack.config.js
writeFile('webpack.config.js', "\nconst path = require('path');\n\nmodule.exports = {\n    entry: './src/extension.ts',\n    target: 'node',\n    mode: 'production',\n    module: {\n        rules: [{\n            test: /.ts$/,\n            use: 'ts-loader',\n            exclude: /node_modules/\n        }]\n    },\n    resolve: {\n        extensions: ['.ts', '.js']\n    },\n    output: {\n        filename: 'extension.js',\n        path: path.resolve(__dirname, 'dist'),\n        libraryTarget: 'commonjs2'\n    },\n    externals: {\n        vscode: 'commonjs vscode'\n    }\n};\n");
// 4. Create src/extension.ts
writeFile('src/extension.ts', "\nimport * as vscode from 'vscode';\nimport { initializeGraphView } from './ui/graphView';\n\nexport function activate(context: vscode.ExtensionContext) {\n    console.log('Congratulations, your extension \"WindsurfGraphViewExtension\" is now active!');\n    const disposable = vscode.commands.registerCommand('windsurfGraphView.showGraph', () => {\n        initializeGraphView(context);\n    });\n    context.subscriptions.push(disposable);\n}\n\nexport function deactivate() {}\n");
// 5. Create src/ui/graphView.ts
writeFile('src/ui/graphView.ts', "\nimport * as vscode from 'vscode';\n\nexport function initializeGraphView(context: vscode.ExtensionContext) {\n    const panel = vscode.window.createWebviewPanel(\n        'windsurfGraphView',\n        'Windsurf Graph View',\n        vscode.ViewColumn.One,\n        { enableScripts: true, localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'node_modules'))] }\n    );\n\n    const cytoscapePath = panel.webview.asWebviewUri(\n        vscode.Uri.file(path.join(context.extensionPath, 'node_modules', 'cytoscape', 'dist', 'cytoscape.min.js'))\n    );\n\n    panel.webview.html = `\n        <!DOCTYPE html>\n        <html>\n        <head>\n            <script src=\"${cytoscapePath}\"></script>\n            <style>\n                #graph-container { width: 100%; height: 100vh; }\n            </style>\n        </head>\n        <body>\n            <div id=\"graph-container\"></div>\n            <script>\n                const cy = cytoscape({\n                    container: document.getElementById('graph-container'),\n                    elements: [\n                        { data: { id: 'file1.ts', label: 'file1.ts' } },\n                        { data: { id: 'file2.ts', label: 'file2.ts' } },\n                        { data: { id: 'file3.ts', label: 'file3.ts' } },\n                        { data: { source: 'file1.ts', target: 'file2.ts' } },\n                        { data: { source: 'file2.ts', target: 'file3.ts' } }\n                    ],\n                    style: [\n                        { selector: 'node', style: { 'background-color': 'blue', 'label': 'data(label)' } },\n                        { selector: 'edge', style: { 'width': 2, 'line-color': 'gray' } }\n                    ],\n                    layout: { name: 'grid' }\n                });\n            </script>\n        </body>\n        </html>\n    `;\n}\n");
// 6. Create basic docs/Overview.md
writeFile('docs/Overview.md', "\n# Windsurf Graph View Extension\n\nThis extension visualizes codebases as an interactive graph in Windsurf, similar to Obsidian's graph view. \n\n- **Goals:** Improve navigation, refactoring, and understanding of codebases.\n- **Target:** Developers using Windsurf.\n\nSee [[Features]] and [[TechStack]] for more details.\n");
// 7. Install dependencies and build
console.log('Installing dependencies...');
(0, child_process_1.execSync)('npm install', { stdio: 'inherit' });
console.log('Building the extension...');
(0, child_process_1.execSync)('npm run build', { stdio: 'inherit' });
console.log('Setup complete! Run the extension in Windsurf by pressing F5 or using the debug panel.');
