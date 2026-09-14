// Entry point: bootstrap Three.js game and hide loader.
import { Game } from './core/Game.js';

const app = document.getElementById('app');
const ui = document.getElementById('ui');
const debugEl = document.getElementById('debugPanel');
const toastEl = document.getElementById('toast');
const loader = document.getElementById('loader');

function boot() {
  try {
    const game = new Game(app, ui, debugEl, toastEl);
    window.__game = game; // expose for debugging
    game.start();
    loader.classList.add('hidden');
  } catch (e) {
    console.error('Failed to boot game', e);
    loader.textContent = 'Failed to load: ' + (e?.message || e);
    loader.style.color = '#ff5050';
  }
}

boot();
