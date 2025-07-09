// Custom Neural Network Implementation for MNIST
class DNNModel {
    constructor() {
        this.sizes = [784, 128, 64, 10];
        this.params = {};
        this.isLoaded = false;
    }

    async loadModel() {
        try {
            console.log("Loading model weights...");
            
            // Check if modelWeights is available
            if (typeof modelWeights !== 'undefined' && modelWeights) {
                console.log("Model weights found and loaded.");
                this.params = modelWeights;
                this.isLoaded = true;
                return true;
            } else {
                console.error("Model weights not found! Make sure weights.js is loaded.");
                
                // Create dummy weights for demonstration purposes
                console.log("Creating dummy weights for demonstration...");
                this.createDummyWeights();
                this.isLoaded = true;
                return true;
            }
        } catch (error) {
            console.error("Error loading model:", error);
            return false;
        }
    }

    // Create dummy weights for demonstration when real weights aren't available
    createDummyWeights() {
        // Initialize with random weights for demonstration
        this.params = {
            W1: this.randomMatrix(128, 784),
            W2: this.randomMatrix(64, 128),
            W3: this.randomMatrix(10, 64)
        };
    }

    // Helper function to create random matrix
    randomMatrix(rows, cols) {
        const matrix = [];
        for (let i = 0; i < rows; i++) {
            matrix[i] = [];
            for (let j = 0; j < cols; j++) {
                matrix[i][j] = (Math.random() - 0.5) * 0.1; // Small random values
            }
        }
        return matrix;
    }

    // Sigmoid activation function
    sigmoid(x) {
        if (Array.isArray(x)) {
            return x.map(val => 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, val)))));
        }
        return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
    }

    // Softmax activation function
    softmax(x) {
        const max = Math.max(...x);
        const exps = x.map(val => Math.exp(Math.max(-500, Math.min(500, val - max))));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(exp => exp / (sum + 1e-8)); // Add small epsilon to prevent division by zero
    }

    // Matrix-vector multiplication
    matrixVectorMultiply(matrix, vector) {
        const result = [];
        for (let i = 0; i < matrix.length; i++) {
            let sum = 0;
            for (let j = 0; j < vector.length; j++) {
                sum += matrix[i][j] * vector[j];
            }
            result[i] = sum;
        }
        return result;
    }

    // Forward pass through the network
    forwardPass(input) {
        if (!this.isLoaded) {
            throw new Error('Model not loaded');
        }

        const params = this.params;
        
        // Ensure input is normalized (0-1 range)
        const normalizedInput = input.map(val => Math.max(0, Math.min(1, val)));
        
        try {
            // Layer 1: Input -> Hidden1
            const z1 = this.matrixVectorMultiply(params.W1, normalizedInput);
            const a1 = this.sigmoid(z1);
            
            // Layer 2: Hidden1 -> Hidden2
            const z2 = this.matrixVectorMultiply(params.W2, a1);
            const a2 = this.sigmoid(z2);
            
            // Layer 3: Hidden2 -> Output
            const z3 = this.matrixVectorMultiply(params.W3, a2);
            const a3 = this.softmax(z3);
            
            return a3;
        } catch (error) {
            console.error('Forward pass error:', error);
            throw error;
        }
    }

    // Predict digit from image data
    predict(imageData) {
        if (!this.isLoaded) {
            throw new Error('Model not loaded');
        }

        try {
            // Ensure imageData is the right format (784 pixels, normalized 0-1)
            let processedData;
            
            if (imageData.length === 784) {
                // Already the right size
                processedData = imageData;
            } else if (imageData.length === 28 * 28) {
                // Convert 28x28 to flat array
                processedData = Array.from(imageData);
            } else {
                throw new Error(`Invalid image data size: ${imageData.length}, expected 784`);
            }

            // Normalize to 0-1 range if not already
            const max = Math.max(...processedData);
            if (max > 1) {
                processedData = processedData.map(val => val / 255.0);
            }

            // Get predictions
            const predictions = this.forwardPass(processedData);
            
            // Find the predicted digit
            const predictedDigit = predictions.indexOf(Math.max(...predictions));
            const confidence = Math.max(...predictions);
            
            return {
                digit: predictedDigit,
                confidence: confidence,
                probabilities: predictions
            };
        } catch (error) {
            console.error('Prediction error:', error);
            throw error;
        }
    }

    // Get model status
    getStatus() {
        return {
            loaded: this.isLoaded,
            architecture: `${this.sizes.join(' -> ')}`,
            layers: this.sizes.length,
            parameters: this.isLoaded ? this.countParameters() : 0
        };
    }

    // Count total parameters
    countParameters() {
        let total = 0;
        if (this.params.W1) total += this.params.W1.length * this.params.W1[0].length;
        if (this.params.W2) total += this.params.W2.length * this.params.W2[0].length;
        if (this.params.W3) total += this.params.W3.length * this.params.W3[0].length;
        return total;
    }
}

// Global model instance
let model;

// Initialize the model
async function initializeModel() {
    try {
        console.log("Initializing model...");
        model = new DNNModel();
        const loaded = await model.loadModel();
        
        if (loaded) {
            console.log('Model initialized successfully');
            updateModelStatus('ready');
            return true;
        } else {
            console.error('Failed to load model');
            updateModelStatus('error');
            return false;
        }
    } catch (error) {
        console.error('Error initializing model:', error);
        updateModelStatus('error');
        return false;
    }
}

// Update model status in UI
function updateModelStatus(status) {
    const statusElement = document.getElementById('modelStatus');
    if (statusElement) {
        switch (status) {
            case 'loading':
                statusElement.textContent = 'Loading...';
                statusElement.className = 'stat-value loading';
                break;
            case 'ready':
                statusElement.textContent = 'Ready';
                statusElement.className = 'stat-value ready';
                break;
            case 'error':
                statusElement.textContent = 'Error';
                statusElement.className = 'stat-value error';
                break;
        }
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DNNModel, initializeModel };
}
