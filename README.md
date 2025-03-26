# Nested Roleplay Extension for SillyTavern

This extension allows users to create a meta-roleplay experience where one AI character acts as a roleplay partner who controls another character.

## Features

- Select two characters from your library - one to serve as your roleplay partner and another for that partner to control
- Partner character can make meta-commentary about the roleplay (shown in parentheses or asterisks)
- Partner character can control and speak as the other character
- Visual styling to distinguish between partner commentary and controlled character dialogue
- Automatic system prompt injection to guide the AI in generating appropriate nested roleplay responses
- Customizable appearance and behavior

## Installation

1. Download or clone this repository
2. Create a folder named `nested-roleplay` in your SillyTavern's `public/extensions` directory
3. Copy all files from this repository into that folder
4. Restart SillyTavern or refresh the page
5. Enable the extension in the Extensions tab

## Usage

1. Open SillyTavern and navigate to the Extensions tab
2. Enable the "Nested Roleplay" extension
3. Select one character as your roleplay partner
4. Select another character that your partner will control
5. Configure the extension settings according to your preferences:
   - Show partner name: Displays the partner's name at the beginning of messages
   - Allow meta-commentary: Lets your partner make comments about the roleplay
   - Commentary style: Choose between parentheses or asterisks for meta-commentary
   - Character dialog: Choose whether to use quotes for the controlled character's dialogue

## Prompting Tips

To get the best results with this extension, you should explain to your AI character what you want them to do. Here's an example prompt you can use:

```
In this roleplay, you'll be acting as yourself, [Partner Character], who is controlling the character [Controlled Character]. 

You should:
1. Respond as yourself, making comments about the roleplay in (parentheses)
2. When appropriate, make [Controlled Character] talk or act in the scene
3. Use quotes when [Controlled Character] speaks: [Controlled Character]: "Like this"
4. React to the player's actions as both yourself and through [Controlled Character]

For example, your message might look like:
(I think this is a great scene!) I guide [Controlled Character] to approach you. [Controlled Character]: "Hello there, I've been waiting to meet you."
```

## License

This extension is licensed under MIT License

## Credits

- Dusky - Developer
- SillyTavern Team - For creating the amazing platform that makes this extension possible