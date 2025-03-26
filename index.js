/**
 * Nested Roleplay extension for SillyTavern
 */

// Module name for settings
const MODULE_NAME = 'nested_roleplay';

// Initialize extension when document is fully loaded
jQuery(async function() {
    try {
        console.log('Nested Roleplay: Starting initialization');
        
        // Get SillyTavern context
        const context = SillyTavern.getContext();
        const { extension_settings, saveSettingsDebounced, eventSource, event_types } = context;
        
        // Default settings
        const defaultSettings = {
            enabled: false,
            partnerCharacterId: '',
            controlledCharacterId: '',
            showPartnerName: true,
            allowMetaCommentary: true,
            metaCommentaryStyle: 'parentheses', // 'parentheses' or 'asterisks'
            controlledCharDialog: 'quotes', // 'quotes' or 'none'
        };
        
        // Initialize settings
        if (!extension_settings[MODULE_NAME]) {
            extension_settings[MODULE_NAME] = {};
        }
        
        // Set default values for settings that don't exist
        for (const key in defaultSettings) {
            if (extension_settings[MODULE_NAME][key] === undefined) {
                extension_settings[MODULE_NAME][key] = defaultSettings[key];
            }
        }
        
        // Load settings HTML template - use fetch to avoid path issues
        try {
            // Try to fetch the HTML template using current script path
            const scriptElement = document.currentScript;
            let templatePath;
            
            if (scriptElement) {
                // Get the directory containing this script
                const scriptPath = scriptElement.src;
                const scriptDir = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
                templatePath = `${scriptDir}/template.html`;
                console.log('Nested Roleplay: Attempting to load template from:', templatePath);
            } else {
                // Fallback paths to try
                const possiblePaths = [
                    '/scripts/extensions/third-party/rppal/template.html',
                    '/extensions/rppal/template.html',
                    './template.html'
                ];
                
                templatePath = possiblePaths[0];
                console.log('Nested Roleplay: Attempting to load template from fallback paths');
            }
            
            const response = await fetch(templatePath);
            if (response.ok) {
                const settingsHtml = await response.text();
                $('#extensions_settings2').append(settingsHtml);
                console.log('Nested Roleplay: Successfully loaded template.html');
            } else {
                throw new Error(`Failed to load template: ${response.status}`);
            }
        } catch (error) {
            console.error('Nested Roleplay: Error loading settings HTML', error);
            
            // Fallback: use hard-coded template
            console.log('Nested Roleplay: Using fallback HTML template');
            const fallbackHtml = `
            <div id="nested_roleplay_settings" class="settings-container extension_settings">
                <div class="inline-drawer">
                    <div class="inline-drawer-toggle inline-drawer-header">
                        <b>Nested Roleplay</b>
                        <div class="inline-drawer-icon fa-solid fa-chevron-down"></div>
                    </div>
                    <div class="inline-drawer-content">
                        <div class="nested-roleplay-container">
                            <div class="flex-container flexFlowColumn">
                                <label class="checkbox_label">
                                    <input type="checkbox" id="nested_roleplay_enabled" />
                                    <span>Enable Nested Roleplay</span>
                                </label>
                                
                                <div class="nested-roleplay-row flex-container alignitemsBaseline">
                                    <div class="nested-roleplay-label">Roleplay Partner:</div>
                                    <select id="nested_roleplay_partner" class="text_pole"></select>
                                </div>
                                
                                <div class="nested-roleplay-row flex-container alignitemsBaseline">
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
                                
                                <div class="nested-roleplay-row flex-container alignitemsBaseline">
                                    <div class="nested-roleplay-label">Commentary style:</div>
                                    <select id="nested_roleplay_commentary_style" class="text_pole">
                                        <option value="parentheses">Parentheses: (like this)</option>
                                        <option value="asterisks">Asterisks: *like this*</option>
                                    </select>
                                </div>
                                
                                <div class="nested-roleplay-row flex-container alignitemsBaseline">
                                    <div class="nested-roleplay-label">Character dialog:</div>
                                    <select id="nested_roleplay_dialog_style" class="text_pole">
                                        <option value="quotes">Quotes: "like this"</option>
                                        <option value="none">No quotes</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>`;
            $('#extensions_settings2').append(fallbackHtml);
        }
        
        // Register UI handlers
        registerUIHandlers();
        
        // Register event listeners
        eventSource.on(event_types.MESSAGE_RECEIVED, onMessageReceived);
        eventSource.on(event_types.CHARACTER_EDITED, refreshCharacterLists);
        eventSource.on(event_types.CHARACTER_DELETED, refreshCharacterLists);
        eventSource.on(event_types.CHARACTER_PAGE_LOADED, refreshCharacterLists);
        eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, onBeforeCombinePrompts);
        
        // Initial character list population
        refreshCharacterLists();
        
        console.log('Nested Roleplay extension loaded successfully');
    } catch (error) {
        console.error('Nested Roleplay: Error during initialization', error);
    }
    
    /**
     * Register UI event handlers
     */
    function registerUIHandlers() {
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
    
    /**
     * Refresh character dropdown lists in settings
     */
    function refreshCharacterLists() {
        try {
            const { characters } = context;
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
});