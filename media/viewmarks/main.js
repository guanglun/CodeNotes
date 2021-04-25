// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    //const oldState = vscode.getState();

    vscodeLog('js start up');

    function vscodeLog(message) {
        vscode.postMessage({
            command: 'log',
            text: message
        });
    }

    var connectCommon = {
        connector: ['Bezier'],
        anchor: ['Left', 'Right', 'Top', 'Bottom'],
        paintStyle: { stroke: "white" },
        connectorStyle: { stroke: 'white', strokeWidth: 6 },
        overlays: [     [ "Arrow", { width:12, length:12, location:0.85 }],
                        [ "Label", { location:0.65 ,label:'', cssClass:"labelStyle"}]]
    };

    var endpointCommon = {
        endpoint: ["Dot", { radius: 5, cssClass: "initial_endpoint", hoverClass: "hover_endpoint" }],
        endpointStyle: { fill: 'white' },

    };

    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'marks':
                vscodeLog(message.marks);
                message.marks.forEach(function (mark) {
                    var left = mark.id * 200;
                    container.innerHTML += `<div id="${mark.id}" class="mark_div" style="left:${left}px;">
                                            <p class="mark_name_p">${mark.name}<p>
                                            </div>`;

                });

                message.marks.forEach(function (mark) {

                    mark.mdata.jb.forEach(function (jb) {
                        jsPlumb.addEndpoint(`${mark.id}`, {
                            anchors: ['Left', 'Right', 'Top', 'Bottom'],
                            uuid: `${mark.id}-${jb.id}-from`
                        },endpointCommon);

                        jsPlumb.addEndpoint(`${jb.id}`, {
                            anchors: ['Left', 'Right', 'Top', 'Bottom'],
                            uuid: `${mark.id}-${jb.id}-to`
                        },endpointCommon);

                        // connectCommon.label = `${jb.name}`;
                        // vscodeLog(connectCommon.overlays[1]);
                        connectCommon.overlays[1][1].label = `${jb.name}`;
                        jsPlumb.connect({ uuids: [`${mark.id}-${jb.id}-from`, `${mark.id}-${jb.id}-to`] },connectCommon);
                    });


                    jsPlumb.draggable(`${mark.id}`, {
                        grid: [1, 1]
                    });
                });


                break;
        }
    });



    /* global jsPlumb */
    jsPlumb.ready(function () {
        // jsPlumb.connect({
        //     source: 'item_left',
        //     target: 'item_right',
        //     endpoint: 'Dot',
        //     connector: ['Flowchart'],
        //     anchor: ['Left', 'Right']
        // })

        // jsPlumb.connect({
        //     source: 'item_right',
        //     target: 'item_right0',
        //     endpoint: 'Dot',
        //     connector: ['Flowchart'],
        //     anchor: ['Left', 'Right']
        // })

        // jsPlumb.draggable('item_left')
        // jsPlumb.draggable('item_right')
        // jsPlumb.draggable('item_right0')
        vscode.postMessage({ command: 'state', state: 'startup' });
    });


}());