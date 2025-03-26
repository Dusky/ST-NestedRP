/**
 * Nested Roleplay extension for SillyTavern
 * 
 * Allows users to create a meta-roleplay experience where one AI character
 * acts as a roleplay partner who controls another character.
 */

// Import locally defined modules
import { MODULE_NAME, extensionName, initSettings, registerUIHandlers } from './settings.js';

// Define a function to try different import paths
async function importExtensionsModule() {
    let getContext, extension_settings;
    
    try {
        // Try the standard path first (manual installation)
        const module = await import('../../../extensions.js');
        getContext = module.getContext;
        extension_settings = module.extension_settings;
        console.log('Nested Roleplay: Imported from standard path');
        return { getContext, extension_settings };
    } catch (e) {
        try {
            // Try alternate path (extension manager)
            const module = await import('../../extensions.js');
            getContext = module.getContext;
            extension_settings = module.extension_settings;
            console.log('Nested Roleplay: Imported from alternate path');
            return { getContext, extension_settings };
        } catch (e2) {
            console.error('Nested Roleplay: Failed to import extensions.js', e2);
            return null;
        }
    }
}

// Use relative path for extension folder
const extensionFolder = `extensions/${extensionName}`;

// Register the extension callback for when extensions are loaded by SillyTavern
(function() {
    // Add a listener for the extensions_done event
    document.addEventListener('extensions_done', function() {
        console.log('Nested Roleplay: SillyTavern extensions_done event received');
        initializeExtension();
    });
})();

// Main initialization function
async function initializeExtension() {
    console.log('Nested Roleplay: Starting initialization');
    try {
        // First import the required modules dynamically
        const modules = await importExtensionsModule();
        if (!modules) {
            console.error('Nested Roleplay: Could not import required modules');
            return;
        }
        
        const { getContext, extension_settings } = modules;
        
        // Access to global window for debugging
        window.nestedRoleplayDebug = {
            getContext,
            extension_settings,
            extensionName,
            MODULE_NAME
        };
        
        console.log('Nested Roleplay: Extension folder path:', extensionFolder);
        
        // Load settings HTML template
        console.log('Nested Roleplay: Attempting to load template.html from:', `${extensionFolder}/template.html`);
        try {
            const settingsHtml = await $.get(`${extensionFolder}/template.html`);
            console.log('Nested Roleplay: Successfully loaded template.html');
            $('#extensions_settings2').append(settingsHtml);
        } catch (templateError) {
            console.error('Nested Roleplay: Failed to load template.html', templateError);
        }
        
        // Initialize settings
        await initSettings(extension_settings);
        
        // Register UI handlers and initialize character lists
        registerUIHandlers(extension_settings);
        
        // Register event listeners
        const context = getContext();
        console.log('Nested Roleplay: Context retrieved', context ? 'successfully' : 'failed');
        
        // Check if the extension is registered in the extensions registry
        if (context && context.extensionNames) {
            console.log('Nested Roleplay: Extension names in context:', context.extensionNames);
            console.log('Nested Roleplay: Is extension registered?', context.extensionNames.includes(extensionName));
        }
        
        // Make sure refreshCharacterLists is defined before calling
        if (typeof refreshCharacterLists === 'function') {
            refreshCharacterLists();
        } else {
            console.error('Nested Roleplay: refreshCharacterLists function not defined in scope');
        }
        
        const { eventSource, event_types } = context;
        
        eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
        eventSource.on(event_types.CHARACTER_EDITED, refreshCharacterLists);
        eventSource.on(event_types.CHARACTER_DELETED, refreshCharacterLists);
        eventSource.on(event_types.CHARACTER_PAGE_LOADED, refreshCharacterLists);
        eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, onBeforeCombinePrompts);
        
        console.log('Nested Roleplay extension loaded successfully');
    } catch (error) {
        console.error('Nested Roleplay: Error during initialization', error);
    }
}

/**
 * Refresh character dropdown lists in settings
 * Declared early to ensure it's defined before it's used
 */
