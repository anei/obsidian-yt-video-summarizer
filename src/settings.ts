import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { ModelConfig, PluginSettings, ProviderConfig } from './types';
import { YouTubeSummarizerPlugin } from './main';

/**
 * Represents the settings tab for the YouTube Summarizer Plugin.
 * This class extends the PluginSettingTab and provides a user interface
 * for configuring the plugin's settings.
 */
export class SettingsTab extends PluginSettingTab {
    private activeModelDropdown: HTMLSelectElement | null = null;
    private currentTab: string = 'ai-providers';
    private settings: PluginSettings;

    constructor(app: App, private plugin: YouTubeSummarizerPlugin) {
        super(app, plugin);
        this.settings = plugin.settings;
    }

    getAvailableModels(): ModelConfig[] {
        return this.settings.getModels();
    }

    async testApiKey(provider: ProviderConfig): Promise<void> {
        try {
            // Test the API key by attempting to use it
            await this.plugin.settings.saveProviderKey(provider.name, provider.apiKey);
            new Notice(`${provider.name} API key saved successfully`);
        } catch (error) {
            new Notice(`Failed to validate ${provider.name} API key: ${error.message}`);
        }
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        const tabs = containerEl.createEl('div', { cls: 'settings-tab-group' });
        const tabList = tabs.createEl('nav', { cls: 'settings-tab-list' });
        const tabContent = tabs.createEl('div', { cls: 'settings-tab-content' });

        // Add styles
        tabs.style.display = 'flex';
        tabs.style.flexDirection = 'column';
        tabs.style.gap = '16px';

        tabList.style.display = 'flex';
        tabList.style.gap = '8px';
        tabList.style.borderBottom = '2px solid var(--background-modifier-border)';
        tabList.style.marginBottom = '16px';

        const aiProvidersContent = tabContent.createDiv({ cls: 'content' });
        const summarySettingsContent = tabContent.createDiv({ cls: 'content' });

        // Hide inactive tab content
        aiProvidersContent.style.display = this.currentTab === 'ai-providers' ? 'block' : 'none';
        summarySettingsContent.style.display = this.currentTab === 'summary-settings' ? 'block' : 'none';

        // Create tab buttons
        this.createTab(tabList, 'AI Providers', 'ai-providers');
        this.createTab(tabList, 'Summary Settings', 'summary-settings');

        // AI Providers Section
        this.displayAIProvidersSection(aiProvidersContent);

        // Summary Settings Section
        this.displaySummarySettingsSection(summarySettingsContent);
    }

    private createTab(tabList: HTMLElement, name: string, id: string): HTMLElement {
        const tab = tabList.createEl('div', {
            cls: 'settings-tab',
            text: name
        });

        // Add styles
        tab.style.padding = '8px 16px';
        tab.style.cursor = 'pointer';
        tab.style.borderBottom = '2px solid transparent';
        tab.style.marginBottom = '-2px';

        if (this.currentTab === id) {
            tab.style.borderColor = 'var(--interactive-accent)';
            tab.style.color = 'var(--interactive-accent)';
        }

        tab.addEventListener('click', () => {
            // Update current tab
            this.currentTab = id;

            // Update all tabs and content
            this.display();
        });

        return tab;
    }

    private displayAIProvidersSection(containerEl: HTMLElement): void {
        // Active Model Selection
        const availableModels = this.getAvailableModels();
        const selectedModel = this.settings.getSelectedModel();
    
        new Setting(containerEl)
            .setName('Active Model')
            .setDesc('Select which model to use for generating summaries')
            .addDropdown(dropdown => {
                const options: Record<string, string> = {};
                availableModels.forEach(model => {
                    options[model.id] = model.name;
                });
    
                dropdown
                    .addOptions(options)
                    .setValue(selectedModel?.id || '')
                    .onChange(async (value) => {
                        const selectedModel = availableModels.find(m => m.id === value);
                        if (selectedModel) {
                            await this.settings.updateModel(selectedModel);
                        }
                    });
    
                // Store reference to the dropdown element
                this.activeModelDropdown = dropdown.selectEl;
            });
    
        // Provider Accordions Container
        const accordionsContainer = containerEl.createDiv();
        accordionsContainer.style.display = 'flex';
        accordionsContainer.style.flexDirection = 'column';
        accordionsContainer.style.gap = '20px';
        accordionsContainer.style.marginTop = '20px';
    
        // Create provider accordions
        this.settings.getProviders().forEach(provider => {
            this.createProviderAccordion(accordionsContainer, provider);
        });
    
        // Add Provider Button
        new Setting(containerEl)
            .addButton(button =>
                button
                    .setButtonText('Add Provider')
                    .setCta()
                    .onClick(() => this.addProvider())
            );
    }
    
