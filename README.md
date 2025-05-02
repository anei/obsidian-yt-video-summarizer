# YouTube Video Summarizer for Obsidian

Generate AI-powered summaries of YouTube videos directly in Obsidian using Google's Gemini AI.

## Demo

![Demo](assets/demo.gif)

## Features

-   🎥 Extract transcripts from YouTube videos
-   🤖 Generate summaries using various LLMs: Gemini, OpenAI, Anthropic (Claude), and other compatible models
-   📝 Create structured notes with key points
-   🔍 Identify and explain technical terms
-   📊 Format summaries with metadata and tags

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "YouTube Video Summarizer"
4. Install and enable the plugin

## Requirements

-   Obsidian v0.15.0+
-   API key for one of the supported LLM providers:
    -   Gemini API key ([Get one here](https://aistudio.google.com/app/apikey))
    -   OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
    -   Anthropic API key ([Get one here](https://console.anthropic.com/settings/keys))
    -   Key for any LLM provider, offering OpenAI or Antropic compatible API

## Configuration

1. Open plugin settings
2. Enter your Gemini API key
3. Select preferred model
4. Customize summary prompt (optional)

## Usage

### Method 1: Command Palette

1. Copy YouTube URL
2. Open command palette (`Ctrl/Cmd + P`)
3. Search for "Summarize YouTube Video"
4. Paste URL when prompted

### Method 2: Selection

1. Paste YouTube URL in note
2. Select the URL
3. Use command palette or context menu to summarize

## Output Format

```markdown
# Video Title

[Video thumbnail]

## Summary

[AI-generated summary]

## Key Points

-   Point 1
-   Point 2

## Technical Terms

-   Term 1: Definition
-   Term 2: Definition

## Conclusion

[Summary conclusion]
```

## License

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
