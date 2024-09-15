const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for better API access

const HUGGING_FACE_API_KEY = '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';

function getRandomSeed() {
  return Math.floor(Math.random() * 2147483647); 
}

async function query(data) {
  try {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev',
      data,
      {
        headers: {
          Authorization: `Bearer ${HUGGING_FACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );
    return response.data;
  } catch (error) {
    console.error('API Request Error:', error.message);
    throw new Error('Failed to fetch image from API');
  }
}

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>FLUX Prompt Interface</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f0f0f0;
            text-align: center;
            padding: 20px;
          }
          .container {
            max-width: 600px;
            margin: auto;
            padding: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
          input[type="text"] {
            width: 80%;
            padding: 10px;
            margin: 10px 0;
            border: 1px solid #ccc;
            border-radius: 5px;
          }
          button {
            padding: 10px 20px;
            border: none;
            background-color: #4caf50;
            color: white;
            border-radius: 5px;
            cursor: pointer;
          }
          button:hover {
            background-color: #45a049;
          }
          #loading {
            display: none;
            font-size: 18px;
            color: #666;
          }
          img {
            margin-top: 20px;
            max-width: 100%;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>FLUX Image Generator</h1>
          <p>Enter a prompt to generate an image:</p>
          <input type="text" id="prompt" placeholder="Enter your prompt here..." />
          <button onclick="generateImage()">Generate Image</button>
          <p id="loading">Processing your request, please wait...</p>
          <div id="result"></div>
        </div>
        <script>
          async function generateImage() {
            const prompt = document.getElementById('prompt').value;
            const loading = document.getElementById('loading');
            const result = document.getElementById('result');

            if (!prompt) {
              alert('Please enter a prompt');
              return;
            }

            loading.style.display = 'block';
            result.innerHTML = '';

            try {
              const response = await fetch(\`/flux?prompt=\${encodeURIComponent(prompt)}\`);

              if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                result.innerHTML = '<img src="' + url + '" alt="Generated Image" />';
              } else {
                result.innerText = 'Failed to generate image. Please try again.';
              }
            } catch (error) {
              console.error('Fetch Error:', error.message);
              result.innerText = 'An error occurred while processing your request.';
            } finally {
              loading.style.display = 'none';
            }
          }
        </script>
      </body>
    </html>
  `);
});

app.get('/flux', async (req, res) => {
  try {
    const { prompt } = req.query;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    const seed = getRandomSeed();
    const imageData = await query({ inputs: prompt, seed });

    res.setHeader('Content-Type', 'image/png');
    res.send(imageData);
  } catch (error) {
    console.error('Internal Server Error:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
