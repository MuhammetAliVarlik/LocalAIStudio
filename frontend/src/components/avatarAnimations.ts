/**
 * Avatar Animation Registry
 * Defines mathematical patterns for particle movement based on state.
 */

// Define the signature for an animation function
export type AnimationResult = {
    x: number;
    y: number;
    z: number;
    color?: string; // Optional override color
};

type AnimationFn = (
    i: number,          // Particle Index
    count: number,      // Total Particle Count
    time: number,       // Global Time
    audioFactor: number // Audio Reactivity (0.0 - 1.0)
) => AnimationResult;

// --- 1. IDLE (Breathing Sphere) ---
export const animateIdle: AnimationFn = (i, count, time) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    
    // Gentle breathing (Sinus wave)
    const r = 1.5 + Math.sin(time + i * 0.1) * 0.1;
    
    return {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
    };
};

// --- 2. LISTENING (Focused Spin) ---
export const animateListening: AnimationFn = (i, count, time) => {
    // Base Sphere
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    
    let x = 1.2 * Math.sin(phi) * Math.cos(theta);
    let y = 1.2 * Math.sin(phi) * Math.sin(theta);
    let z = 1.2 * Math.cos(phi);

    // Fast Spin on Y axis
    const spin = time * 3;
    const tx = x * Math.cos(spin) - z * Math.sin(spin);
    const tz = x * Math.sin(spin) + z * Math.cos(spin);

    return { x: tx, y: y, z: tz, color: '#ef4444' }; // Red/Orange tint
};

// --- 3. SPEAKING (Explosive Audio Reactivity) ---
export const animateSpeaking: AnimationFn = (i, count, time, audioFactor) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    
    // Radius expands aggressively with audio
    const r = 1.5 + (audioFactor * 2.0); 
    
    // Add some noise/jitter based on audio
    const noise = (Math.random() - 0.5) * audioFactor * 0.5;

    return {
        x: (r + noise) * Math.sin(phi) * Math.cos(theta),
        y: (r + noise) * Math.sin(phi) * Math.sin(theta),
        z: (r + noise) * Math.cos(phi),
        color: '#ffffff' // Flash white
    };
};

// --- 4. THINKING (Pulsing Brain) ---
export const animateThinking: AnimationFn = (i, count, time) => {
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    
    // Deep slow pulse
    const pulse = Math.sin(time * 3) * 0.2 + 1;
    
    // Neural activity noise
    const noise = Math.sin(time * 5 + i) * 0.15;

    let x = 1.5 * Math.sin(phi) * Math.cos(theta);
    let y = 1.5 * Math.sin(phi) * Math.sin(theta);
    let z = 1.5 * Math.cos(phi);

    return {
        x: (x * pulse) + noise,
        y: (y * pulse) + noise,
        z: (z * pulse) + noise,
        color: '#fbbf24' // Amber
    };
};

// --- 5. SLEEPING (Floor Scatter) ---
export const animateSleeping: AnimationFn = (i, count, time) => {
    // Particles lay flat on the "floor" (Y axis) and drift slowly
    const angle = i * 0.1 + time * 0.1;
    const radius = 2 + Math.random(); // Wide spread
    
    return {
        x: Math.cos(angle) * radius,
        y: -1.5 + Math.sin(time + i) * 0.1, // Near bottom, gentle wave
        z: Math.sin(angle) * radius,
        color: '#4b5563' // Dark Grey (Sleep mode)
    };
};

// --- 6. COMPUTING (Digital Grid/Matrix) ---
export const animateComputing: AnimationFn = (i, count, time) => {
    // Quantize positions to create a grid-like effect
    const rawX = (Math.sin(i) * 2.5);
    const rawY = (Math.cos(i * 0.5 + time) * 2.5);
    const rawZ = (Math.sin(i * 1.5) * 2.5);

    // Snap to grid (0.5 steps)
    const snap = (val: number) => Math.round(val * 2) / 2;

    return {
        x: snap(rawX),
        y: snap(rawY),
        z: snap(rawZ),
        color: '#10b981' // Matrix Green
    };
};

// --- REGISTRY MAPPING ---
import { AvatarState } from '../types';

export const ANIMATION_REGISTRY: Record<AvatarState, AnimationFn> = {
    [AvatarState.IDLE]: animateIdle,
    [AvatarState.LISTENING]: animateListening,
    [AvatarState.SPEAKING]: animateSpeaking,
    [AvatarState.THINKING]: animateThinking,
    [AvatarState.SLEEPING]: animateSleeping,
    [AvatarState.COMPUTING]: animateComputing,
    [AvatarState.EXCITED]: animateSpeaking // Fallback or duplicate
};