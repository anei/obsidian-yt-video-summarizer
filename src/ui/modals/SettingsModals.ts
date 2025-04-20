import { App, Modal } from 'obsidian';
import { ModelConfig, ProviderConfig, ProviderType } from '../../types';
import { SettingsEventHandlers } from '../handlers/SettingsEventHandlers';

export class SettingsModals {
    constructor(private app: App) { }

    createAddProviderModal(handlers: SettingsEventHandlers): Modal {
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
            typeSelect.createEl('option', { value: type, text: type });
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

        const saveButton = buttonContainer.createEl('button', {
            text: 'Save',
            cls: 'yt-summarizer-settings__button-primary'
        });

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
                await handlers.handleProviderAdd(newProvider);
                modal.close();
            } catch (error) {
                // Error is already handled in handleProviderAdd
            }
        });

        return modal;
    }

    createEditModelModal(model: ModelConfig, handlers: SettingsEventHandlers): Modal {
        const modal = new Modal(this.app);
        modal.titleEl.setText('Edit Model');
        modal.contentEl.addClass('yt-summarizer-settings__modal-content');

        // Model Name (read-only)
        const nameContainer = modal.contentEl.createDiv({ cls: 'yt-summarizer-settings__form-group' });
        const nameLabel = nameContainer.createEl('label', { text: 'Model Name:' });
        const nameInput = nameContainer.createEl('input');
        nameInput.type = 'text';
        nameInput.value = model.name;
        nameInput.disabled = true;

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

        const saveButton = buttonContainer.createEl('button', {
            text: 'Save',
            cls: 'yt-summarizer-settings__button-primary'
        });

        saveButton.addEventListener('click', async () => {
            const updatedModel: ModelConfig = {
                ...model,
                displayName: displayNameInput.value || undefined
            };

            try {
                await handlers.handleModelEdit(updatedModel);
                modal.close();
            } catch (error) {
                // Error is already handled in handleModelEdit
            }
        });

        return modal;
    }

    createDeleteModelModal(model: ModelConfig, handlers: SettingsEventHandlers): Modal {
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

        const deleteButton = buttonContainer.createEl('button', {
            text: 'Delete',
            cls: 'yt-summarizer-settings__button-danger'
        });

        deleteButton.addEventListener('click', async () => {
            try {
                await handlers.handleModelDelete(model);
                modal.close();
            } catch (error) {
                // Error is already handled in handleModelDelete
            }
        });

        return modal;
    }

    createAddModelModal(provider: ProviderConfig, handlers: SettingsEventHandlers): Modal {
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

        const saveButton = buttonContainer.createEl('button', {
            text: 'Save',
            cls: 'yt-summarizer-settings__button-primary'
        });

        saveButton.addEventListener('click', async () => {
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
                await handlers.handleModelAdd(newModel);
                modal.close();
            } catch (error) {
                // Error is already handled in handleModelAdd
            }
        });

        return modal;
    }
} 