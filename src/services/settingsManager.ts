import YouTubeSummarizerPlugin from "src/main";
import { Notice } from "obsidian";
import { ModelConfig, PluginSettings, ProviderConfig, StoredModel, StoredProvider, StoredSettings } from "src/types";
import { DEFAULT_PROVIDERS } from "src/defaults";
import { DEFAULT_PROMPT } from "src/constants";

/** Manages plugin settings and provides methods to interact with them */
export class SettingsManager implements PluginSettings {
    private plugin: YouTubeSummarizerPlugin;
    private settings: StoredSettings;

    /** Creates a new instance of SettingsManager */
    public constructor(plugin: YouTubeSummarizerPlugin) {
        this.plugin = plugin;
        this.settings = {
            providers: [...DEFAULT_PROVIDERS],
            selectedModelId: 'gemini-1.5-pro',
            customPrompt: DEFAULT_PROMPT,
            maxTokens: 3000,
            temperature: 1
        };
        this.loadSettings();
    }

    /** Gets the currently selected model */
    getSelectedModel(): ModelConfig | null {
        if (!this.settings.selectedModelId) return null;

        const found = this.findModelAndProvider(this.settings.selectedModelId);
        if (!found) return null;

        return this.convertToModelConfig(found.model, found.provider);
    }

    /** Gets all available providers */
    getProviders(): ProviderConfig[] {
        return this.settings.providers.map(provider => ({
            name: provider.name,
            type: provider.type,
            apiKey: provider.apiKey,
            url: provider.url,
            verified: provider.verified,
            models: provider.models.map(model => this.convertToModelConfig(model, provider))
        }));
    }

    /** Gets all available models across all providers */
    getModels(): ModelConfig[] {
        return this.settings.providers.flatMap(provider =>
            provider.models.map(model => this.convertToModelConfig(model, provider))
        );
    }

    /** Gets the custom prompt template */
    getCustomPrompt(): string {
        return this.settings.customPrompt;
    }

    /** Gets the maximum number of tokens for API requests */
    getMaxTokens(): number {
        return this.settings.maxTokens;
    }

    /** Gets the temperature setting for API requests */
    getTemperature(): number {
        return this.settings.temperature;
    }

    /** Adds a new provider */
    addProvider(provider: ProviderConfig): void {
        const storedProvider: StoredProvider = {
            ...provider,
            models: []
        };

        if (!this.validateProvider(storedProvider)) {
            throw new Error('Invalid provider configuration');
        }

        this.settings.providers.push(storedProvider);
        this.saveData();
    }

    /** Adds a new model to a provider */
    addModel(model: ModelConfig): void {
        const provider = this.settings.providers.find(p => p.name === model.provider.name);
        if (!provider) {
            throw new Error('Provider not found');
        }

        const storedModel: StoredModel = {
            id: model.name,
            name: model.displayName || model.name
        };

        if (!this.validateModel(storedModel, provider)) {
            throw new Error('Invalid model configuration');
        }

        provider.models.push(storedModel);
        this.saveData();
    }

    /** Updates an existing provider */
    updateProvider(provider: ProviderConfig): void {
        const storedProvider = this.settings.providers.find(p => p.name === provider.name);
        if (!storedProvider) {
            throw new Error('Provider not found');
        }

        const updatedProvider: StoredProvider = {
            ...provider,
            models: storedProvider.models
        };

        if (!this.validateProvider(updatedProvider)) {
            throw new Error('Invalid provider configuration');
        }

        const index = this.settings.providers.indexOf(storedProvider);
        this.settings.providers[index] = updatedProvider;
        this.saveData();
    }

    /** Updates an existing model */
    updateModel(model: ModelConfig): void {
        const provider = this.settings.providers.find(p => p.name === model.provider.name);
        if (!provider) {
            throw new Error('Provider not found');
        }

        // Проверяем, существует ли модель в провайдере
        const index = provider.models.findIndex(m => m.id === model.name);

        // Если модель не найдена, это просто выбор активной модели
        if (index === -1) {
            this.settings.selectedModelId = model.name;
            this.saveData();
            return;
        }

        // Если модель найдена, обновляем её
        const storedModel: StoredModel = {
            id: model.name,
            name: model.displayName || model.name
        };

        if (!this.validateModel(storedModel, provider)) {
            throw new Error('Invalid model configuration');
        }

        provider.models[index] = storedModel;
        this.saveData();
    }

    /** Deletes a provider if it has no associated models */
    deleteProvider(provider: ProviderConfig): void {
        const storedProvider = this.settings.providers.find(p => p.name === provider.name);
        if (!storedProvider) {
            throw new Error('Provider not found');
        }

        if (storedProvider.models.length > 0) {
            throw new Error('Cannot delete provider with associated models');
        }

        const index = this.settings.providers.indexOf(storedProvider);
        this.settings.providers.splice(index, 1);
        this.saveData();
    }