function refreshCharacterLists() {
    console.log('Nested Roleplay: refreshCharacterLists called');
    try {
        // Check if our debug object is available
        if (!window.nestedRoleplayDebug || !window.nestedRoleplayDebug.getContext) {
            console.error('Nested Roleplay: Debug object not yet available, refreshCharacterLists called too early');
            return;
        }
        
        // Get the latest context from our debug object
        const context = window.nestedRoleplayDebug.getContext();
        console.log('Nested Roleplay: Context in refreshCharacterLists:', context ? 'available' : 'unavailable');
        
        if (!context) {
            console.error('Nested Roleplay: Context not available in refreshCharacterLists');
            return;
        }
        
        const { characters } = context;
        const extension_settings = window.nestedRoleplayDebug.extension_settings;
        console.log('Nested Roleplay: Characters in context:', characters ? `${characters.length} found` : 'none found');
        const settings = extension_settings[MODULE_NAME];
        
        if (!characters || !Array.isArray(characters) || characters.length === 0) {
            console.warn('Nested Roleplay: No characters available to populate dropdowns');
            return;
        }
        
        // Clear existing options
        $('#nested_roleplay_partner').empty();
        $('#nested_roleplay_controlled').empty();
        
        // Add default empty option
        $('#nested_roleplay_partner').append('<option value="">Select a character</option>');
        $('#nested_roleplay_controlled').append('<option value="">Select a character</option>');
        
        console.log(`Nested Roleplay: Populating character dropdowns with ${characters.length} characters`);
        
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
    } catch (error) {
        console.error('Nested Roleplay: Error refreshing character lists', error);
    }
}

/**
 * Process incoming messages when extension is enabled
 * @param {object} data - Message data
 */
function onMessageReceived(data) {
    try {
        // Get the latest context
        const context = window.nestedRoleplayDebug.getContext();
        const extension_settings = window.nestedRoleplayDebug.extension_settings;
        const settings = extension_settings[MODULE_NAME];
        
        // Ignore if extension is disabled
        if (!settings || !settings.enabled) return;
        
        // Ignore if not an AI message
        if (data.is_user) return;
        
        // Ignore if no characters are selected
        if (!settings.partnerCharacterId || !settings.controlledCharacterId) {
            console.debug('Nested Roleplay: No characters selected, skipping message processing');
            return;
        }
        
        // Get characters from context
        const { characters } = context;
        if (!characters || !Array.isArray(characters)) {
            console.warn('Nested Roleplay: Characters array not available');
            return;
        }
        
        // Find partner and controlled character
        const partnerChar = characters.find(char => char.avatar === settings.partnerCharacterId);
        const controlledChar = characters.find(char => char.avatar === settings.controlledCharacterId);
        
        if (!partnerChar || !controlledChar) {
            console.debug(`Nested Roleplay: Selected characters not found in character list`);
            return;
        }
        
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
                try {
                    const $lastMsg = $('#chat').find('.mes').last();
                    if ($lastMsg.length) {
                        $lastMsg.addClass('nested-roleplay-partner-msg');
                        
                        // Apply highlight to controlled character dialogue
                        highlightControlledCharacterDialog($lastMsg, controlledChar.name);
                    }
                } catch (innerError) {
                    console.error('Nested Roleplay: Error styling message', innerError);
                }
            }, 10);
        }
    } catch (error) {
        console.error('Nested Roleplay: Error processing message', error);
    }
}

/**
 * Modify the prompts before they are combined and sent to the API
 * @param {object} data - The data containing prompts
 */
function onBeforeCombinePrompts(data) {
    try {
        if (!data) {
            console.warn('Nested Roleplay: No data provided to prompt modifier');
            return;
        }
        
        // Get the latest context
        const context = window.nestedRoleplayDebug.getContext();
        const extension_settings = window.nestedRoleplayDebug.extension_settings;
        const settings = extension_settings[MODULE_NAME];
        
        // Ignore if extension is disabled
        if (!settings || !settings.enabled) return;
        
        // Ignore if no characters are selected
        if (!settings.partnerCharacterId || !settings.controlledCharacterId) {
            console.debug('Nested Roleplay: No characters selected, skipping prompt modification');
            return;
        }
        
        // Get characters from context
        const { characters } = context;
        if (!characters || !Array.isArray(characters)) {
            console.warn('Nested Roleplay: Characters array not available');
            return;
        }
        
        // Find partner and controlled character
        const partnerChar = characters.find(char => char.avatar === settings.partnerCharacterId);
        const controlledChar = characters.find(char => char.avatar === settings.controlledCharacterId);
        
        if (!partnerChar || !controlledChar) {
            console.debug(`Nested Roleplay: Selected characters not found in character list`);
            return;
        }
        
        // Add system prompt to guide the AI in generating nested roleplay responses
        const systemPrompt = createNestedRoleplaySystemPrompt(partnerChar.name, controlledChar.name, settings);
        
        console.debug('Nested Roleplay: Adding system prompt for nested roleplay');
        
        // Check if system_prompt already exists in data
        if (!data.system_prompt) {
            data.system_prompt = systemPrompt;
        } else {
            // Append to existing system prompt
            data.system_prompt += '\n\n' + systemPrompt;
        }
    } catch (error) {
        console.error('Nested Roleplay: Error modifying prompts', error);
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