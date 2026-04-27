/**
 * CharacterCollection — manages all active anime characters in the panel.
 */

import { AnimeCharacterType, CharacterSize, WebviewMessage } from '../common/types';
import { AnimeElement } from './anime-element';

export class CharacterCollection {
    private characters: AnimeElement[] = [];
    private container: HTMLElement;
    private baseMediaUri: string;
    private size: CharacterSize;
    private animationId: number | null = null;
    private lastTimestamp: number = 0;

    constructor(container: HTMLElement, baseMediaUri: string, size: CharacterSize) {
        this.container = container;
        this.baseMediaUri = baseMediaUri;
        this.size = size;
    }

    /**
     * Spawn a new anime character.
     */
    public spawn(type: AnimeCharacterType, name: string): void {
        const character = new AnimeElement(
            type,
            name,
            this.size,
            this.container,
            this.baseMediaUri,
            this.container.clientHeight,
        );
        this.characters.push(character);

        // Start animation loop if not already running
        if (this.animationId === null) {
            this.lastTimestamp = performance.now();
            this.startAnimationLoop();
        }
    }

    /**
     * Remove a character by name.
     */
    public remove(name: string): boolean {
        const idx = this.characters.findIndex((c) => c.name === name);
        if (idx >= 0) {
            this.characters[idx].remove();
            this.characters.splice(idx, 1);

            // Stop animation if no characters left
            if (this.characters.length === 0 && this.animationId !== null) {
                cancelAnimationFrame(this.animationId);
                this.animationId = null;
            }
            return true;
        }
        return false;
    }

    /**
     * Remove all characters.
     */
    public removeAll(): void {
        for (const character of this.characters) {
            character.remove();
        }
        this.characters = [];
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * List all characters as a string for messaging.
     */
    public listAll(): string {
        return this.characters
            .map((c) => `${c.type},${c.name}`)
            .join('\n');
    }

    /**
     * Show a roll-call: flash each character's name.
     */
    public rollCall(): void {
        for (const character of this.characters) {
            const nameEl = character.el.querySelector('.character-name') as HTMLDivElement | null;
            if (nameEl) {
                nameEl.style.display = 'block';
                setTimeout(() => {
                    nameEl.style.display = 'none';
                }, 3000);
            }
        }
    }

    /**
     * Update the size for all characters.
     */
    public updateSize(newSize: CharacterSize): void {
        this.size = newSize;
        for (const character of this.characters) {
            character.updateSize(newSize);
        }
    }

    /**
     * Main animation loop using requestAnimationFrame.
     */
    private startAnimationLoop(): void {
        const loop = (timestamp: number) => {
            const dt = timestamp - this.lastTimestamp;
            this.lastTimestamp = timestamp;

            const containerWidth = this.container.clientWidth;

            for (const character of this.characters) {
                character.update(dt, containerWidth);
            }

            this.animationId = requestAnimationFrame(loop);
        };
        this.animationId = requestAnimationFrame(loop);
    }
}
