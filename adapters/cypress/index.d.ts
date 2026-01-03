/// <reference types="cypress" />

/**
 * Registers the DeFlake plugin task in Cypress.
 * 
 * @example
 * // In cypress.config.ts
 * setupNodeEvents(on, config) {
 *   require('deflake/cypress')(on, config);
 *   return config;
 * }
 */
declare function deflakePlugin(on: Cypress.PluginEvents, config: Cypress.PluginConfigOptions): void;

export = deflakePlugin;