    /** Deletes a model */
    deleteModel(model: ModelConfig): void {
        console.log('Deleting model:', model);

        if (!model.provider) {
            console.error('Provider is undefined in model:', model);
            throw new Error('Provider is undefined in model');
        }

        // Найдем провайдера по имени
        const providerName = model.provider.name;
        const provider = this.settings.providers.find(p => p.name === providerName);
        console.log('Found provider:', provider);

        if (!provider) {
            throw new Error(`Provider not found: ${providerName}`);
        }

        // Найдем модель по имени (которое раньше было id)
        const modelName = model.name;
        const index = provider.models.findIndex(m => m.id === modelName);
        console.log('Model index:', index, 'Looking for id:', modelName);
        console.log('Available models:', provider.models);

        if (index === -1) {
            throw new Error(`Model not found: ${modelName}`);
        }

        // Если это была активная модель, сбросим выбор
        if (this.settings.selectedModelId === modelName) {
            this.settings.selectedModelId = null;
        }

        // Удалим модель из списка
        provider.models.splice(index, 1);
        this.saveData();
    }

    /** Updates the custom prompt template */
    updateCustomPrompt(prompt: string): void {
        this.settings.customPrompt = prompt;
        this.saveData();
    }

    /** Updates the maximum number of tokens */
    updateMaxTokens(tokens: number): void {
        this.settings.maxTokens = tokens;
        this.saveData();
    }

    /** Updates the temperature setting */
    updateTemperature(temperature: number): void {
        this.settings.temperature = temperature;
        this.saveData();
    }

    /** Saves the API key for a provider without validation */
    saveProviderKey(providerName: string, key: string): void {
        const provider = this.settings.providers.find(p => p.name === providerName);
        if (!provider) {
            throw new Error('Provider not found');
        }

        provider.apiKey = key;
        provider.verified = false;
        this.saveData();
    }

    /** Sets the selected model by ID */
    setSelectedModel(modelName: string): void {
        this.settings.selectedModelId = modelName;
        this.saveData();
    }

    private async loadSettings(): Promise<void> {
        const loaded = await this.plugin.loadData();

        if (!loaded?.settings) return;

        // Check if settings are in old format (has geminiApiKey)
        if ('geminiApiKey' in loaded.settings) {
            // Convert old format to new format
            const oldSettings = loaded.settings as {
                geminiApiKey: string;
                selectedModel: string;
                customPrompt: string;
                maxTokens: number;
                temperature: number;
            };

            // Create new format settings
            const providers = [...DEFAULT_PROVIDERS];
            // Update Gemini provider with the old API key
            const geminiProvider = providers.find(p => p.name === 'Gemini');
            if (geminiProvider) {
                geminiProvider.apiKey = oldSettings.geminiApiKey;
                geminiProvider.verified = false;
            }

            this.settings = {
                providers,
                selectedModelId: oldSettings.selectedModel,
                customPrompt: oldSettings.customPrompt,
                maxTokens: oldSettings.maxTokens,
                temperature: oldSettings.temperature
            };

            // Save in new format
            await this.saveData();
        } else {
            // Settings are in new format, merge with defaults
            this.settings = {
                providers: loaded.settings.providers ?? this.settings.providers,
                selectedModelId: loaded.settings.selectedModelId ?? this.settings.selectedModelId,
                customPrompt: loaded.settings.customPrompt ?? this.settings.customPrompt,
                maxTokens: loaded.settings.maxTokens ?? this.settings.maxTokens,
                temperature: loaded.settings.temperature ?? this.settings.temperature
            };
        }
    }

    private async saveData(): Promise<void> {
        try {
            await this.plugin.saveData({
                settings: this.settings
            });
        } catch (error) {
            new Notice('Failed to save settings');
            console.error('Failed to save settings:', error);
        }
    }

    private validateProvider(provider: StoredProvider): boolean {
        if (!provider.name || !provider.type) {
            return false;
        }

        // Check name uniqueness
        const existingProvider = this.settings.providers.find(p => p.name === provider.name);
        if (existingProvider && existingProvider !== provider) {
            return false;
        }

        return true;
    }

    private validateModel(model: StoredModel, provider: StoredProvider): boolean {
        // Check that the model has an id and name
        if (!model.id || !model.name) {
            console.error('Model validation failed: missing id or name', model);
            return false;
        }

        // Check that the model has a unique id within the provider
        const existingModel = provider.models.find(m => m.id === model.id);
        if (existingModel && existingModel !== model) {
            console.error('Model validation failed: id not unique within provider', model, existingModel);
            return false;
        }

        return true;
    }

    private findModelAndProvider(modelId: string): { model: StoredModel, provider: StoredProvider } | null {
        if (!modelId) {
            return null;
        }

        for (const provider of this.settings.providers) {
            const model = provider.models.find(m => m?.id === modelId);
            if (model) {
                return { model, provider };
            }
        }
        return null;
    }

    private convertToModelConfig(model: StoredModel, provider: StoredProvider): ModelConfig {
        return {
            name: model.id,
            displayName: model.name,
            provider: {
                name: provider.name,
                type: provider.type,
                apiKey: provider.apiKey,
                url: provider.url,
                verified: provider.verified
            }
        };
    }
}