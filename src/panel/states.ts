/**
 * State machine for anime character behaviors.
 * Each state defines what the character does and when to transition.
 */

export enum CharacterState {
    idle = 'idle',
    walking = 'walking',
    running = 'running',
    sitting = 'sitting',
}

export interface StateResult {
    newState: CharacterState;
    /** Horizontal velocity (-1 = left, 0 = still, 1 = right) */
    directionX: number;
    /** Speed multiplier for this state */
    speedMultiplier: number;
    /** Which animation to play */
    animation: 'idle' | 'walk' | 'run' | 'sit';
}

/**
 * Resolve what to do in the current state. 
 * Returns the result plus a random duration before re-evaluation.
 */
export function resolveState(current: CharacterState): { result: StateResult; durationMs: number } {
    switch (current) {
        case CharacterState.idle:
            return {
                result: {
                    newState: CharacterState.idle,
                    directionX: 0,
                    speedMultiplier: 0,
                    animation: 'idle',
                },
                durationMs: 2000 + Math.random() * 4000, // Idle for 2-6 seconds
            };

        case CharacterState.walking:
            return {
                result: {
                    newState: CharacterState.walking,
                    directionX: Math.random() > 0.5 ? 1 : -1,
                    speedMultiplier: 0.5,
                    animation: 'walk',
                },
                durationMs: 3000 + Math.random() * 5000, // Walk for 3-8 seconds
            };

        case CharacterState.running:
            return {
                result: {
                    newState: CharacterState.running,
                    directionX: Math.random() > 0.5 ? 1 : -1,
                    speedMultiplier: 1.0,
                    animation: 'run',
                },
                durationMs: 1500 + Math.random() * 3000, // Run for 1.5-4.5 seconds
            };

        case CharacterState.sitting:
            return {
                result: {
                    newState: CharacterState.sitting,
                    directionX: 0,
                    speedMultiplier: 0,
                    animation: 'sit',
                },
                durationMs: 4000 + Math.random() * 6000, // Sit for 4-10 seconds
            };
    }
}

/**
 * Pick a random next state based on weighted probabilities.
 */
export function pickNextState(current: CharacterState): CharacterState {
    const rand = Math.random();
    
    switch (current) {
        case CharacterState.idle:
            // From idle: 40% walk, 20% run, 20% sit, 20% stay idle
            if (rand < 0.4) { return CharacterState.walking; }
            if (rand < 0.6) { return CharacterState.running; }
            if (rand < 0.8) { return CharacterState.sitting; }
            return CharacterState.idle;

        case CharacterState.walking:
            // From walking: 30% idle, 30% run, 10% sit, 30% keep walking
            if (rand < 0.3) { return CharacterState.idle; }
            if (rand < 0.6) { return CharacterState.running; }
            if (rand < 0.7) { return CharacterState.sitting; }
            return CharacterState.walking;

        case CharacterState.running:
            // From running: 30% idle, 40% walk, 10% sit, 20% keep running
            if (rand < 0.3) { return CharacterState.idle; }
            if (rand < 0.7) { return CharacterState.walking; }
            if (rand < 0.8) { return CharacterState.sitting; }
            return CharacterState.running;

        case CharacterState.sitting:
            // From sitting: 50% idle, 30% walk, 10% run, 10% keep sitting
            if (rand < 0.5) { return CharacterState.idle; }
            if (rand < 0.8) { return CharacterState.walking; }
            if (rand < 0.9) { return CharacterState.running; }
            return CharacterState.sitting;
    }
}
