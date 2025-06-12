# promptfoo Evaluation Tool

A simple web interface to configure and run promptfoo evaluations for your RAG application.

## What This Tool Does

This tool helps you test and evaluate your RAG (Retrieval-Augmented Generation) application by:
1. Letting you configure your RAG API URL and API Key for authentication
2. Running tests to check if your RAG responses meet specific criteria
3. Showing the evaluation results directly in your browser

## Quick Start Guide

### Step 1: Install Requirements

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 14 or higher)
2. Open your terminal/command prompt
3. Navigate to this folder
4. Run this command to install dependencies:
   ```
   npm install
   ```

### Step 2: Get Your API Key

1. Visit [https://aiproxy.sanand.workers.dev/](https://aiproxy.sanand.workers.dev/)
2. Log in with your IITM email ID
3. Copy your API token

### Step 3: Start the Server

1. In the terminal, run:
   ```
   node server.js
   ```
2. You should see a message: `Server running on http://localhost:3000`

### Step 4: Use the Tool

1. Open your web browser and go to: `http://localhost:3000`
2. Enter the API URL of your RAG application (e.g., `http://localhost:8000/ask`)
3. Enter your API Key from aiproxy.sanand.workers.dev
4. Click "Run Evaluation"
5. Watch the results appear in real-time

## How It Works

1. The tool updates the `checkos.yaml` configuration file with your:
   - RAG application API URL (replaces `userapiurl` in the YAML)
   - API key (replaces `userapikey` in the YAML)
2. It then runs `promptfoo eval` to test your RAG application against predefined test cases
3. The results are streamed to your browser in real-time

## Troubleshooting

- **Nothing happens after clicking "Run Evaluation"**: Check that your API key is correct
- **Error messages appear**: Make sure your RAG application is running and the API URL is correct
- **Server won't start**: Make sure you've installed all dependencies with `npm install`

## Need Help?

If you encounter any issues, please check that:
1. Your RAG application is running and accessible at the URL you provided
2. You're using the correct API key from aiproxy.sanand.workers.dev
3. The server is running (you should see "Server running on http://localhost:3000" in your terminal) 