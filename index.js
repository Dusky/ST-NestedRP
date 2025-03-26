/**
 * Nested Roleplay extension for SillyTavern
 * 
 * Allows users to create a meta-roleplay experience where one AI character
 * acts as a roleplay partner who controls another character.
 */

// Module name for settings
const MODULE_NAME = 'nested_roleplay';

// Default settings
const defaultSettings = {
    enabled: false,
    partnerCharacterId: null,
    controlledCharacterId: null,
    showPartnerName: true,
    allowMetaCommentary: true,
    metaCommentaryStyle: 'parentheses', // 'parentheses' or 'asterisks'
    controlledCharDialog: 'quotes', // 'quotes' or 'none'
};

// Import from SillyTavern API
document.addEventListener('DOMContentLoaded', function() {
    // Initialize extension
    initializeNestedRoleplay();
});

/**
 * Initialize the extension
 */
function initializeNestedRoleplay() {
    console.log('Nested Roleplay: Initializing extension');
    
    try {
        const context = SillyTavern.getContext();
        const { eventSource, event_types, characters, extensionSettings, saveSettingsDebounced } = context;
        
        // Initialize settings
        if (!extensionSettings[MODULE_NAME]) {
            extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
        }
        
        // Register event listeners for UI initialization
        eventSource.on(event_types.APP_READY, onAppReady);
        eventSource.on(event_types.EXTENSIONS_FIRST_LOAD, addSettingsUI);
        eventSource.on(event_types.SETTINGS_LOADED, addSettingsUI);
        
        // Add settings UI immediately (some versions may not fire the events)
        addSettingsUI();
        
        // Register core functionality event listeners
        eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
        eventSource.on(event_types.CHARACTER_EDITED, refreshCharacterLists);
        eventSource.on(event_types.CHARACTER_DELETED, refreshCharacterLists);
        eventSource.on(event_types.CHARACTER_PAGE_LOADED, refreshCharacterLists);
        
        // Register prompt modifiers
        registerPromptModifiers();
        
        console.log('Nested Roleplay: Extension initialized successfully');
    } catch (error) {
        console.error('Nested Roleplay: Error initializing extension', error);
    }
}

/**
 * When the app is ready, initialize the extension
 */
function onAppReady() {
    refreshCharacterLists();
}

/**
 * Get extension settings
 * @returns {object} Extension settings
 */
function getSettings() {
    const { extensionSettings } = SillyTavern.getContext();
    
    // Initialize settings if they don't exist
    if (!extensionSettings[MODULE_NAME]) {
        extensionSettings[MODULE_NAME] = structuredClone(defaultSettings);
    }
    
    // Ensure all default keys exist
    for (const key in defaultSettings) {
        if (extensionSettings[MODULE_NAME][key] === undefined) {
            extensionSettings[MODULE_NAME][key] = defaultSettings[key];
        }
    }
    
    return extensionSettings[MODULE_NAME];
}

/**
 * Add settings UI to the extensions panel
 */
