# LLM Integration Guide

This document provides instructions on how to set up and use the LLM integration in the Collaborative Document Editor.

## Overview

The Collaborative Document Editor now supports real LLM integration using the OpenRouter API, which provides access to various language models including:

- Claude 3.7 Sonnet (claude-3-7-sonnet-20250219)
- GPT-4.1 (gpt-4.1-2025-04-14)

## Setup

### 1. Get an OpenRouter API Key

1. Visit [OpenRouter](https://openrouter.ai/) and create an account
2. Generate an API key from your dashboard
3. Copy the API key

### 2. Configure the API Key

1. Open the `.env` file in the `backend` directory
2. Replace `your_openrouter_api_key_here` with your actual OpenRouter API key:

```
OPENROUTER_API_KEY=your_actual_api_key_here
```

### 3. Install Dependencies

Make sure all required dependencies are installed:

```bash
cd backend
pip install -r requirements.txt
```

## Using the LLM Integration

### Model Selection

The chat panel now includes a dropdown menu that allows you to select which LLM model to use:

1. **Claude 3.7 Sonnet** - Default model, good for general-purpose tasks
2. **GPT-4.1** - Alternative model with different capabilities

The selected model will be used for all subsequent messages in the chat until you change it.

### How It Works

1. When you send a message, the selected model is sent to the backend along with your message
2. The backend calls the OpenRouter API with the appropriate model ID
3. The response from the LLM is processed and returned to the frontend
4. The AI's response and any document suggestions are displayed in the chat panel

## Troubleshooting

### API Key Issues

If you see an error message like "OpenRouter API key not found" or "Error calling OpenRouter API":

1. Check that your API key is correctly set in the `.env` file
2. Ensure the backend server was restarted after updating the `.env` file
3. Verify that your OpenRouter account is active and has sufficient credits

### Model Selection Issues

If the model selection doesn't seem to be working:

1. Check the browser console for any errors
2. Verify that the backend is receiving the model parameter by checking the server logs
3. Try selecting a different model to see if the issue persists

## Adding More Models

To add more models to the selection dropdown:

1. Update the `AVAILABLE_MODELS` object in `ai_assistant.py` with the new model ID and its OpenRouter path
2. Update the `AVAILABLE_MODELS` array in `ChatPanel.tsx` with the new model ID and display name
