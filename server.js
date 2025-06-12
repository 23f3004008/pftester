const express = require('express');
const bodyParser = require('body-parser');
const yaml = require('js-yaml');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');
const Convert = require('ansi-to-html');

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// Configure ansi-to-html with options to preserve colors and formatting
const convert = new Convert({
    fg: '#FFF',
    bg: '#000',
    newline: true,
    escapeXML: true,
    stream: true,
    colors: {
        0: '#000000',
        1: '#FF0000',
        2: '#00FF00',
        3: '#FFFF00',
        4: '#0000FF',
        5: '#FF00FF',
        6: '#00FFFF',
        7: '#FFFFFF',
        8: '#808080',
        9: '#FF0000',
        10: '#00FF00',
        11: '#FFFF00',
        12: '#0000FF',
        13: '#FF00FF',
        14: '#00FFFF',
        15: '#FFFFFF'
    }
});

// Store active SSE clients
let clients = [];

// SSE endpoint
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    const client = {
        id: Date.now(),
        res
    };
    
    clients.push(client);
    
    req.on('close', () => {
        clients = clients.filter(c => c.id !== client.id);
    });
});

// Send event to all connected clients
function sendEvent(eventData) {
    let htmlContent = '';
    
    if (eventData.message) {
        // Process the message to fix spacing issues
        let message = eventData.message;
        
        // Convert ANSI to HTML
        htmlContent = convert.toHtml(message);
        
        // Clean up common issues with promptfoo output
        htmlContent = htmlContent
            // Fix extra newlines
            .replace(/\n\n+/g, '\n')
            // Fix table borders to be more compact
            .replace(/─+┼─+┼─+┼─+/g, match => match.replace(/─/g, '━'))
            // Make box drawing characters more prominent
            .replace(/[│├┤┬┴┼]/g, match => `<span style="color:#aaa">${match}</span>`);
    }
    
    clients.forEach(client => {
        client.res.write(`data: ${JSON.stringify({ ...eventData, html: htmlContent })}\n\n`);
    });
}

app.post('/update-config', (req, res) => {
    const { apiUrl, apiKey } = req.body;
    
    try {
        // Read the YAML file
        const yamlPath = path.join(__dirname, 'checkos.yaml');
        const fileContents = fs.readFileSync(yamlPath, 'utf8');
        
        // First, replace the placeholders in the raw content to preserve formatting
        let updatedContent = fileContents
            .replace(/url: userapiurl/, `url: ${apiUrl}`)
            .replace(/Bearer userapikey/, `Bearer ${apiKey}`);
        
        // Write the updated content back to the file
        fs.writeFileSync(yamlPath, updatedContent, 'utf8');
        
        // Log the changes
        console.log(`Updated API URL to: ${apiUrl}`);
        console.log(`Updated API Key (first 10 chars): ${apiKey.substring(0, 10)}...`);
        
        // Run promptfoo command using spawn to get real-time output
        console.log('Starting evaluation...');
        sendEvent({ type: 'start', message: 'Starting evaluation...\n' });

        // Set a wider terminal width for better formatting
        const child = spawn('npx', ['promptfoo', 'eval', '--config', 'checkos.yaml', '--no-cache'], {
            shell: true,
            env: { 
                ...process.env, 
                FORCE_COLOR: 'true',
                COLUMNS: '200', // Set a wider terminal width
                TERM: 'xterm-256color'
            }
        });

        // Send initial response
        res.json({ message: 'Evaluation started' });

        let buffer = '';
        
        // Handle stdout with buffering for complete lines
        child.stdout.on('data', (data) => {
            buffer += data.toString();
            
            // Process buffer in chunks to maintain formatting
            if (buffer.includes('\n')) {
                const lines = buffer.split('\n');
                buffer = lines.pop() || '';
                
                if (lines.length > 0) {
                    const output = lines.join('\n') + '\n';
                    console.log(output);
                    sendEvent({ type: 'output', message: output });
                }
            }
        });

        // Handle stderr
        child.stderr.on('data', (data) => {
            const error = data.toString();
            console.error(error);
            sendEvent({ type: 'error', message: error });
        });

        // Handle process completion
        child.on('close', (code) => {
            // Send any remaining buffered content
            if (buffer) {
                sendEvent({ type: 'output', message: buffer });
            }
            
            const message = code === 0 ? '\nEvaluation completed successfully.\n' : '\nEvaluation failed.\n';
            console.log(message);
            sendEvent({ type: 'end', message, code });
        });

    } catch (error) {
        console.error(`Error: ${error}`);
        res.status(500).json({ error: error.message });
        sendEvent({ type: 'error', message: error.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 