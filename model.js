// Improved MNIST Neural Network Model (closer to Python DNN logic)
class MNISTModel {
    constructor() {
        this.model = null;
        this.weights = null;
        this.isLoaded = false;
    }

    async loadWeights() {
        console.log("Loading pre-trained weights...");

        if (typeof tf === 'undefined') {
            console.warn("TensorFlow.js not found. Using simple prediction mode.");
            this.isLoaded = true;
            return;
        }

        if (typeof MNIST_WEIGHTS === 'undefined') {
            console.warn("MNIST_WEIGHTS not found. Using simple prediction mode.");
            this.isLoaded = true;
            return;
        }

        this.weights = MNIST_WEIGHTS;
        await this.buildModel();
        this.isLoaded = true;
        console.log("Model loaded.");
    }

    async buildModel() {
        this.model = tf.sequential();

        this.model.add(tf.layers.flatten({ inputShape: [28, 28, 1] }));
        this.model.add(tf.layers.dense({ units: 128, activation: 'sigmoid' }));
        this.model.add(tf.layers.dense({ units: 64, activation: 'sigmoid' }));
        this.model.add(tf.layers.dense({ units: 10, activation: 'softmax' }));

        this.model.compile({
            optimizer: tf.train.sgd(0.01),
            loss: 'categoricalCrossentropy',
            metrics: ['accuracy']
        });

        if (this.weights) {
            await this.setWeights();
        }
    }

    async setWeights() {
        try {
            const tensors = [
                tf.tensor2d(this.weights.W1, [784, 128]),
                tf.tensor1d(this.weights.b1),
                tf.tensor2d(this.weights.W2, [128, 64]),
                tf.tensor1d(this.weights.b2),
                tf.tensor2d(this.weights.W3, [64, 10]),
                tf.tensor1d(this.weights.b3)
            ];
            this.model.setWeights(tensors);
        } catch (e) {
            console.error("Error setting weights:", e);
        }
    }

    sigmoid(x) {
        return 1 / (1 + Math.exp(-x));
    }

    softmax(arr) {
        const max = Math.max(...arr);
        const exps = arr.map(x => Math.exp(x - max));
        const sum = exps.reduce((a, b) => a + b, 0);
        return exps.map(e => e / sum);
    }

    denseLayer(input, weights, biases, activation = null) {
        const output = [];
        for (let i = 0; i < biases.length; i++) {
            let sum = biases[i];
            for (let j = 0; j < input.length; j++) {
                sum += input[j] * weights[i][j];
            }
            if (activation === 'sigmoid') {
                sum = this.sigmoid(sum);
            }
            output.push(sum);
        }
        return output;
    }

    normalizeInput(imageData) {
        return imageData.map(x => (x / 255) * 0.99 + 0.01);
    }

    async predict(imageData) {
        if (!this.isLoaded) {
            throw new Error("Model not ready.");
        }

        if (this.model && typeof tf !== 'undefined') {
            return await this.predictWithTensorFlow(imageData);
        } else {
            return this.predictSimple(imageData);
        }
    }

    async predictWithTensorFlow(imageData) {
        const inputTensor = tf.tensor4d(imageData, [1, 28, 28, 1]);
        const prediction = this.model.predict(inputTensor);
        const probs = await prediction.data();
        const predictedClass = probs.indexOf(Math.max(...probs));

        inputTensor.dispose();
        prediction.dispose();

        return {
            predictedClass,
            probabilities: Array.from(probs)
        };
    }

    predictSimple(imageData) {
        const input = this.normalizeInput(Array.from(imageData));

        let hidden1 = this.denseLayer(input, this.weights.W1, this.weights.b1, 'sigmoid');
        let hidden2 = this.denseLayer(hidden1, this.weights.W2, this.weights.b2, 'sigmoid');
        let output = this.denseLayer(hidden2, this.weights.W3, this.weights.b3);

        const probs = this.softmax(output);
        const predictedClass = probs.indexOf(Math.max(...probs));

        return {
            predictedClass,
            probabilities: probs
        };
    }

    dispose() {
        if (this.model) {
            this.model.dispose();
            this.model = null;
        }
        this.isLoaded = false;
        console.log("Resources disposed.");
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MNISTModel;
}