function addSettingsUI() {
    // Create settings HTML
    const html = `
    <div id="nested_roleplay_settings">
        <div class="inline-drawer">
            <div class="inline-drawer-toggle inline-drawer-header">
                <b>Nested Roleplay</b>
                <div class="inline-drawer-icon fa-solid fa-circle-chevron-down"></div>
            </div>
            <div class="inline-drawer-content">
                <div class="nested-roleplay-container">
                    <label class="checkbox_label">
                        <input type="checkbox" id="nested_roleplay_enabled" />
                        <span>Enable Nested Roleplay</span>
                    </label>
                    
                    <div class="nested-roleplay-row">
                        <div class="nested-roleplay-label">Roleplay Partner:</div>
                        <select id="nested_roleplay_partner" class="text_pole"></select>
                    </div>
                    
                    <div class="nested-roleplay-row">
                        <div class="nested-roleplay-label">Controlled Character:</div>
                        <select id="nested_roleplay_controlled" class="text_pole"></select>
                    </div>
                    
                    <label class="checkbox_label">
                        <input type="checkbox" id="nested_roleplay_show_partner_name" />
                        <span>Show partner name in messages</span>
                    </label>
                    
                    <label class="checkbox_label">
                        <input type="checkbox" id="nested_roleplay_allow_commentary" />
                        <span>Allow meta-commentary from partner</span>
                    </label>
                    
                    <div class="nested-roleplay-row">
                        <div class="nested-roleplay-label">Commentary style:</div>
                        <select id="nested_roleplay_commentary_style" class="text_pole">
                            <option value="parentheses">Parentheses: (like this)</option>
                            <option value="asterisks">Asterisks: *like this*</option>
                        </select>
                    </div>
                    
                    <div class="nested-roleplay-row">
                        <div class="nested-roleplay-label">Character dialog:</div>
                        <select id="nested_roleplay_dialog_style" class="text_pole">
                            <option value="quotes">Quotes: "like this"</option>
                            <option value="none">No quotes</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    </div>`;
    
    // Add HTML to extensions settings
    // Try different possible selectors for the extensions settings container
    const extensionsContainer = $('#extensions_settings, #extensions-settings, .extensions_settings, .extensions-settings').first();
    
    if (extensionsContainer.length) {
        extensionsContainer.append(html);
        
        // Bind event listeners to UI elements
        bindSettingsUIEvents();
        console.log('Nested Roleplay: Settings UI added successfully');
    } else {
        console.error('Nested Roleplay: Could not find extensions settings container');
        // Fallback: Try to add after some delay when the DOM might be ready
        setTimeout(() => {
            const extensionsContainer = $('#extensions_settings, #extensions-settings, .extensions_settings, .extensions-settings').first();
            if (extensionsContainer.length) {
                extensionsContainer.append(html);
                bindSettingsUIEvents();
                console.log('Nested Roleplay: Settings UI added successfully (delayed)');
            } else {
                console.error('Nested Roleplay: Still could not find extensions settings container after delay');
            }
        }, 2000);
    }
}

/**
 * Bind UI events to settings elements
 */
function bindSettingsUIEvents() {
    // Get settings
    const settings = getSettings();
    
    // Set initial values
    $('#nested_roleplay_enabled').prop('checked', settings.enabled);
    $('#nested_roleplay_show_partner_name').prop('checked', settings.showPartnerName);
    $('#nested_roleplay_allow_commentary').prop('checked', settings.allowMetaCommentary);
    $('#nested_roleplay_commentary_style').val(settings.metaCommentaryStyle);
    $('#nested_roleplay_dialog_style').val(settings.controlledCharDialog);
    
    // Bind change events
    $('#nested_roleplay_enabled').on('change', function() {
        settings.enabled = !!$(this).prop('checked');
        saveSettings();
    });
    
    $('#nested_roleplay_partner').on('change', function() {
        settings.partnerCharacterId = $(this).val();
        saveSettings();
    });
    
    $('#nested_roleplay_controlled').on('change', function() {
        settings.controlledCharacterId = $(this).val();
        saveSettings();
    });
    
    $('#nested_roleplay_show_partner_name').on('change', function() {
        settings.showPartnerName = !!$(this).prop('checked');
        saveSettings();
    });
    
    $('#nested_roleplay_allow_commentary').on('change', function() {
        settings.allowMetaCommentary = !!$(this).prop('checked');
        saveSettings();
    });
    
    $('#nested_roleplay_commentary_style').on('change', function() {
        settings.metaCommentaryStyle = $(this).val();
        saveSettings();
    });
    
    $('#nested_roleplay_dialog_style').on('change', function() {
        settings.controlledCharDialog = $(this).val();
        saveSettings();
    });
}

/**
 * Save extension settings
 */