    private createProviderAccordion(container: HTMLElement, provider: ProviderConfig): void {
        const accordion = container.createDiv({ cls: 'provider-accordion' });
        accordion.style.border = '1px solid var(--background-modifier-border)';
        accordion.style.borderRadius = '8px';
        accordion.style.padding = '16px';
        accordion.style.backgroundColor = 'var(--background-secondary)';
        accordion.style.position = 'relative';
    
        // Provider Title
        const titleEl = accordion.createEl('h3', { text: provider.name });
        titleEl.style.margin = '0 0 8px 0';
        titleEl.style.cursor = 'pointer';
        titleEl.addEventListener('click', () => this.toggleAccordion(accordion));
    
        // Provider Description
        const descEl = accordion.createEl('p', { text: this.getProviderDescription(provider.type) });
        descEl.style.margin = '0 0 16px 0';
        descEl.style.color = 'var(--text-muted)';
    
        // Models List Container
        const modelsContainer = accordion.createDiv({ cls: 'models-list' });
        modelsContainer.style.display = 'none';
        modelsContainer.style.maxHeight = '200px';
        modelsContainer.style.overflowY = 'auto';
        modelsContainer.style.marginTop = '16px';
    
        // Create models list
        provider.models?.forEach(model => {
            this.createModelItem(modelsContainer, model);
        });
    
        // Add Model Button
        new Setting(modelsContainer)
            .addButton(button =>
                button
                    .setButtonText('Add Model')
                    .setCta()
                    .onClick(() => this.addModel(provider))
            );
    
        // API Key Setting
        const setting = new Setting(accordion)
            .setName('API Key')
            .setDesc(`Enter your ${provider.name} API key`)
            .addText(text => {
                text
                    .setPlaceholder('Enter API key')
                    .setValue(provider.apiKey)
                    .onChange(async (value) => {
                        await this.plugin.settings.saveProviderKey(provider.name, value);
                    });
    
                // Set input type to password
                text.inputEl.type = 'password';
                return text;
            });
    
        // Add visibility toggle button
        setting.addExtraButton(button => {
            button
                .setIcon('eye')
                .setTooltip('Show API key')
                .onClick(() => {
                    const input = setting.controlEl.querySelector('input');
                    if (input) {
                        const isPassword = input.type === 'password';
                        input.type = isPassword ? 'text' : 'password';
                        button.setIcon(isPassword ? 'eye-off' : 'eye');
                        button.setTooltip(isPassword ? 'Hide API key' : 'Show API key');
                    }
                });
        });
    
        // Add test button
        setting.addButton(button =>
            button
                .setButtonText('Test')
                .setCta()
                .onClick(() => this.testApiKey(provider))
        );
    }
    
    private createModelItem(container: HTMLElement, model: ModelConfig): void {
        const modelItem = container.createDiv({ cls: 'model-item' });
        modelItem.style.display = 'flex';
        modelItem.style.justifyContent = 'space-between';
        modelItem.style.alignItems = 'center';
        modelItem.style.marginBottom = '8px';
    
        // Model Name and Status
        const nameStatusEl = modelItem.createEl('span');
        nameStatusEl.style.display = 'flex';
        nameStatusEl.style.alignItems = 'center';
    
        const nameEl = nameStatusEl.createEl('span', { text: model.name });
        nameEl.style.marginRight = '8px';
    
        const statusEl = nameStatusEl.createEl('span', { text: model.builtIn ? 'Built-in' : 'Custom' });
        statusEl.style.color = model.builtIn ? 'var(--text-accent)' : 'var(--text-muted)';
    
        // Edit and Delete Buttons
        const actionsEl = modelItem.createDiv({ cls: 'model-actions' });
        actionsEl.style.display = 'flex';
        actionsEl.style.gap = '4px';
    
        // Edit Button
        new Setting(actionsEl)
            .addButton(button =>
                button
                    .setIcon('pencil')
                    .setTooltip('Edit Model')
                    .onClick(() => this.editModel(model))
            );
    
        // Delete Button
        new Setting(actionsEl)
            .addButton(button =>
                button
                    .setIcon('trash')
                    .setTooltip('Delete Model')
                    .onClick(() => this.deleteModel(model))
            );
    }
    
