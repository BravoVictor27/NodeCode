import * as vscode from 'vscode';
import * as path from 'path';
import { buildGraph } from '../core/graphBuilder';

export async function initializeGraphView(context: vscode.ExtensionContext) {
    const panel = vscode.window.createWebviewPanel(
        'nodecodeGraphView',
        'NodeCode Graph View',
        vscode.ViewColumn.One,
        { 
            enableScripts: true,
            localResourceRoots: [vscode.Uri.file(path.join(context.extensionPath, 'node_modules'))]
        }
    );

    const cytoscapePath = panel.webview.asWebviewUri(
        vscode.Uri.file(path.join(context.extensionPath, 'node_modules', 'cytoscape', 'dist', 'cytoscape.min.js'))
    );

    let graphData;
    try {
        graphData = await buildGraph();
        console.log('Graph data loaded:', graphData);
    } catch (error: any) {
        console.error('Error building graph:', error);
        panel.webview.html = `<h1>Error: ${error.message}</h1>`;
        return;
    }

    panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <script src="${cytoscapePath}"></script>
            <style>
                #graph-container { width: 100%; height: 100vh; }
            </style>
        </head>
        <body>
            <div id="graph-container"></div>
            <script>
                const vscode = acquireVsCodeApi();
                const cy = cytoscape({
                    container: document.getElementById('graph-container'),
                    elements: ${JSON.stringify({
                        nodes: graphData.nodes,
                        edges: graphData.edges
                    })},
                    style: [
                        { selector: 'node', style: { 'background-color': 'gray', 'label': 'data(label)', 'text-valign': 'top', 'color': 'white' } },
                        { selector: 'edge', style: {
                            'width': 2,
                            'line-color': '#666',
                            'target-arrow-shape': 'triangle',
                            'target-arrow-color': '#666',
                            'arrow-scale': 1.5,
                            'curve-style': 'bezier'
                        }},
                        { selector: 'node.highlight', style: {
                            'background-color': '#FFA500',
                            'border-width': 2,
                            'border-color': '#FF4500',
                            'border-opacity': 1
                        }},
                        { selector: 'edge.highlight', style: {
                            'line-color': '#FF4500',
                            'target-arrow-color': '#FF4500',
                            'width': 3,
                            'z-index': 9999
                        }}
                    ],
                    layout: { name: 'cose' }
                });
                cy.ready(() => {
                    cy.layout({ name: 'cose' }).run(); // Force re-render
                    vscode.postMessage({ command: 'log', text: 'Graph re-rendered' });
                    // Log arrow styles for each edge
                    cy.edges().forEach(edge => {
                        const arrowShape = edge.style('target-arrow-shape');
                        const arrowColor = edge.style('target-arrow-color');
                        vscode.postMessage({ 
                            command: 'log', 
                            text: 'Edge ' + edge.data('source') + ' -> ' + edge.data('target') + ': arrow-shape=' + arrowShape + ', arrow-color=' + arrowColor 
                        });
                    });
                });
                vscode.postMessage({ command: 'log', text: 'Cytoscape edges: ' + JSON.stringify(cy.edges().map(e => e.data())) });

                cy.on('tap', 'node', function(evt) {
                    const node = evt.target;
                    const filePath = node.data('id');
                    vscode.postMessage({ command: 'log', text: 'Node tapped: ' + filePath });
                    vscode.postMessage({ command: 'openFile', filePath: filePath });
                });

                cy.on('tap', 'edge', function(evt) {
                    const edge = evt.target;
                    const edgeData = {
                        source: edge.data('source'),
                        target: edge.data('target'),
                        importedNames: edge.data('importedNames'),
                        lineNumber: edge.data('lineNumber')
                    };
                    vscode.postMessage({ command: 'log', text: 'Edge tapped: ' + JSON.stringify(edgeData) });
                    vscode.postMessage({ command: 'showEdgeDetails', edgeData: edgeData });
                });

                cy.on('mouseover', 'node', function(evt) {
    const node = evt.target;
    const connectedEdges = node.connectedEdges();
    const connectedNodes = connectedEdges.connectedNodes();

    console.log('Mouse over node:', node.id());
    node.addClass('highlight');
    connectedNodes.addClass('highlight');
    connectedEdges.addClass('highlight');
});

cy.on('mouseout', 'node', function(evt) {
    const node = evt.target;
    const connectedEdges = node.connectedEdges();
    const connectedNodes = connectedEdges.connectedNodes();

    console.log('Mouse out from node:', node.id());
    node.removeClass('highlight');
    connectedNodes.removeClass('highlight');
    connectedEdges.removeClass('highlight');
});
            </script>
        </body>
        </html>
    `;

    panel.webview.onDidReceiveMessage(
        message => {
            console.log('Received message:', message);
            if (message.command === 'openFile') {
                const uri = vscode.Uri.file(message.filePath);
                vscode.workspace.openTextDocument(uri).then(doc => {
                    vscode.window.showTextDocument(doc);
                }, err => {
                    console.error('Error opening file:', err);
                });
            } else if (message.command === 'showEdgeDetails') {
                const { source, target, importedNames, lineNumber } = message.edgeData;
                const sourceName = path.basename(source);
                const targetName = path.basename(target);
                const msg = `Edge: ${sourceName} → ${targetName}\nImported: ${importedNames.join(', ')}\nLine: ${lineNumber}`;
                vscode.window.showInformationMessage(msg);
            } else if (message.command === 'log') {
                console.log(message.text);
            }
        },
        undefined,
        context.subscriptions
    );
}