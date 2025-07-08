// Custom Neural Network Implementation for MNIST
class DNNModel {
    constructor() {
        this.sizes = [784, 128, 64, 10];
        this.params = {};
        this.isLoaded = false;
    }

    async loadModel() {
        try {
            if (typeof modelWeights !== 'undefined' && modelWeights) {
                this.params = modelWeights;
                this.isLoaded = true;
                console.log('Model weights loaded successfully');
                return true;
            }
        } 
    }

    // Sigmoid activation function
    sigmoid(x) {
        if (Array.isArray(x)) {
            return x.map(val => 1 / (1 + Math.exp(-val)));
        }
        return 1 / (1 + Math.exp(-x));
    }

    // Softmax activation function
    softmax(x) {
        const max = Math.max(...x);
        const exps = x.map(val => Math.exp(val - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(exp => exp / sum);
    }

    // Matrix multiplication
    matrixMultiply(a, b) {
        const result = [];
        for (let i = 0; i < a.length; i++) {
            result[i] = [];
            for (let j = 0; j < b[0].length; j++) {
                let sum = 0;
                for (let k = 0; k < b.length; k++) {
                    sum += a[i][k] * b[k][j];
                }
                result[i][j] = sum;
            }
        }
        return result;
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
        
        // Ensure input is normalized (0-1 range to 0.01-0.99 range)
        const normalizedInput = input.map(val => val * 0.99 + 0.01);
        
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
