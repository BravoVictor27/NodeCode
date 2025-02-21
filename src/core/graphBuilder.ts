import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface GraphNode {
    id: string;
    label: string;
    type: 'file';
}

export interface GraphEdge {
    source: string;
    target: string;
    type: 'import' | 'export';
    importedNames: string[];
    lineNumber: number;
}

export interface GraphData {
    nodes: { data: GraphNode }[];
    edges: { data: GraphEdge }[];
}

export async function buildGraph(): Promise<GraphData> {
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
    if (!workspaceRoot) {
        throw new Error('No workspace folder found');
    }

    const fileUris = await vscode.workspace.findFiles('**/*.{ts,js}', '**/node_modules/**');
    const files = fileUris.map(uri => ({ fsPath: uri.fsPath }));

    console.log('Discovered files:', files);

    const nodes: { data: GraphNode }[] = files.map(file => ({
        data: {
            id: file.fsPath,
            label: path.basename(file.fsPath),
            type: 'file'
        }
    }));

    const edges: { data: GraphEdge }[] = [];
    const fileMap = new Map<string, string>();
    files.forEach(f => {
        const normalized = path.normalize(f.fsPath);
        fileMap.set(normalized, f.fsPath);
        const extless = normalized.replace(/(\.ts|\.js)$/, '');
        if (extless !== normalized) fileMap.set(extless, f.fsPath);
    });

    for (const file of files) {
        const content = await fs.readFile(file.fsPath, 'utf8');
        const lines = content.split('\n');
        console.log(`File content [${file.fsPath}]:`, content);
        const importRegex = /import\s*({[^}]+}|\*|\w+)\s*from\s+['"]([^'"]+)['"]/g;
        let match: RegExpExecArray | null;
        while ((match = importRegex.exec(content)) !== null) {
            const safeMatch = match as RegExpExecArray;
            const importNamesRaw = safeMatch[1].trim();
            const importPath = safeMatch[2];
            const lineNumber = lines.findIndex(line => line.includes(safeMatch[0])) + 1;
            const importedNames = importNamesRaw === '*'
                ? ['*']
                : importNamesRaw.replace(/[{}]/g, '').split(',').map(name => name.trim());

            const resolvedPath = path.normalize(path.resolve(path.dirname(file.fsPath), importPath));
            let targetPath = fileMap.get(resolvedPath);
            if (!targetPath) {
                for (const ext of ['.ts', '.js']) {
                    const candidate = resolvedPath + ext;
                    targetPath = fileMap.get(candidate);
                    if (targetPath) {
                        console.log(`Resolved ${importPath} to ${candidate}`);
                        break;
                    }
                }
            }
            if (targetPath && file.fsPath !== targetPath) {
                const edge: { data: GraphEdge } = { // Explicitly type the edge object
                    data: {
                        source: file.fsPath,
                        target: targetPath,
                        type: 'import', // Literal type matches 'import' | 'export'
                        importedNames,
                        lineNumber
                    }
                };
                console.log(`Edge created: ${path.basename(file.fsPath)} -> ${path.basename(targetPath)}`);
                edges.push(edge);
            } else {
                console.log(`No valid target for import: ${importPath} in ${file.fsPath}, resolved to: ${resolvedPath}`);
            }
        }
    }
    console.log('Edges:', edges);

    return { nodes, edges };
}