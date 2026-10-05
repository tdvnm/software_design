export function makeDraggable(node, course) {
    node.draggable = true;
    node.addEventListener('dragstart', event => {
        event.dataTransfer.setData('text/plain', course.code);
        event.dataTransfer.effectAllowed = 'copyMove';
        node.classList.add('is-dragging');
        // while the course is in hand, say which trimesters it is offered in so
        // the board can light those cells up
        document.body.dataset.dragOffered = (course.offered || []).join(' ');
    });
    node.addEventListener('dragend', () => {
        node.classList.remove('is-dragging');
        delete document.body.dataset.dragOffered;
        document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    });
}
export function makeDropTarget(node, onDrop) {
    node.addEventListener('dragover', event => {
        if (!event.dataTransfer.types.includes('text/plain')) return;
        event.preventDefault();
        node.classList.add('drop-target');
    });
    node.addEventListener('dragleave', event => {
        if (!node.contains(event.relatedTarget)) node.classList.remove('drop-target');
    });
    node.addEventListener('drop', event => {
        event.preventDefault();
        node.classList.remove('drop-target');
        const code = event.dataTransfer.getData('text/plain');
        if (code) onDrop(code);
    });
}
