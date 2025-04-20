import { App, Notice, PluginSettingTab, Setting, Modal, setIcon } from 'obsidian';
import { ModelConfig, PluginSettings, ProviderConfig, ProviderType } from '../types';
import { YouTubeSummarizerPlugin } from '../main';

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

        const tabs = containerEl.createEl('div', { cls: 'yt-summarizer-settings__tab-group' });
        const tabList = tabs.createEl('nav', { cls: 'yt-summarizer-settings__tab-list' });
        const tabContent = tabs.createEl('div', { cls: 'yt-summarizer-settings__tab-content' });

        const aiProvidersContent = tabContent.createDiv({ cls: 'yt-summarizer-settings__content' });
        const summarySettingsContent = tabContent.createDiv({ cls: 'yt-summarizer-settings__content' });

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
            cls: 'yt-summarizer-settings__tab',
            text: name
        });

        if (this.currentTab === id) {
            tab.addClass('is-active');
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
                    const displayText = model.displayName || model.name;
                    options[model.name] = `${model.provider.name} / ${displayText}`;
                });

                dropdown
                    .addOptions(options)
                    .setValue(selectedModel?.name || '')
                    .onChange(async (value) => {
                        try {
                            const selectedModel = availableModels.find(m => m.name === value);
                            if (selectedModel) {
                                this.plugin.settings.setSelectedModel(selectedModel.name);
                                this.display();
                            }
                        } catch (error) {
                            console.error('Failed to set active model:', error, 'Selected model:', value);
                            new Notice(`Failed to set active model: ${error.message}`);
                        }
                    });

                this.activeModelDropdown = dropdown.selectEl;
            });

        // Provider Accordions Container
        const accordionsContainer = containerEl.createDiv({ cls: 'yt-summarizer-settings__provider-accordions' });

        // Create accordions for each provider
        this.settings.getProviders().forEach(provider => {
            const accordion = accordionsContainer.createDiv({ cls: 'yt-summarizer-settings__provider-accordion' });

            // Header section
            const header = accordion.createDiv({ cls: 'yt-summarizer-settings__provider-header' });
            header.addEventListener('click', () => this.toggleAccordion(accordion));

            // Left side of header
            const headerInfo = header.createDiv();
            headerInfo.addClass('yt-summarizer-settings__provider-info');

            const titleEl = headerInfo.createEl('h3', { text: provider.name });

            // Verified indicator
            if (provider.verified) {
                const verifiedBadge = headerInfo.createEl('span', { text: 'Verified', cls: 'yt-summarizer-settings__verified-badge' });
            }

            // Right side of header - collapse/expand icon
            const iconEl = header.createDiv({ cls: 'yt-summarizer-settings__collapse-icon' });
            setIcon(iconEl, 'chevron-down');

            // Content section
            const content = accordion.createDiv({ cls: 'yt-summarizer-settings__provider-content' });
            content.style.display = 'none';

            // API Key Setting
            const apiKeySetting = new Setting(content)
                .setName('API Key')
                .setDesc(`Enter your ${provider.name} API key`)
                .addText(text => {
                    text
                        .setPlaceholder('Enter API key')
                        .setValue(provider.apiKey)
                        .onChange(async (value) => {
                            await this.plugin.settings.saveProviderKey(provider.name, value);
                        });
                    text.inputEl.type = 'password';
                    return text;
                });

            // Add visibility toggle button
            apiKeySetting.addExtraButton(button => {
                button
                    .setIcon('eye')
                    .setTooltip('Show API key')
                    .onClick(() => {
                        const input = apiKeySetting.controlEl.querySelector('input');
                        if (input) {
                            const isPassword = input.type === 'password';
                            input.type = isPassword ? 'text' : 'password';
                            button.setIcon(isPassword ? 'eye-off' : 'eye');
                            button.setTooltip(isPassword ? 'Hide API key' : 'Show API key');
                        }
                    });
            });

            // Add test button
            apiKeySetting.addButton(button =>
                button
                    .setButtonText('Test')
                    .setCta()
                    .onClick(() => this.testApiKey(provider))
            );

            // Models section
            const modelsSection = content.createDiv();
            const modelsHeader = modelsSection.createEl('h4', { text: 'Models' });
            modelsHeader.style.marginTop = '24px';
            modelsHeader.style.marginBottom = '12px';

            // Models list
            const modelsList = modelsSection.createDiv({ cls: 'yt-summarizer-settings__models-list' });

            // Add models
            provider.models?.forEach(model => {
                // Создаем глубокую копию модели перед передачей в createModelItem
                const modelCopy = {
                    name: model.name,
                    displayName: model.displayName,
                    provider: {
                        name: provider.name,
                        type: provider.type,
                        apiKey: provider.apiKey,
                        url: provider.url,
                        verified: provider.verified
                    }
                };
                this.createModelItem(modelsList, modelCopy);
            });

            // Add Model button
            const addModelButton = new Setting(modelsSection)
                .addButton(button =>
                    button
                        .setButtonText('Add Model')
                        .setCta()
                        .onClick(() => this.addModel(provider))
                );
            addModelButton.settingEl.addClass('yt-summarizer-settings__add-button');
        });

        // Add Provider button at the bottom
        const addProviderButton = new Setting(containerEl)
            .setName('Add New Provider')
            .setDesc('Add a custom AI provider')
            .addButton(button =>
                button
                    .setButtonText('Add Provider')
                    .setCta()
                    .onClick(() => this.addProvider())
            );
        addProviderButton.settingEl.addClass('yt-summarizer-settings__add-provider-button');
    }

    private createModelItem(container: HTMLElement, model: ModelConfig): void {
        const modelItem = container.createDiv({ cls: 'setting-item' });

        // Info container (left side)
        const info = modelItem.createDiv({ cls: 'setting-item-info' });

        // Status indicator and name in the title
        const title = info.createDiv({ cls: 'setting-item-name' });
        title.createSpan({ text: model.displayName || model.name });

        // Control container (right side)
        const control = modelItem.createDiv({ cls: 'setting-item-control' });

        // Edit button
        const editButton = control.createEl('button', {
            cls: 'clickable-icon',
            attr: { 'aria-label': 'Edit model' }
        });
        setIcon(editButton, 'pencil');
        editButton.addEventListener('click', () => this.editModel({
            name: model.name,
            displayName: model.displayName,
            provider: model.provider
        }));

        // Delete button
        const deleteButton = control.createEl('button', {
            cls: 'clickable-icon',
            attr: { 'aria-label': 'Delete model' }
        });
        setIcon(deleteButton, 'trash');
        deleteButton.addEventListener('click', () => this.deleteModel({
            name: model.name,
            displayName: model.displayName,
            provider: {
                name: model.provider.name,
                type: model.provider.type,
                apiKey: model.provider.apiKey,
                url: model.provider.url,
                verified: model.provider.verified
            }
        }));
    }

    private toggleAccordion(accordion: HTMLElement): void {
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

    private addProvider(): void {
        const modal = new Modal(this.app);
        modal.titleEl.setText('Add Provider');
        modal.contentEl.addClass('yt-summarizer-settings__modal-content');

        // Provider Name
        const nameContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__form-group' });
        const nameLabel = nameContainer.createEl('label', { text: 'Provider Name:' });
        const nameInput = nameContainer.createEl('input');
        nameInput.type = 'text';

        // Provider Type
        const typeContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__form-group' });
        const typeLabel = typeContainer.createEl('label', { text: 'Provider Type:' });
        const typeSelect = typeContainer.createEl('select');

        // Add provider type options
        ['openai', 'anthropic', 'gemini'].forEach(type => {
            const option = typeSelect.createEl('option', { value: type, text: type });
        });

        // API Key
        const apiKeyContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__form-group' });
        const apiKeyLabel = apiKeyContainer.createEl('label', { text: 'API Key:' });
        const apiKeyInput = apiKeyContainer.createEl('input');
        apiKeyInput.type = 'password';

        // Custom URL (Optional)
        const urlContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__form-group' });
        const urlLabel = urlContainer.createEl('label', { text: 'Custom URL (Optional):' });
        const urlInput = urlContainer.createEl('input');
        urlInput.type = 'text';

        // Buttons
        const buttonContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__button-container' });

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => modal.close());

        const saveButton = buttonContainer.createEl('button', { text: 'Save', cls: 'yt-summarizer-settings__button-primary' });
        saveButton.addEventListener('click', async () => {
            const newProvider: ProviderConfig = {
                name: nameInput.value,
                type: typeSelect.value as ProviderType,
                apiKey: apiKeyInput.value,
                url: urlInput.value || undefined,
                verified: false,
                models: []
            };

            try {
                this.settings.addProvider(newProvider);
                await this.testApiKey(newProvider);
                modal.close();
                this.display();
            } catch (error) {
                new Notice(`Failed to add provider: ${error.message}`);
            }
        });

        modal.open();
    }

    private addModel(provider: ProviderConfig): void {
        const modal = new Modal(this.app);
        modal.titleEl.setText('Add Model');
        modal.contentEl.addClass('yt-summarizer-settings__modal-content');

        // Model Name (required)
        const nameContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__form-group' });
        const nameLabel = nameContainer.createEl('label', { text: 'Model Name:' });
        const nameInput = nameContainer.createEl('input');
        nameInput.type = 'text';

        // Display Name (optional)
        const displayNameContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__form-group' });
        const displayNameLabel = displayNameContainer.createEl('label', { text: 'Display Name (Optional):' });
        const displayNameInput = displayNameContainer.createEl('input');
        displayNameInput.type = 'text';

        // Buttons
        const buttonContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__button-container' });

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => modal.close());

        const saveButton = buttonContainer.createEl('button', { text: 'Save', cls: 'yt-summarizer-settings__button-primary' });
        saveButton.addEventListener('click', () => {
            const newModel: ModelConfig = {
                name: nameInput.value,
                displayName: displayNameInput.value || undefined,
                provider: {
                    name: provider.name,
                    type: provider.type,
                    apiKey: provider.apiKey,
                    url: provider.url,
                    verified: provider.verified
                }
            };

            try {
                this.settings.addModel(newModel);
                modal.close();
                this.display();
            } catch (error) {
                new Notice(`Failed to add model: ${error.message}`);
            }
        });

        modal.open();
    }

    private editModel(model: ModelConfig): void {
        const modal = new Modal(this.app);
        modal.titleEl.setText('Edit Model');
        modal.contentEl.addClass('yt-summarizer-settings__modal-content');

        // Model Name (read-only)
        const nameContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__form-group' });
        const nameLabel = nameContainer.createEl('label', { text: 'Model Name:' });
        const nameInput = nameContainer.createEl('input');
        nameInput.type = 'text';
        nameInput.value = model.name;
        nameInput.disabled = true; // Name should not be editable

        // Display Name
        const displayNameContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__form-group' });
        const displayNameLabel = displayNameContainer.createEl('label', { text: 'Display Name (Optional):' });
        const displayNameInput = displayNameContainer.createEl('input');
        displayNameInput.type = 'text';
        displayNameInput.value = model.displayName || '';

        // Buttons
        const buttonContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__button-container' });

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => modal.close());

        const saveButton = buttonContainer.createEl('button', { text: 'Save', cls: 'yt-summarizer-settings__button-primary' });
        saveButton.addEventListener('click', () => {
            const updatedModel: ModelConfig = {
                name: model.name,
                displayName: displayNameInput.value || undefined,
                provider: {
                    name: model.provider.name,
                    type: model.provider.type,
                    apiKey: model.provider.apiKey,
                    url: model.provider.url,
                    verified: model.provider.verified
                }
            };

            try {
                this.settings.updateModel(updatedModel.name, updatedModel.displayName || updatedModel.name, updatedModel.provider.name);
                modal.close();
                this.display();
            } catch (error) {
                new Notice(`Failed to update model: ${error.message}`);
            }
        });

        modal.open();
    }

    /**
     * Displays a confirmation modal and handles the deletion of a model.
     * This method shows a confirmation dialog to the user and, if confirmed,
     * removes the model from the provider's list of models.
     * 
     * @param model - The model configuration to delete
     */
    private deleteModel(model: ModelConfig): void {
        console.log('Delete model called with:', model);

        const modal = new Modal(this.app);
        modal.titleEl.setText('Delete Model');
        modal.contentEl.addClass('yt-summarizer-settings__modal-content');

        const displayName = model.displayName || model.name;
        const messageEl = modal.contentEl.createEl('p', {
            text: `Are you sure you want to delete the model "${displayName}"?`
        });
        messageEl.style.marginBottom = '16px';

        // Buttons
        const buttonContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__button-container' });

        const cancelButton = buttonContainer.createEl('button', { text: 'Cancel' });
        cancelButton.addEventListener('click', () => modal.close());

        const deleteButton = buttonContainer.createEl('button', { text: 'Delete', cls: 'yt-summarizer-settings__button-danger' });
        deleteButton.addEventListener('click', () => {
            try {
                console.log('Attempting to delete model:', model);
                this.settings.deleteModel(model.provider.name, model.name);
                modal.close();
                this.display();
            } catch (error) {
                console.error('Error deleting model:', error);
                new Notice(`Failed to delete model: ${error.message}`);
            }
        });

        modal.open();
    }

    private createProviderCard(container: HTMLElement, provider: ProviderConfig): void {
        const card = container.createDiv({ cls: 'yt-summarizer-settings__provider-card' });

        // Provider Title
        const titleEl = card.createEl('h3', { text: provider.name });

        // Provider Description
        const descEl = card.createEl('p', { text: this.getProviderDescription(provider.type), cls: 'yt-summarizer-settings__description' });

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
                        textArea.inputEl.addClass('yt-summarizer-settings__summary-prompt');
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
                return 'Google Gemini AI - Advanced language model for text generation and analysis';
            case 'openai':
                return 'OpenAI GPT - State-of-the-art language model for natural text generation';
            case 'anthropic':
                return 'Anthropic Claude - Advanced AI model focused on safe and helpful interactions';
            default:
                return 'Custom AI provider configuration';
        }
    }
}