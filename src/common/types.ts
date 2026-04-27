// Common types shared between extension host and webview panel

export enum CharacterSize {
    nano = 'nano',
    small = 'small',
    medium = 'medium',
    large = 'large',
}

export const ALL_SCALES = [
    CharacterSize.nano,
    CharacterSize.small,
    CharacterSize.medium,
    CharacterSize.large,
];

export const SCALE_FACTORS: Record<CharacterSize, number> = {
    [CharacterSize.nano]: 1,
    [CharacterSize.small]: 2,
    [CharacterSize.medium]: 3,
    [CharacterSize.large]: 4,
};

export enum ExtPosition {
    panel = 'panel',
    explorer = 'explorer',
}

export enum Theme {
    none = 'none',
    konoha = 'konoha',
    capsulecorp = 'capsulecorp',
    grandline = 'grandline',
}

export const ALL_THEMES = [
    Theme.none,
    Theme.konoha,
    Theme.capsulecorp,
    Theme.grandline,
];

export enum AnimeSeries {
    naruto = 'Naruto',
    dragonball = 'Dragon Ball',
    onepiece = 'One Piece',
    sailormoon = 'Sailor Moon',
    attackontitan = 'Attack on Titan',
    ghibli = 'Studio Ghibli',
    demonslayer = 'Demon Slayer',
    jujutsukaisen = 'Jujutsu Kaisen',
    myheroacademia = 'My Hero Academia',
    dragonmaid = 'Miss Kobayashi\'s Dragon Maid',
}

// All available character types
export type AnimeCharacterType =
    | 'naruto'
    | 'goku'
    | 'luffy'
    | 'sailor-moon'
    | 'levi'
    | 'totoro'
    | 'tanjiro'
    | 'gojo'
    | 'deku'
    | 'tohru'
    | 'eren'
    ;

export interface CharacterConfig {
    id: number;
    name: string;
    series: AnimeSeries;
    spriteWidth: number;
    spriteHeight: number;
    /** Number of frames in the walk animation */
    walkFrames: number;
    /** Number of frames in the idle animation */
    idleFrames: number;
    /** Speed multiplier for this character */
    speed: number;
}

export interface WebviewMessage {
    command: string;
    text: string;
    type?: string;
    color?: string;
    name?: string;
    size?: string;
}
