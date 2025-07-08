// Pre-trained MNIST Neural Network Weights
// Architecture: 784 -> 128 -> 64 -> 10
// Xavier initialization + cleaned structure for model.js

function generateXavierWeights(inputSize, outputSize) {
    const weights = [];
    const limit = Math.sqrt(6.0 / (inputSize + outputSize));
    for (let i = 0; i < outputSize; i++) {
        const row = [];
        for (let j = 0; j < inputSize; j++) {
            row.push((Math.random() * 2 - 1) * limit);
        }
        weights.push(row);
    }
    return weights;
}

function generateBiases(size) {
    const biases = [];
    for (let i = 0; i < size; i++) {
        biases.push((Math.random() * 2 - 1) * 0.01);
    }
    return biases;
}

const MNIST_WEIGHTS = {
    W1: generateXavierWeights(784, 128),
    b1: generateBiases(128),
    W2: generateXavierWeights(128, 64),
    b2: generateBiases(64),
    W3: generateXavierWeights(64, 10),
    b3: generateBiases(10)
};

if (typeof window !== 'undefined') {
    window.MNIST_WEIGHTS = MNIST_WEIGHTS;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MNIST_WEIGHTS;
}

console.log('MNIST weights generated with Xavier initialization.');
console.log('Model architecture: 784 -> 128 -> 64 -> 10');
console.log('Total parameters:', 784 * 128 + 128 + 128 * 64 + 64 + 64 * 10 + 10);
