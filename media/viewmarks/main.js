// This script will be run within the webview itself
// It cannot access the main VS Code APIs directly.
(function () {
    const vscode = acquireVsCodeApi();

    //const oldState = vscode.getState();

    vscodeLog('js start up');

    function vscodeLog(message)
    {
        vscode.postMessage({
            command: 'log',
            text: message
        });
    }

    //container.innerHTML += '<div id= "item_left" class="item"></div>';
    //container.innerHTML += '<div id="item_right" class="item" style="left:150px;"></div>';
    //container.innerHTML += '<div id="item_right0" class="item" style="left:300px;"></div>';

    // var text = document.createTextNode("这是一段文字");
    // var ele = document.createElement("h3");//创建一个html标签
    // ele.appendChild(text);//在标签内添加文字
    // container.appendChild(ele);//将标签添加到页面中

    // <div id="item_left" class="item"></div>
    // <div id="item_right" class="item" style="left:150px;"></div>
    // <div id="item_right0" class="item" style="left:300px;"></div>


    // Handle messages sent from the extension to the webview
    window.addEventListener('message', event => {
        const message = event.data; // The json data that the extension sent
        switch (message.command) {
            case 'marks':
                //vscodeLog(message.marks)
                message.marks.forEach(function (mark) {
                    var left = mark.id * 200
                    container.innerHTML += `<div id="id-${mark.id}" class="mark_div" style="left:${left}px;">
                                            <div class="mark_name_div">${mark.name}<div>
                                            </div>`;

                });

                message.marks.forEach(function (mark) {
                    
                    jsPlumb.draggable(`id-${mark.id}`)
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
        vscode.postMessage({command: 'state',state: 'startup'});
    })

    
}());