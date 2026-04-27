/**
 * Character factory — creates characters and provides the character picker data.
 */

import { AnimeCharacterType } from '../common/types';
import { CHARACTER_DATA } from '../common/characters';

export interface CharacterDisplayInfo {
    type: AnimeCharacterType;
    displayName: string;
    series: string;
}

/**
 * Get display info for all available characters.
 */
export function getAllCharacterDisplayInfo(): CharacterDisplayInfo[] {
    return (Object.entries(CHARACTER_DATA) as [AnimeCharacterType, typeof CHARACTER_DATA[AnimeCharacterType]][])
        .map(([type, config]) => ({
            type,
            displayName: config.name,
            series: config.series,
        }));
}

/**
 * Get display info for a specific character.
 */
export function getCharacterDisplayInfo(type: AnimeCharacterType): CharacterDisplayInfo | undefined {
    const config = CHARACTER_DATA[type];
    if (!config) { return undefined; }
    return {
        type,
        displayName: config.name,
        series: config.series,
    };
}
