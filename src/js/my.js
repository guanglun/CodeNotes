
jsPlumb.ready(function () {
  jsPlumb.connect({
    source: 'item_left',
    target: 'item_right',
    endpoint: 'Rectangle'
  });

  jsPlumb.draggable('item_left');
  jsPlumb.draggable('item_right');
})