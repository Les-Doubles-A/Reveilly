/* Registre des modules de questions. Ajouter un module = l'importer ici. */
import math from './math.js';
import figures from './figures.js';
import custom from './custom.js';

export const MODULES = [math, figures, custom];
export const moduleById = id => MODULES.find(m => m.id === id);
