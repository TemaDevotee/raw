/**
 * @typedef {{ prompt: number, completion: number }} ProviderUsage
 *
 * @typedef {Object} GenerateOpts
 * @property {Object} chat - chat snapshot containing messages
 * @property {string} systemPrompt
 * @property {number} temperature
 * @property {number} maxTokens
 * @property {(delta:string)=>void} [onToken]
 * @property {AbortSignal} [abort]
 *
 * @typedef {Object} AgentProvider
 * @property {string} name
 * @property {boolean} supportsStreaming
 * @property {(opts:GenerateOpts)=>Promise<{text:string, usage:ProviderUsage}>} generate
 */
