// Model weights storage
// This file will contain the trained weights from your Python model
// You'll need to export your trained model weights and paste them here

// Placeholder for model weights
// Replace this with your actual trained weights
let modelWeights = null;

// Example structure (you'll need to replace with your actual weights):
/*
modelWeights = {
    'W1': [
        // 128x784 matrix - weights from input layer (784) to first hidden layer (128)
        // Each row represents weights for one neuron in the hidden layer
        // You'll need to export this from your Python training code
    ],
    'W2': [
        // 64x128 matrix - weights from first hidden layer (128) to second hidden layer (64)
        // Each row represents weights for one neuron in the second hidden layer
    ],
    'W3': [
        // 10x64 matrix - weights from second hidden layer (64) to output layer (10)
        // Each row represents weights for one output class (digit 0-9)
    ]
};
*/

// If you have trained weights, uncomment and populate the structure above
// For now, the model will use random initialization

// Utility function to convert Python numpy array to JavaScript array
function convertNumpyToJS(numpyString) {
    // Helper function to parse numpy array string format
    // This is a simplified parser - you may need to adjust based on your exact format
    try {
        // Remove numpy array formatting
        const cleaned = numpyString
            .replace(/array\(/g, '')
            .replace(/\)/g, '')
            .replace(/\n/g, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        // Parse as JSON-like structure
        return JSON.parse(cleaned);
    } catch (error) {
        console.error('Error parsing numpy array:', error);
        return null;
    }
}

// Instructions for exporting weights from Python:
/*
To export your trained weights from Python, add this code to your training script:

```python
import json
import numpy as np

# After training your model (dnn.train(...))
# Convert numpy arrays to lists for JSON serialization
weights_data = {
    'W1': dnn.params['W1'].tolist(),
    'W2': dnn.params['W2'].tolist(),
    'W3': dnn.params['W3'].tolist()
}

# Save to JSON file
with open('model_weights.json', 'w') as f:
    json.dump(weights_data, f)

# Or print to console to copy-paste
print("modelWeights = {")
print(f"    'W1': {json.dumps(dnn.params['W1'].tolist())},")
print(f"    'W2': {json.dumps(dnn.params['W2'].tolist())},")
print(f"    'W3': {json.dumps(dnn.params['W3'].tolist())}")
print("};")
```

Then copy the output and replace the modelWeights variable above.
*/

// Example of how to load weights from external file
async function loadWeightsFromFile(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            throw new Error(`Failed to load weights: ${response.status}`);
        }
        const weights = await response.json();
        modelWeights = weights;
        console.log('Weights loaded from file:', filename);
        return true;
    } catch (error) {
        console.error('Error loading weights from file:', error);
        return false;
    }
}

// Function to validate weights structure
function validateWeights(weights) {
    if (!weights || typeof weights !== 'object') {
        return false;
    }
    
    // Check required keys
    const requiredKeys = ['W1', 'W2', 'W3'];
    for (const key of requiredKeys) {
        if (!weights[key] || !Array.isArray(weights[key])) {
            console.error(`Invalid or missing weight matrix: ${key}`);
            return false;
        }
    }
    
    // Check dimensions
    const expectedShapes = {
        'W1': [128, 784],
        'W2': [64, 128],
        'W3': [10, 64]
    };
    
    for (const [key, expectedShape] of Object.entries(expectedShapes)) {
        const matrix = weights[key];
        const actualShape = [matrix.length, matrix[0]?.length || 0];
        
        if (actualShape[0] !== expectedShape[0] || actualShape[1] !== expectedShape[1]) {
            console.error(`Invalid shape for ${key}: expected ${expectedShape}, got ${actualShape}`);
            return false;
        }
    }
    
    console.log('Weights validation passed');
    return true;
}

// Initialize weights on page load
document.addEventListener('DOMContentLoaded', function() {
    // Try to load weights from external file if available
    loadWeightsFromFile('model_weights.json').then(success => {
        if (success && validateWeights(modelWeights)) {
            console.log('External weights loaded successfully');
        } else {
            console.log('No external weights found or validation failed, using random initialization');
        }
    });
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { modelWeights, loadWeightsFromFile, validateWeights };
}