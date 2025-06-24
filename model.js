// MNIST Neural Network Model Implementation
class MNISTModel {
    constructor() {
        this.model = null;
        this.weights = null;
        this.isLoaded = false;
    }

    async loadWeights() {
        try {
            console.log('Loading pre-trained weights...');

            // Check if TensorFlow.js is available
            if (typeof tf === 'undefined') {
                console.log('TensorFlow.js not available, using fallback pattern matching');
                this.isLoaded = true;
                return;
            }

            // Load weights from weights.js
            if (typeof MNIST_WEIGHTS === 'undefined') {
                console.log('MNIST_WEIGHTS not found, using fallback pattern matching');
                this.isLoaded = true;
                return;
            }

            this.weights = MNIST_WEIGHTS;
            await this.buildModel();

            this.isLoaded = true;
            console.log('Model weights loaded successfully!');

        } catch (error) {
            console.error('Error loading weights:', error);
            console.log('Falling back to pattern matching...');
            this.isLoaded = true;
        }
    }

    async buildModel() {
        try {
            console.log('Building TensorFlow.js model...');

            // Create a simple neural network model
            // Architecture: 784 -> 128 -> 64 -> 10
            this.model = tf.sequential({
                layers: [
                    // Input layer (flatten 28x28 to 784)
                    tf.layers.flatten({ inputShape: [28, 28, 1] }),

                    // First hidden layer
                    tf.layers.dense({
                        units: 128,
                        activation: 'relu',
                        kernelInitializer: 'glorotUniform'
                    }),

                    // Dropout for regularization
                    tf.layers.dropout({ rate: 0.2 }),

                    // Second hidden layer
                    tf.layers.dense({
                        units: 64,
                        activation: 'relu',
                        kernelInitializer: 'glorotUniform'
                    }),

                    // Dropout for regularization
                    tf.layers.dropout({ rate: 0.2 }),

                    // Output layer
                    tf.layers.dense({
                        units: 10,
                        activation: 'softmax'
                    })
                ]
            });

            // Set the pre-trained weights if available
            if (this.weights) {
                await this.setWeights();
            }

            // Compile the model
            this.model.compile({
                optimizer: tf.train.adam(0.001),
                loss: 'categoricalCrossentropy',
                metrics: ['accuracy']
            });

            console.log('Model built and compiled successfully!');

        } catch (error) {
            console.error('Error building model:', error);
            console.log('Falling back to simple neural network...');
            this.model = null;
        }
    }

    async setWeights() {
        try {
            // Convert weight arrays to tensors and set them
            const weightTensors = [];

            // Layer 1: Dense layer weights and biases
            weightTensors.push(tf.tensor2d(this.weights.dense_1.weights, [784, 128]));
            weightTensors.push(tf.tensor1d(this.weights.dense_1.biases));

            // Layer 2: Dense layer weights and biases
            weightTensors.push(tf.tensor2d(this.weights.dense_2.weights, [128, 64]));
            weightTensors.push(tf.tensor1d(this.weights.dense_2.biases));

            // Layer 3: Output layer weights and biases
            weightTensors.push(tf.tensor2d(this.weights.dense_3.weights, [64, 10]));
            weightTensors.push(tf.tensor1d(this.weights.dense_3.biases));

            // Set weights to the model
            this.model.setWeights(weightTensors);

            console.log('Pre-trained weights loaded successfully!');

        } catch (error) {
            console.error('Error setting weights:', error);
            console.log('Using random initialization...');
        }
    }

    async predict(imageData) {
        if (!this.isLoaded) {
            throw new Error('Model not loaded. Please wait for model initialization.');
        }

        try {
            // Try TensorFlow.js prediction first
            if (this.model && typeof tf !== 'undefined') {
                return await this.predictWithTensorFlow(imageData);
            } else if (this.weights) {
                // Fallback to simple prediction with weights
                return await this.predictSimple(imageData);
            } else {
                // Final fallback to pattern matching
                return this.predictWithPatterns(imageData);
            }

        } catch (error) {
            console.error('Prediction error:', error);
            // Fallback to pattern matching
            return this.predictWithPatterns(imageData);
        }
    }

    async predictWithTensorFlow(imageData) {
        // Reshape input data to [1, 28, 28, 1]
        const inputTensor = tf.tensor4d(imageData, [1, 28, 28, 1]);

        // Make prediction
        const prediction = this.model.predict(inputTensor);

        // Get probabilities
        const probabilities = await prediction.data();

        // Find predicted class
        const predictedClass = probabilities.indexOf(Math.max(...probabilities));

        // Clean up tensors
        inputTensor.dispose();
        prediction.dispose();

        return {
            predictedClass: predictedClass,
            probabilities: Array.from(probabilities)
        };
    }

