import { App, Notice, PluginSettingTab, Setting } from 'obsidian';
import { ModelConfig, PluginSettings } from '../types';
import { YouTubeSummarizerPlugin } from '../main';
import { SettingsUIComponents } from './components/SettingsUIComponents';
import { SettingsEventHandlers, UICallbacks } from './handlers/SettingsEventHandlers';
import { SettingsModals } from './modals/SettingsModals';

/**
 * Represents the settings tab for the YouTube Summarizer Plugin.
 * This class extends the PluginSettingTab and provides a user interface
 * for configuring the plugin's settings.
 */
export class SettingsTab extends PluginSettingTab {
    private activeModelDropdown: HTMLSelectElement | null = null;
    private currentTab: string = 'ai-providers';
    private settings: PluginSettings;
    private uiComponents: SettingsUIComponents;
    private eventHandlers: SettingsEventHandlers;
    private modals: SettingsModals;

    constructor(app: App, private plugin: YouTubeSummarizerPlugin) {
        super(app, plugin);
        this.settings = plugin.settings;
        this.uiComponents = new SettingsUIComponents(app);

        // Create callbacks for UI updates
        const callbacks: UICallbacks = {
            onModelAdded: (model) => {
                this.uiComponents.addModelToAccordion(model, this.eventHandlers);
                this.uiComponents.updateModelDropdown(
                    this.getAvailableModels(),
                    this.settings.getSelectedModel()?.name || null
                );
            },
            onModelDeleted: (model) => {
                this.uiComponents.removeModelFromAccordion(model);
                this.uiComponents.updateModelDropdown(
                    this.getAvailableModels(),
                    this.settings.getSelectedModel()?.name || null
                );
            },
            onModelUpdated: (model) => {
                this.uiComponents.updateModelInAccordion(model);
                this.uiComponents.updateModelDropdown(
                    this.getAvailableModels(),
                    this.settings.getSelectedModel()?.name || null
                );
            },
            onProviderAdded: (provider) => {
                this.uiComponents.addProviderAccordion(provider, this.eventHandlers);
            },
            onActiveModelChanged: () => {
                this.uiComponents.updateModelDropdown(
                    this.getAvailableModels(),
                    this.settings.getSelectedModel()?.name || null
                );
            }
        };

        this.eventHandlers = new SettingsEventHandlers(plugin, callbacks);
        this.modals = new SettingsModals(app);
    }

    getAvailableModels(): ModelConfig[] {
        return this.settings.getModels();
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
        this.createTabButtons(tabList);

        // Display sections
        this.displayAIProvidersSection(aiProvidersContent);
        this.displaySummarySettingsSection(summarySettingsContent);
    }

    private createTabButtons(tabList: HTMLElement): void {
        const tabs = [
            { name: 'AI Providers', id: 'ai-providers' },
            { name: 'Summary Settings', id: 'summary-settings' }
        ];

        tabs.forEach(({ name, id }) => {
            const tab = this.uiComponents.createTabButton(name, id, this.currentTab === id);
            tab.addEventListener('click', () => {
                this.currentTab = id;
                this.display();
            });
            tabList.appendChild(tab);
        });
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
                    .onChange(value => this.eventHandlers.handleModelSelection(value, availableModels));

                this.activeModelDropdown = dropdown.selectEl;
            });

        // Provider Accordions Container
        const accordionsContainer = containerEl.createDiv({ cls: 'yt-summarizer-settings__provider-accordions' });

        // Create accordions for each provider
        this.settings.getProviders().forEach(provider => {
            const accordion = this.uiComponents.createProviderAccordion(provider);
            const content = accordion.querySelector('.yt-summarizer-settings__provider-content') as HTMLElement;

            // Add click handler for accordion toggle
            const header = accordion.querySelector('.yt-summarizer-settings__provider-header');
            header?.addEventListener('click', () => this.eventHandlers.handleAccordionToggle(accordion));

            // API Key Setting
            const apiKeySetting = this.uiComponents.createApiKeySetting(content, provider);

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
                    .onClick(() => this.eventHandlers.handleApiKeyTest(provider))
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
                const modelItem = this.uiComponents.createModelItem(model);

                // Add event listeners to buttons
                const editButton = modelItem.querySelector('[aria-label="Edit model"]');
                const deleteButton = modelItem.querySelector('[aria-label="Delete model"]');

                editButton?.addEventListener('click', () => {
                    const modal = this.modals.createEditModelModal(model, this.eventHandlers);
                    modal.open();
                });

                deleteButton?.addEventListener('click', () => {
                    const modal = this.modals.createDeleteModelModal(model, this.eventHandlers);
                    modal.open();
                });

                modelsList.appendChild(modelItem);
            });

            // Add Model button
            const addModelButton = new Setting(modelsSection)
                .addButton(button =>
                    button
                        .setButtonText('Add Model')
                        .setCta()
                        .onClick(() => {
                            const modal = this.modals.createAddModelModal(provider, this.eventHandlers);
                            modal.open();
                        })
                );
            addModelButton.settingEl.addClass('yt-summarizer-settings__add-button');

            accordionsContainer.appendChild(accordion);
        });

        // Add Provider button at the bottom
        const addProviderButton = new Setting(containerEl)
            .setName('Add New Provider')
            .setDesc('Add a custom AI provider')
            .addButton(button =>
                button
                    .setButtonText('Add Provider')
                    .setCta()
                    .onClick(() => {
                        const modal = this.modals.createAddProviderModal(this.eventHandlers);
                        modal.open();
                    })
            );
        addProviderButton.settingEl.addClass('yt-summarizer-settings__add-provider-button');
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
}