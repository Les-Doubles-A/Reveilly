/* Choisit l'implémentation : plugin natif sous Capacitor, sinon aperçu Web. */
import { Capacitor } from '@capacitor/core';
import { createNativePlatform } from './native.js';
import { createWebPlatform } from './web.js';

export const createPlatform = () => Capacitor.isNativePlatform() ? createNativePlatform() : createWebPlatform();
