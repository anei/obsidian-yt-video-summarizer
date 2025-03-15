import { ProviderConfig, StoredModel, StoredProvider } from './types';
import { GEMINI_MODELS } from './constants';

export const DEFAULT_PROVIDERS: StoredProvider[] = [
    {
        name: 'Gemini',
        type: 'gemini',
        apiKey: '',
        verified: false,
        models: GEMINI_MODELS.map(id => ({
            id,
            name: id
        }))
    },
    {
        name: 'OpenAI',
        type: 'openai',
        apiKey: '',
        verified: false,
        models: [{
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo'
        }, {
            id: 'gpt-4',
            name: 'GPT-4'
        }, {
            id: 'gpt-4-turbo',
            name: 'GPT-4 Turbo'
        }]
    },
    {
        name: 'Anthropic',
        type: 'anthropic',
        apiKey: '',
        verified: false,
        models: [{
            id: 'claude-3-opus',
            name: 'Claude 3 Opus'
        }, {
            id: 'claude-3-sonnet',
            name: 'Claude 3 Sonnet'
        }, {
            id: 'claude-3-haiku',
            name: 'Claude 3 Haiku'
        }]
    }
];

export interface StoredSettings {
    providers: StoredProvider[];
    selectedModelId: string | null;
    customPrompt: string;
    maxTokens: number;
    temperature: number;
} 