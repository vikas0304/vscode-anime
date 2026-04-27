/**
 * AnimeElement — base animated entity for the webview.
 * Handles position, velocity, animation frame cycling, boundary collision, and rendering.
 */

import { AnimeCharacterType, CharacterSize, SCALE_FACTORS } from '../common/types';
import { CHARACTER_DATA } from '../common/characters';
import { CharacterState, resolveState, pickNextState } from './states';

export class AnimeElement {
    public name: string;
    public type: AnimeCharacterType;
    public el: HTMLDivElement;
    public x: number;
    public y: number;
    private vx: number = 0;
    private facingRight: boolean = true;
    private currentState: CharacterState;
    private stateTimer: number = 0;
    private stateDuration: number = 0;
    private frameIndex: number = 0;
    private frameTimer: number = 0;
    private frameDuration: number = 150; // ms per frame
    private size: CharacterSize;
    private baseMediaUri: string;
    private characterSpeed: number;
    private showingName: boolean = false;
    private nameEl: HTMLDivElement | null = null;

    constructor(
        type: AnimeCharacterType,
        name: string,
        size: CharacterSize,
        container: HTMLElement,
        baseMediaUri: string,
        floorY: number,
    ) {
        this.type = type;
        this.name = name;
        this.size = size;
        this.baseMediaUri = baseMediaUri;

        const config = CHARACTER_DATA[type];
        this.characterSpeed = config.speed;

        // Create DOM element
        this.el = document.createElement('div');
        this.el.className = 'anime-character';
        this.el.title = `${config.name} "${name}"`;

        // Create sprite image
        const img = document.createElement('img');
        img.src = `${baseMediaUri}/characters/${type}/walk_1.png`;
        img.alt = config.name;
        img.draggable = false;

        const scale = SCALE_FACTORS[size];
        const displayWidth = config.spriteWidth * scale;
        const displayHeight = config.spriteHeight * scale;
        img.style.width = `${displayWidth}px`;
        img.style.height = `${displayHeight}px`;
        img.style.imageRendering = 'pixelated';

        this.el.appendChild(img);

        // Name label (shown on hover)
        this.nameEl = document.createElement('div');
        this.nameEl.className = 'character-name';
        this.nameEl.textContent = name;
        this.nameEl.style.display = 'none';
        this.el.appendChild(this.nameEl);

        // Hover events
        this.el.addEventListener('mouseenter', () => {
            if (this.nameEl) {
                this.nameEl.style.display = 'block';
            }
        });
        this.el.addEventListener('mouseleave', () => {
            if (this.nameEl) {
                this.nameEl.style.display = 'none';
            }
        });

        // Position
        this.x = Math.random() * (container.clientWidth - displayWidth);
        this.y = floorY - displayHeight;

        this.el.style.position = 'absolute';
        this.el.style.left = `${this.x}px`;
        this.el.style.bottom = '0px';
        this.el.style.zIndex = '10';

        container.appendChild(this.el);

        // Initialize state
        this.currentState = CharacterState.idle;
        this.transitionToState(pickNextState(CharacterState.idle));
    }

    private transitionToState(newState: CharacterState): void {
        this.currentState = newState;
        const { result, durationMs } = resolveState(newState);
        this.stateDuration = durationMs;
        this.stateTimer = 0;
        this.vx = result.directionX * result.speedMultiplier * this.characterSpeed;

        if (result.directionX !== 0) {
            this.facingRight = result.directionX > 0;
        }

        // Reset frame
        this.frameIndex = 0;
        this.frameTimer = 0;
    }

    /**
     * Update the character's position and animation.
     * @param dt Delta time in milliseconds
     * @param containerWidth Width of the container for boundary checks
     */
    public update(dt: number, containerWidth: number): void {
        // State timer
        this.stateTimer += dt;
        if (this.stateTimer >= this.stateDuration) {
            this.transitionToState(pickNextState(this.currentState));
        }

        // Frame animation
        this.frameTimer += dt;
        if (this.frameTimer >= this.frameDuration) {
            this.frameTimer = 0;
            const config = CHARACTER_DATA[this.type];
            const maxFrames = this.currentState === CharacterState.idle
                ? config.idleFrames
                : config.walkFrames;
            this.frameIndex = (this.frameIndex + 1) % maxFrames;
            this.updateSprite();
        }

        // Movement
        const scale = SCALE_FACTORS[this.size];
        const config = CHARACTER_DATA[this.type];
        const displayWidth = config.spriteWidth * scale;
        const speed = this.vx * scale * 0.5;

        this.x += speed * (dt / 16.67); // Normalize to ~60fps

        // Boundary collision
        if (this.x <= 0) {
            this.x = 0;
            this.vx = Math.abs(this.vx); // Bounce right
            this.facingRight = true;
        } else if (this.x >= containerWidth - displayWidth) {
            this.x = containerWidth - displayWidth;
            this.vx = -Math.abs(this.vx); // Bounce left
            this.facingRight = false;
        }

        // Update DOM
        this.el.style.left = `${this.x}px`;
        this.el.style.transform = this.facingRight ? 'scaleX(1)' : 'scaleX(-1)';
    }

    private updateSprite(): void {
        const img = this.el.querySelector('img');
        if (!img) { return; }

        let animPrefix: string;
        switch (this.currentState) {
            case CharacterState.idle:
            case CharacterState.sitting:
                animPrefix = 'idle';
                break;
            case CharacterState.walking:
                animPrefix = 'walk';
                break;
            case CharacterState.running:
                animPrefix = 'walk'; // Use walk sprites, faster frame rate for running
                this.frameDuration = 80;
                break;
            default:
                animPrefix = 'idle';
        }

        if (this.currentState !== CharacterState.running) {
            this.frameDuration = 150;
        }

        const frameNum = this.frameIndex + 1;
        img.src = `${this.baseMediaUri}/characters/${this.type}/${animPrefix}_${frameNum}.png`;
    }

    /**
     * Update the size of the character.
     */
    public updateSize(newSize: CharacterSize): void {
        this.size = newSize;
        const config = CHARACTER_DATA[this.type];
        const scale = SCALE_FACTORS[newSize];
        const img = this.el.querySelector('img');
        if (img) {
            img.style.width = `${config.spriteWidth * scale}px`;
            img.style.height = `${config.spriteHeight * scale}px`;
        }
    }

    /**
     * Remove the character from the DOM.
     */
    public remove(): void {
        this.el.remove();
    }
}