    async predictSimple(imageData) {
        try {
            // Simple matrix multiplication approach
            const flattened = Array.from(imageData);

            // Layer 1: 784 -> 128
            const hidden1 = this.denseLayer(flattened, this.weights.dense_1.weights, this.weights.dense_1.biases);
            const activated1 = hidden1.map(x => Math.max(0, x)); // ReLU

            // Layer 2: 128 -> 64
            const hidden2 = this.denseLayer(activated1, this.weights.dense_2.weights, this.weights.dense_2.biases);
            const activated2 = hidden2.map(x => Math.max(0, x)); // ReLU

            // Layer 3: 64 -> 10
            const output = this.denseLayer(activated2, this.weights.dense_3.weights, this.weights.dense_3.biases);

            // Softmax activation
            const probabilities = this.softmax(output);

            // Find predicted class
            const predictedClass = probabilities.indexOf(Math.max(...probabilities));

            return {
                predictedClass: predictedClass,
                probabilities: probabilities
            };

        } catch (error) {
            console.error('Simple prediction error:', error);
            return this.predictWithPatterns(imageData);
        }
    }

    predictWithPatterns(imageData) {
        // Extract basic features from the image
        const features = this.extractFeatures(imageData);

        // Simple pattern matching based on features
        let bestDigit = 0;
        let bestScore = 0;
        const probabilities = new Array(10).fill(0.1);

        // Pattern matching logic based on visual features
        if (features.circular > 0.6) {
            // Likely 0, 6, 8, 9
            probabilities[0] += 0.3;
            probabilities[6] += 0.2;
            probabilities[8] += 0.3;
            probabilities[9] += 0.2;
        }

        if (features.vertical > 0.7) {
            // Likely 1, 4, 7
            probabilities[1] += 0.4;
            probabilities[4] += 0.2;
            probabilities[7] += 0.2;
        }

        if (features.horizontal > 0.5) {
            // Likely 2, 3, 5, 7
            probabilities[2] += 0.2;
            probabilities[3] += 0.2;
            probabilities[5] += 0.2;
            probabilities[7] += 0.1;
        }

        if (features.corners > 0.4) {
            // Likely 4, 7
            probabilities[4] += 0.3;
            probabilities[7] += 0.2;
        }

        if (features.density > 0.6) {
            // Dense digits like 8
            probabilities[8] += 0.2;
        }

        // Normalize probabilities
        const sum = probabilities.reduce((a, b) => a + b, 0);
        const normalizedProbs = probabilities.map(p => p / sum);

        // Find best prediction
        bestDigit = normalizedProbs.indexOf(Math.max(...normalizedProbs));

        return {
            predictedClass: bestDigit,
            probabilities: normalizedProbs
        };
    }

    extractFeatures(imageData) {
        const features = {
            circular: 0,
            vertical: 0,
            horizontal: 0,
            corners: 0,
            density: 0
        };

        let totalPixels = 0;
        let activePixels = 0;

        // Analyze pixel patterns
        for (let row = 1; row < 27; row++) {
            for (let col = 1; col < 27; col++) {
                const idx = row * 28 + col;
                const pixel = imageData[idx];
                totalPixels++;

                if (pixel > 0.3) {
                    activePixels++;

                    // Check for vertical lines
                    if (imageData[(row-1) * 28 + col] > 0.3 && imageData[(row+1) * 28 + col] > 0.3) {
                        features.vertical += pixel;
                    }

                    // Check for horizontal lines
                    if (imageData[row * 28 + (col-1)] > 0.3 && imageData[row * 28 + (col+1)] > 0.3) {
                        features.horizontal += pixel;
                    }

                    // Check for circular patterns
                    const centerX = 14, centerY = 14;
                    const distance = Math.sqrt((row - centerY) ** 2 + (col - centerX) ** 2);
                    if (distance >= 6 && distance <= 12) {
                        features.circular += pixel * 0.5;
                    }

                    // Check for corners
                    if ((row < 8 || row > 20) && (col < 8 || col > 20)) {
                        features.corners += pixel;
                    }
                }
            }
        }

        // Normalize features
        features.density = activePixels / totalPixels;
        if (activePixels > 0) {
            features.vertical /= activePixels;
            features.horizontal /= activePixels;
            features.circular /= activePixels;
            features.corners /= activePixels;
        }

        return features;
    }

    denseLayer(input, weights, biases) {
        const output = [];
        const numOutputs = biases.length;
        const numInputs = input.length;

        for (let i = 0; i < numOutputs; i++) {
            let sum = biases[i];
            for (let j = 0; j < numInputs; j++) {
                sum += input[j] * weights[j][i];
            }
            output.push(sum);
        }

        return output;
    }

    softmax(logits) {
        const maxLogit = Math.max(...logits);
        const scores = logits.map(l => Math.exp(l - maxLogit));
        const sum = scores.reduce((a, b) => a + b);
        return scores.map(s => s / sum);
    }

    // Model information
    getModelInfo() {
        return {
            architecture: '784 -> 128 -> 64 -> 10',
            inputSize: '28x28 pixels',
            outputClasses: 10,
            activations: ['ReLU', 'ReLU', 'Softmax'],
            totalParameters: 784 * 128 + 128 + 128 * 64 + 64 + 64 * 10 + 10
        };
    }

    // Dispose of model resources
    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
        this.isLoaded = false;
        console.log('Model resources disposed.');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MNISTModel;
}