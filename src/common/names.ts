/**
 * Anime-themed random name generator for characters.
 */

const ANIME_NAMES: string[] = [
    // Japanese names
    'Akira', 'Hana', 'Kai', 'Yuki', 'Ren',
    'Sakura', 'Haru', 'Sora', 'Mika', 'Riku',
    'Aoi', 'Mei', 'Kyo', 'Nao', 'Taro',
    'Yui', 'Shin', 'Ami', 'Ryo', 'Jun',
    // Fun anime-style suffixes
    'Neko-chan', 'Kuma-san', 'Chibi', 'Senpai', 'Sensei',
    'Kawaii', 'Sugoi', 'Baka', 'Dattebayo', 'Yare Yare',
    // Compound fun names
    'Captain Ramen', 'Shadow Ninja', 'Thunder Fist', 'Star Warrior',
    'Moon Guardian', 'Dragon Rider', 'Spirit Fox', 'Wind Walker',
    'Flame Sage', 'Ice Blade', 'Storm King', 'Pixel Samurai',
    'Code Ninja', 'Debug Ronin', 'Syntax Shogun', 'Compile Sensei',
];

/**
 * Returns a random anime-themed name.
 */
export function randomName(): string {
    return ANIME_NAMES[Math.floor(Math.random() * ANIME_NAMES.length)];
}
