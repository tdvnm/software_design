export function getElement(id) {
    const node = document.getElementById(id);
    if (!node)
        throw new Error(`Missing element: ${id}`);
    return node;
}
export function createButton(label, action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.addEventListener('click', action);
    return button;
}
export function addOption(select, value, label = value) {
    select.add(new Option(label, value));
}
