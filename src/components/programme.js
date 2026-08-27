import { addOption, getElement } from '../lib/dom.js';
export function setupProgramme(subjects) {
    const major = getElement('major');
    const minor = getElement('minor');
    for (const subject of subjects) {
        if (['core', 'foundation core'].includes(subject))
            continue;
        addOption(minor, subject);
        if (!['arts', 'business studies', 'philosophy'].includes(subject))
            addOption(major, subject);
    }
    if (subjects.includes('computer science'))
        major.value = 'computer science';
    function render() {
        getElement('programme-summary').textContent =
            `Major: ${major.value || 'undecided'}. Minor: ${minor.value || 'none'}.`;
    }
    major.addEventListener('change', render);
    minor.addEventListener('change', render);
    render();
}
