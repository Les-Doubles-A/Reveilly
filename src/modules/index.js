/* Registre des modules de questions. Ajouter un module = l'importer ici. */
import math from './math.js';
import figures from './figures.js';

export const MODULES = [math, figures];
export const moduleById = id => MODULES.find(m => m.id === id);
