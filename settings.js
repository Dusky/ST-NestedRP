// Will use dynamically imported extension_settings from index.js

// Module name for settings
export const MODULE_NAME = 'nested_roleplay';
export const extensionName = 'nested-roleplay';

// Default settings
export const defaultSettings = {
    enabled: false,
    partnerCharacterId: '',
    controlledCharacterId: '',
    showPartnerName: true,
    allowMetaCommentary: true,
    metaCommentaryStyle: 'parentheses', // 'parentheses' or 'asterisks'
    controlledCharDialog: 'quotes', // 'quotes' or 'none'
};

/**
 * Initialize extension settings
 * @param {object} extension_settings - The extension settings object
 * @returns {Promise<object>} The settings object
 */
export async function initSettings(extension_settings) {
    // Try to dynamically import saveSettingsDebounced
    let saveSettingsDebounced;
    try {
        const module = await import('../../../script.js');
        saveSettingsDebounced = module.saveSettingsDebounced;
    } catch (e) {
        try {
            const module = await import('../../script.js');
            saveSettingsDebounced = module.saveSettingsDebounced;
        } catch (e2) {
            console.error('Nested Roleplay: Failed to import script.js', e2);
            // Fallback dummy function
            saveSettingsDebounced = () => console.warn('Nested Roleplay: saveSettingsDebounced not available');
        }
    }

    // Create settings if they don't exist
    if (!extension_settings[MODULE_NAME]) {
        console.log(`Nested Roleplay: Creating new settings object`);
        extension_settings[MODULE_NAME] = {};
    }
    
    // Set default values for settings that don't exist
    let settingsMissing = false;
    for (const key in defaultSettings) {
        if (extension_settings[MODULE_NAME][key] === undefined) {
            settingsMissing = true;
            extension_settings[MODULE_NAME][key] = defaultSettings[key];
        }
    }
    
    if (settingsMissing) {
        console.log(`Nested Roleplay: Applied default settings`);
        saveSettingsDebounced();
    }
    
    return extension_settings[MODULE_NAME];
}

/**
 * Register UI event handlers
 * @param {object} extension_settings - The extension settings object
 */
export function registerUIHandlers(extension_settings) {
    // Make sure settings exist
    if (!extension_settings[MODULE_NAME]) {
        console.error('Nested Roleplay: Settings not initialized');
        return;
    }
    
    const settings = extension_settings[MODULE_NAME];
    
    // Set initial values
    $('#nested_roleplay_enabled').prop('checked', settings.enabled);
    $('#nested_roleplay_show_partner_name').prop('checked', settings.showPartnerName);
    $('#nested_roleplay_allow_commentary').prop('checked', settings.allowMetaCommentary);
    $('#nested_roleplay_commentary_style').val(settings.metaCommentaryStyle);
    $('#nested_roleplay_dialog_style').val(settings.controlledCharDialog);
    
    // Bind change events
    $('#nested_roleplay_enabled').on('change', function() {
        settings.enabled = !!$(this).prop('checked');
        saveSettingsDebounced();
    });
    
    $('#nested_roleplay_partner').on('change', function() {
        settings.partnerCharacterId = $(this).val();
        saveSettingsDebounced();
    });
    
    $('#nested_roleplay_controlled').on('change', function() {
        settings.controlledCharacterId = $(this).val();
        saveSettingsDebounced();
    });
    
    $('#nested_roleplay_show_partner_name').on('change', function() {
        settings.showPartnerName = !!$(this).prop('checked');
        saveSettingsDebounced();
    });
    
    $('#nested_roleplay_allow_commentary').on('change', function() {
        settings.allowMetaCommentary = !!$(this).prop('checked');
        saveSettingsDebounced();
    });
    
    $('#nested_roleplay_commentary_style').on('change', function() {
        settings.metaCommentaryStyle = $(this).val();
        saveSettingsDebounced();
    });
    
    $('#nested_roleplay_dialog_style').on('change', function() {
        settings.controlledCharDialog = $(this).val();
        saveSettingsDebounced();
    });
}