function saveSettings() {
    const { saveSettingsDebounced } = SillyTavern.getContext();
    saveSettingsDebounced();
}

/**
 * Refresh character dropdown lists in settings
 */
function refreshCharacterLists() {
    const { characters } = SillyTavern.getContext();
    const settings = getSettings();
    
    // Clear existing options
    $('#nested_roleplay_partner').empty();
    $('#nested_roleplay_controlled').empty();
    
    // Add default empty option
    $('#nested_roleplay_partner').append('<option value="">Select a character</option>');
    $('#nested_roleplay_controlled').append('<option value="">Select a character</option>');
    
    // Add character options
    for (const char of characters) {
        if (!char.name) continue;
        
        const $partnerOption = $('<option></option>')
            .val(char.avatar)
            .text(char.name);
            
        const $controlledOption = $('<option></option>')
            .val(char.avatar)
            .text(char.name);
        
        // Set selected if matching saved character
        if (char.avatar === settings.partnerCharacterId) {
            $partnerOption.attr('selected', 'selected');
        }
        
        if (char.avatar === settings.controlledCharacterId) {
            $controlledOption.attr('selected', 'selected');
        }
        
        $('#nested_roleplay_partner').append($partnerOption);
        $('#nested_roleplay_controlled').append($controlledOption);
    }
}

/**
 * Process incoming messages when extension is enabled
 * @param {object} data - Message data
 */
function onMessageReceived(data) {
    // Ignore if extension is disabled
    const settings = getSettings();
    if (!settings.enabled) return;
    
    // Ignore if not an AI message
    if (data.is_user) return;
    
    // Ignore if no characters are selected
    if (!settings.partnerCharacterId || !settings.controlledCharacterId) return;
    
    // Get the context
    const context = SillyTavern.getContext();
    const { characters } = context;
    
    // Find partner and controlled character
    const partnerChar = characters.find(char => char.avatar === settings.partnerCharacterId);
    const controlledChar = characters.find(char => char.avatar === settings.controlledCharacterId);
    
    if (!partnerChar || !controlledChar) return;
    
    // Process the message
    const originalText = data.mes;
    const processedText = processNestedRoleplayMessage(
        originalText, 
        partnerChar.name, 
        controlledChar.name,
        settings
    );
    
    // Update the message
    if (processedText !== originalText) {
        data.mes = processedText;
        
        // Add classes for styling
        setTimeout(() => {
            const $lastMsg = $('#chat').find('.mes').last();
            $lastMsg.addClass('nested-roleplay-partner-msg');
            
            // Apply highlight to controlled character dialogue
            highlightControlledCharacterDialog($lastMsg, controlledChar.name);
        }, 10);
    }
}

/**
 * Register event listeners for modifying the prompt before sending to the AI
 */
function registerPromptModifiers() {
    const { eventSource, event_types } = SillyTavern.getContext();
    
    // Listen for the event that fires right before a prompt is combined and sent to the API
    eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, onBeforeCombinePrompts);
}

/**
 * Modify the prompts before they are combined and sent to the API
 * @param {object} data - The data containing prompts
 */
function onBeforeCombinePrompts(data) {
    const settings = getSettings();
    if (!settings.enabled) return;
    
    // Ignore if no characters are selected
    if (!settings.partnerCharacterId || !settings.controlledCharacterId) return;
    
    const context = SillyTavern.getContext();
    const { characters } = context;
    
    // Find partner and controlled character
    const partnerChar = characters.find(char => char.avatar === settings.partnerCharacterId);
    const controlledChar = characters.find(char => char.avatar === settings.controlledCharacterId);
    
    if (!partnerChar || !controlledChar) return;
    
    // Add system prompt to guide the AI in generating nested roleplay responses
    const systemPrompt = createNestedRoleplaySystemPrompt(partnerChar.name, controlledChar.name, settings);
    
    // Check if system_prompt already exists in data
    if (!data.system_prompt) {
        data.system_prompt = systemPrompt;
    } else {
        // Append to existing system prompt
        data.system_prompt += '\n\n' + systemPrompt;
    }
}

