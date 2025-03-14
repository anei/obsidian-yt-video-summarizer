type ProviderType = "openai" | "anthropic" | "gemini";

/** Configuration for an AI provider */
export interface ProviderConfig {
    name: string; // unique
    type: ProviderType;
    apiKey: string;
    builtIn: boolean;
    url?: string;
    verified: boolean;
    models?: ModelConfig[]; // Added models property
}

/** Configuration for an AI model */
export interface ModelConfig {
    id: string; // unique
    name: string;
    provider: ProviderConfig;
    builtIn: boolean;
}

/** Represents the plugin settings and provides methods to manage them */
export interface PluginSettings {
    /** Gets the currently selected model */
    getSelectedModel(): ModelConfig | null;
    
    /** Gets all available providers */
    getProviders(): ProviderConfig[];
    
    /** Gets all available models across all providers */
    getModels(): ModelConfig[];
    
    /** Gets the custom prompt template */
    getCustomPrompt(): string;
    
    /** Gets the maximum number of tokens for API requests */
    getMaxTokens(): number;
    
    /** Gets the temperature setting for API requests */
    getTemperature(): number;

    /** Adds a new provider */
    addProvider(provider: ProviderConfig): void;
    
    /** Adds a new model to a provider */
    addModel(model: ModelConfig): void;
    
    /** Updates an existing provider */
    updateProvider(provider: ProviderConfig): void;
    
    /** Updates an existing model */
    updateModel(model: ModelConfig): void;
    
    /** Deletes a provider if it has no associated models */
    deleteProvider(provider: ProviderConfig): void;
    
    /** Deletes a model */
    deleteModel(model: ModelConfig): void;

    /** Updates the custom prompt template */
    updateCustomPrompt(prompt: string): void;
    
    /** Updates the maximum number of tokens */
    updateMaxTokens(tokens: number): void;
    
    /** Updates the temperature setting */
    updateTemperature(temperature: number): void;

    /** Saves the API key for a provider without validation */
    saveProviderKey(providerName: string, key: string): void;
}

/** Represents a single line of video transcript with timing information */
export interface TranscriptLine {
	text: string;
	duration: number;
	offset: number;
}

/** Response structure for video transcript and metadata */
export interface TranscriptResponse {
	url: string;
	videoId: string;
	title: string;
	author: string;
	channelUrl: string;
	lines: TranscriptLine[];
}

/** Available thumbnail quality options with dimensions */
export interface ThumbnailQuality {
	default: string; // 120x90
	medium: string; // 320x180
	high: string; // 480x360
	standard: string; // 640x480
	maxres: string; // 1280x720
}

export interface AIModelProvider {
    testConnection(): Promise<boolean>;
    summarizeVideo(videoId: string, prompt: string): Promise<string>;
}
