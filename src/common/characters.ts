import { AnimeCharacterType, AnimeSeries, CharacterConfig } from './types';

/**
 * Master registry of all anime characters.
 * Each character has metadata, sprite info, and animation configuration.
 */
export const CHARACTER_DATA: Record<AnimeCharacterType, CharacterConfig> = {
    'naruto': {
        id: 1,
        name: 'Naruto Uzumaki',
        series: AnimeSeries.naruto,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 1.2,
    },
    'goku': {
        id: 2,
        name: 'Son Goku',
        series: AnimeSeries.dragonball,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 1.5,
    },
    'luffy': {
        id: 3,
        name: 'Monkey D. Luffy',
        series: AnimeSeries.onepiece,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 1.3,
    },
    'sailor-moon': {
        id: 4,
        name: 'Sailor Moon',
        series: AnimeSeries.sailormoon,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 1.0,
    },
    'levi': {
        id: 5,
        name: 'Levi Ackerman',
        series: AnimeSeries.attackontitan,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 1.8,
    },
    'totoro': {
        id: 6,
        name: 'Totoro',
        series: AnimeSeries.ghibli,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 0.6,
    },
    'tanjiro': {
        id: 7,
        name: 'Tanjiro Kamado',
        series: AnimeSeries.demonslayer,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 1.4,
    },
    'gojo': {
        id: 8,
        name: 'Gojo Satoru',
        series: AnimeSeries.jujutsukaisen,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 1.6,
    },
    'deku': {
        id: 9,
        name: 'Izuku Midoriya',
        series: AnimeSeries.myheroacademia,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 1.3,
    },
    'tohru': {
        id: 10,
        name: 'Tohru',
        series: AnimeSeries.dragonmaid,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 0.9,
    },
    'eren' : {
        id: 11,
        name: 'Eren Yeager',
        series: AnimeSeries.attackontitan,
        spriteWidth: 32,
        spriteHeight: 32,
        walkFrames: 4,
        idleFrames: 2,
        speed: 1.4,
    }
};

/**
 * Get all characters from a specific anime series.
 */
export function getCharactersBySeries(series: AnimeSeries): AnimeCharacterType[] {
    return (Object.entries(CHARACTER_DATA) as [AnimeCharacterType, CharacterConfig][])
        .filter(([, config]) => config.series === series)
        .map(([type]) => type);
}

/**
 * Get all unique anime series that have characters.
 */
export function getAvailableSeries(): AnimeSeries[] {
    const seriesSet = new Set<AnimeSeries>();
    for (const config of Object.values(CHARACTER_DATA)) {
        seriesSet.add(config.series);
    }
    return Array.from(seriesSet);
}

/**
 * Get a random character config.
 */
export function getRandomCharacter(): [AnimeCharacterType, CharacterConfig] {
    const keys = Object.keys(CHARACTER_DATA) as AnimeCharacterType[];
    const randomKey = keys[Math.floor(Math.random() * keys.length)];
    return [randomKey, CHARACTER_DATA[randomKey]];
}

/**
 * Get the default character (Naruto).
 */
export function getDefaultCharacter(): AnimeCharacterType {
    return 'naruto';
}
