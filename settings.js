import { extension_settings, saveSettingsDebounced } from "../../../../script.js";

// Module name for settings
export const MODULE_NAME = 'nested_roleplay';

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
 */
export function initSettings() {
    // Create settings if they don't exist
    if (!extension_settings[MODULE_NAME]) {
        extension_settings[MODULE_NAME] = {};
    }
    
    // Set default values for settings that don't exist
    for (const key in defaultSettings) {
        if (extension_settings[MODULE_NAME][key] === undefined) {
            extension_settings[MODULE_NAME][key] = defaultSettings[key];
        }
    }
    
    return extension_settings[MODULE_NAME];
}

/**
 * Register UI event handlers
 */
export function registerUIHandlers() {
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