    private toggleAccordion(accordion: HTMLElement): void {
        const modelsList = accordion.querySelector('.models-list') as HTMLElement | null;
        if (modelsList) {
            modelsList.style.display = modelsList.style.display === 'none' ? 'block' : 'none';
        }
    }
    
    private addProvider(): void {
        // Implement logic to add a new provider
        new Notice('Add Provider functionality not yet implemented');
    }
    
    private addModel(provider: ProviderConfig): void {
        // Implement logic to add a new model
        new Notice('Add Model functionality not yet implemented');
    }
    
    private editModel(model: ModelConfig): void {
        // Implement logic to edit a model
        new Notice('Edit Model functionality not yet implemented');
    }
    
    private deleteModel(model: ModelConfig): void {
        // Implement logic to delete a model
        new Notice('Delete Model functionality not yet implemented');
    }

    private createProviderCard(container: HTMLElement, provider: ProviderConfig): void {
        const card = container.createDiv();
        card.style.border = '1px solid var(--background-modifier-border)';
        card.style.borderRadius = '8px';
        card.style.padding = '16px';
        card.style.backgroundColor = 'var(--background-secondary)';

        // Provider Title
        const titleEl = card.createEl('h3', { text: provider.name });
        titleEl.style.margin = '0 0 8px 0';

        // Provider Description
        const descEl = card.createEl('p', { text: this.getProviderDescription(provider.type) });
        descEl.style.margin = '0 0 16px 0';
        descEl.style.color = 'var(--text-muted)';

        // API Key Setting
        const setting = new Setting(card)
            .setName('API Key')
            .setDesc(`Enter your ${provider.name} API key`)
            .addText(text => {
                text
                    .setPlaceholder('Enter API key')
                    .setValue(provider.apiKey)
                    .onChange(async (value) => {
                        await this.plugin.settings.saveProviderKey(provider.name, value);
                    });

                // Set input type to password
                text.inputEl.type = 'password';
                return text;
            });

        // Add visibility toggle button
        setting.addExtraButton(button => {
            button
                .setIcon('eye')
                .setTooltip('Show API key')
                .onClick(() => {
                    const input = setting.controlEl.querySelector('input');
                    if (input) {
                        const isPassword = input.type === 'password';
                        input.type = isPassword ? 'text' : 'password';
                        button.setIcon(isPassword ? 'eye-off' : 'eye');
                        button.setTooltip(isPassword ? 'Hide API key' : 'Show API key');
                    }
                });
        });

        // Add test button
        setting.addButton(button =>
            button
                .setButtonText('Test')
                .setCta()
                .onClick(() => this.testApiKey(provider))
        );
    }

    private displaySummarySettingsSection(containerEl: HTMLElement): void {
        // Summary Prompt Setting
        new Setting(containerEl)
            .setName('Summary prompt')
            .setDesc('Customize the prompt for generating summaries')
            .addTextArea(text =>
                text
                    .setPlaceholder('Enter custom prompt')
                    .setValue(this.settings.getCustomPrompt())
                    .onChange(async (value) => {
                        await this.settings.updateCustomPrompt(value);
                    })
                    .then(textArea => {
                        textArea.inputEl.style.width = '500px';
                        textArea.inputEl.style.height = '200px';
                    })
            );

        // Max Tokens Setting
        new Setting(containerEl)
            .setName('Max tokens')
            .setDesc('Maximum number of tokens to generate')
            .addText(text =>
                text
                    .setPlaceholder('Enter max tokens')
                    .setValue(String(this.settings.getMaxTokens()))
                    .onChange(async (value) => {
                        await this.settings.updateMaxTokens(Number(value));
                    })
            );

        // Temperature Setting
        new Setting(containerEl)
            .setName('Temperature')
            .setDesc('Temperature parameter for text generation (0.0 to 1.0)')
            .addText(text =>
                text
                    .setPlaceholder('Enter temperature')
                    .setValue(String(this.settings.getTemperature()))
                    .onChange(async (value) => {
                        await this.settings.updateTemperature(Number(value));
                    })
            );
    }

    private getProviderDescription(type: string): string {
        switch (type) {
            case 'gemini':
                return 'Configure Google Gemini API settings';
            case 'openai':
                return 'Configure OpenAI API settings';
            case 'anthropic':
                return 'Configure Anthropic Claude API settings';
            default:
                return 'Configure API settings';
        }
    }
}