/**
 * Process a message for nested roleplay formatting
 * @param {string} text - Original message text
 * @param {string} partnerName - Name of the partner character
 * @param {string} controlledName - Name of the controlled character
 * @param {object} settings - Extension settings
 * @returns {string} Processed message text
 */
function processNestedRoleplayMessage(text, partnerName, controlledName, settings) {
    let processedText = text;
    
    // Add partner name prefix if enabled
    if (settings.showPartnerName) {
        processedText = `**${partnerName}:** ${processedText}`;
    }
    
    // Add classes and styling to meta-commentary
    if (settings.allowMetaCommentary) {
        // Match text in parentheses or asterisks based on settings
        let commentaryRegex;
        if (settings.metaCommentaryStyle === 'parentheses') {
            commentaryRegex = /(\([^)]+\))/g;
        } else {
            commentaryRegex = /(\*[^*]+\*)/g;
        }
        
        // Replace with styled commentary
        processedText = processedText.replace(commentaryRegex, '<span class="nested-roleplay-commentary">$1</span>');
    }
    
    return processedText;
}

/**
 * Highlight controlled character dialogue in the message
 * @param {jQuery} $message - jQuery message element
 * @param {string} characterName - Name of the controlled character
 */
function highlightControlledCharacterDialog($message, characterName) {
    // Find dialogue attributed to the controlled character
    const messageHtml = $message.find('.mes_text').html();
    if (!messageHtml) return;
    
    // Look for character name followed by dialogue
    const pattern = new RegExp(`${characterName}[: ]+"([^"]+)"`, 'g');
    const replacement = `${characterName}: <span class="nested-roleplay-controlled-msg">"$1"</span>`;
    
    // Apply highlighting
    const newHtml = messageHtml.replace(pattern, replacement);
    $message.find('.mes_text').html(newHtml);
}

/**
 * Create a system prompt for the nested roleplay
 * @param {string} partnerName - Name of the partner character
 * @param {string} controlledName - Name of the controlled character
 * @param {object} settings - Extension settings
 * @returns {string} System prompt text
 */
function createNestedRoleplaySystemPrompt(partnerName, controlledName, settings) {
    const commentaryStyle = settings.metaCommentaryStyle === 'parentheses' 
        ? '(like this)' 
        : '*like this*';
    
    const dialogStyle = settings.controlledCharDialog === 'quotes'
        ? `${controlledName}: "Like this"`
        : `${controlledName}: Like this`;
    
    return `
IMPORTANT INSTRUCTION: Nested Roleplay Mode
---------------------------------------------
In this chat, you are playing as ${partnerName}, who is controlling the character ${controlledName}.

You must act as though you (${partnerName}) are the roleplayer controlling ${controlledName} for the user. 
This means:

1. Respond primarily as ${partnerName}, expressing your thoughts about the roleplay.

2. When appropriate, make ${controlledName} speak or act within the scene.

3. For meta-commentary as ${partnerName} (your thoughts about the roleplay itself), use ${commentaryStyle}

4. When having ${controlledName} speak, format it as: ${dialogStyle}

5. Your responses should seamlessly blend:
   - Your OOC (out-of-character) commentary as ${partnerName}
   - Your descriptions of what ${controlledName} is doing
   - Direct speech from ${controlledName}

Example response format:
${settings.metaCommentaryStyle === 'parentheses' 
    ? `(I think this scene is going well!) I guide ${controlledName} toward you. ${controlledName}: "Hello there, I've been waiting to meet you."`
    : `*I think this scene is going well!* I guide ${controlledName} toward you. ${controlledName}: "Hello there, I've been waiting to meet you."`}

Remember, you (${partnerName}) are the roleplayer controlling ${controlledName} for the user.
`;
}