/**
 * Webview panel entry point — initializes the anime character playground.
 * This file is bundled by webpack and loaded in the webview's HTML.
 */

import { AnimeCharacterType, CharacterSize, SCALE_FACTORS, WebviewMessage } from '../common/types';
import { CHARACTER_DATA } from '../common/characters';
import { CharacterCollection } from './character-collection';

declare function acquireVsCodeApi(): {
    postMessage(message: any): void;
    getState(): any;
    setState(state: any): void;
};

let vscodeApi: ReturnType<typeof acquireVsCodeApi>;
let collection: CharacterCollection;

/**
 * Main initialization function called from the webview HTML.
 */
export function animePanelApp(
    baseMediaUri: string,
    theme: string,
    themeKind: number,
    size: string,
    characterType: string,
) {
    vscodeApi = acquireVsCodeApi();

    const container = document.getElementById('animeContainer');
    if (!container) {
        console.error('animeContainer not found');
        return;
    }

    // Apply theme
    applyTheme(theme, themeKind, baseMediaUri);

    // Initialize character collection
    const characterSize = size as CharacterSize;
    collection = new CharacterCollection(container, baseMediaUri, characterSize);

    // Listen for messages from the extension host
    window.addEventListener('message', (event) => {
        const message = event.data;
        handleMessage(message, container, baseMediaUri, characterSize);
    });
}

function handleMessage(
    message: any,
    container: HTMLElement,
    baseMediaUri: string,
    defaultSize: CharacterSize,
): void {
    switch (message.command) {
        case 'spawn-character':
            if (message.type && message.name) {
                collection.spawn(message.type as AnimeCharacterType, message.name);
            }
            break;

        case 'remove-character':
            if (message.name) {
                collection.remove(message.name);
            }
            break;

        case 'remove-all':
            collection.removeAll();
            break;

        case 'list-characters':
            vscodeApi.postMessage({
                command: 'list-characters',
                text: collection.listAll(),
            });
            break;

        case 'roll-call':
            collection.rollCall();
            break;

        case 'set-size':
            if (message.size) {
                collection.updateSize(message.size as CharacterSize);
            }
            break;
    }
}

function applyTheme(theme: string, themeKind: number, baseMediaUri: string): void {
    const container = document.getElementById('animeContainer');
    if (!container) { return; }

    // Remove existing theme classes
    container.classList.remove('theme-konoha', 'theme-capsulecorp', 'theme-grandline');

    if (theme && theme !== 'none') {
        container.classList.add(`theme-${theme}`);

        // Set background image for the theme
        const foreground = document.getElementById('foreground');
        if (foreground) {
            foreground.style.backgroundImage = `url('${baseMediaUri}/themes/${theme}.png')`;
            foreground.style.display = 'block';
        }
    } else {
        const foreground = document.getElementById('foreground');
        if (foreground) {
            foreground.style.backgroundImage = 'none';
            foreground.style.display = 'none';
        }
    }
}
