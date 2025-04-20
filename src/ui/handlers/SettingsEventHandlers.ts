import { Notice } from 'obsidian';
import { ModelConfig, ProviderConfig } from '../../types';
import { YouTubeSummarizerPlugin } from '../../main';

export interface UICallbacks {
    onModelAdded?: (model: ModelConfig) => void;
    onModelDeleted?: (model: ModelConfig) => void;
    onModelUpdated?: (model: ModelConfig) => void;
    onProviderAdded?: (provider: ProviderConfig) => void;
    onActiveModelChanged?: () => void;
}

export class SettingsEventHandlers {
    constructor(
        private plugin: YouTubeSummarizerPlugin,
        private callbacks: UICallbacks = {}
    ) { }

    async handleApiKeyTest(provider: ProviderConfig): Promise<void> {
        try {
            await this.plugin.settings.saveProviderKey(provider.name, provider.apiKey);
            new Notice(`${provider.name} API key saved successfully`);
        } catch (error) {
            new Notice(`Failed to validate ${provider.name} API key: ${error.message}`);
        }
    }

    async handleModelSelection(value: string, availableModels: ModelConfig[]): Promise<void> {
        try {
            const selectedModel = availableModels.find(m => m.name === value);
            if (selectedModel) {
                await this.plugin.settings.setSelectedModel(selectedModel.name);
                this.callbacks.onActiveModelChanged?.();
            }
        } catch (error) {
            console.error('Failed to set active model:', error, 'Selected model:', value);
            new Notice(`Failed to set active model: ${error.message}`);
        }
    }

    handleAccordionToggle(accordion: HTMLElement): void {
        const content = accordion.querySelector('.yt-summarizer-settings__provider-content') as HTMLElement;
        const icon = accordion.querySelector('.yt-summarizer-settings__collapse-icon') as HTMLElement;

        if (!content || !icon) return;

        const isExpanded = content.style.display !== 'none';

        // Toggle icon class
        if (isExpanded) {
            icon.removeClass('is-expanded');
        } else {
            icon.addClass('is-expanded');
        }

        // Toggle content
        content.style.display = isExpanded ? 'none' : 'block';

        // Update all other accordions
        const allAccordions = document.querySelectorAll('.yt-summarizer-settings__provider-accordion');
        allAccordions.forEach(otherAccordion => {
            if (otherAccordion !== accordion) {
                const otherContent = otherAccordion.querySelector('.yt-summarizer-settings__provider-content') as HTMLElement;
                const otherIcon = otherAccordion.querySelector('.yt-summarizer-settings__collapse-icon') as HTMLElement;
                if (otherContent) {
                    otherContent.style.display = 'none';
                }
                if (otherIcon) {
                    otherIcon.removeClass('is-expanded');
                }
            }
        });
    }

    async handleProviderAdd(provider: ProviderConfig): Promise<void> {
        try {
            this.plugin.settings.addProvider(provider);
            await this.handleApiKeyTest(provider);
            this.callbacks.onProviderAdded?.(provider);
        } catch (error) {
            new Notice(`Failed to add provider: ${error.message}`);
            throw error;
        }
    }

    async handleModelAdd(model: ModelConfig): Promise<void> {
        try {
            this.plugin.settings.addModel(model);
            this.callbacks.onModelAdded?.(model);
        } catch (error) {
            new Notice(`Failed to add model: ${error.message}`);
            throw error;
        }
    }

    async handleModelEdit(model: ModelConfig): Promise<void> {
        try {
            this.plugin.settings.updateModel(
                model.name,
                model.displayName || model.name,
                model.provider.name
            );
            this.callbacks.onModelUpdated?.(model);
        } catch (error) {
            new Notice(`Failed to update model: ${error.message}`);
            throw error;
        }
    }

    async handleModelDelete(model: ModelConfig): Promise<void> {
        try {
            this.plugin.settings.deleteModel(model.provider.name, model.name);
            this.callbacks.onModelDeleted?.(model);
        } catch (error) {
            console.error('Error deleting model:', error);
            new Notice(`Failed to delete model: ${error.message}`);
            throw error;
        }
    }
} 