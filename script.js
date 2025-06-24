// MNIST Digit Recognition - Main Application Logic
class MNISTApp {
    constructor() {
        this.model = null;
        this.isDrawing = false;
        this.canvas = null;
        this.ctx = null;

        this.init();
    }

    async init() {
        console.log('Initializing MNIST App...');

        // Initialize canvas
        this.initCanvas();

        // Initialize file upload
        this.initFileUpload();

        // Initialize model
        await this.initModel();

        // Initialize event listeners
        this.initEventListeners();

        // Hide loading overlay
        this.hideLoading();

        console.log('MNIST App initialized successfully!');
    }

    initCanvas() {
        this.canvas = document.getElementById('drawingCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Set canvas properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 8;

        // Clear canvas
        this.clearCanvas();

        // Add drawing event listeners
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));
    }

    initFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // File input change
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Drag and drop
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
    }

    async initModel() {
        try {
            console.log('Loading MNIST model...');
            document.getElementById('modelStatus').textContent = 'Loading...';
            document.getElementById('modelStatus').className = 'loading';

            // Initialize the neural network model
            this.model = new MNISTModel();
            await this.model.loadWeights();

            console.log('Model loaded successfully!');
            document.getElementById('modelStatus').textContent = 'Ready';
            document.getElementById('modelStatus').className = 'ready';

        } catch (error) {
            console.error('Error loading model:', error);
            document.getElementById('modelStatus').textContent = 'Fallback Mode';
            document.getElementById('modelStatus').className = 'ready';

            // Initialize fallback model
            this.model = new MNISTModel();
            this.model.isLoaded = true;
        }
    }

    initEventListeners() {
        // Clear canvas button
        document.getElementById('clearCanvas').addEventListener('click', () => {
            this.clearCanvas();
            this.clearPrediction();
        });

        // Predict drawing button
        document.getElementById('predictDrawing').addEventListener('click', () => {
            this.predictFromCanvas();
        });

        // Predict upload button
        document.getElementById('predictUpload').addEventListener('click', () => {
            this.predictFromUpload();
        });
    }

    // Canvas Drawing Methods
    startDrawing(e) {
        this.isDrawing = true;
        this.draw(e);
    }

    draw(e) {
        if (!this.isDrawing) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    stopDrawing() {
        if (this.isDrawing) {
            this.isDrawing = false;
            this.ctx.beginPath();
        }
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    clearCanvas() {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.beginPath();
    }

    // File Upload Methods
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.currentTarget.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    processFile(file) {
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = document.getElementById('uploadedImage');
            img.src = e.target.result;
            img.onload = () => {
                document.getElementById('uploadedImageContainer').style.display = 'block';
                document.getElementById('uploadArea').style.display = 'none';
            };
        };
        reader.readAsDataURL(file);
    }

    // Prediction Methods
    async predictFromCanvas() {
        if (!this.model || !this.model.isLoaded) {
            alert('Model not loaded yet. Please wait...');
            return;
        }

        try {
            // Get image data from canvas
            const imageData = this.preprocessCanvasImage();

            // Make prediction
            const prediction = await this.model.predict(imageData);

            // Display results
            this.displayPrediction(prediction);

        } catch (error) {
            console.error('Prediction error:', error);
            alert('Error making prediction. Please try again.');
        }
    }

    async predictFromUpload() {
        if (!this.model || !this.model.isLoaded) {
            alert('Model not loaded yet. Please wait...');
            return;
        }

        try {
            const img = document.getElementById('uploadedImage');
            const imageData = this.preprocessUploadedImage(img);

            // Make prediction
            const prediction = await this.model.predict(imageData);

            // Display results
            this.displayPrediction(prediction);

        } catch (error) {
            console.error('Prediction error:', error);
            alert('Error making prediction. Please try again.');
        }
    }

    preprocessCanvasImage() {
        // Create a temporary canvas for preprocessing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 28;
        tempCanvas.height = 28;

        // Draw the main canvas onto the temp canvas (scaled down)
        tempCtx.drawImage(this.canvas, 0, 0, 28, 28);

        // Get image data
        const imageData = tempCtx.getImageData(0, 0, 28, 28);
        const data = imageData.data;

        // Convert to grayscale and normalize
        const processedData = new Float32Array(28 * 28);
        for (let i = 0; i < data.length; i += 4) {
            // Convert RGBA to grayscale (invert colors: white background -> black, black drawing -> white)
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const normalized = (255 - gray) / 255; // Invert and normalize
            processedData[i / 4] = normalized;
        }

        return processedData;
    }

    preprocessUploadedImage(img) {
        // Create a temporary canvas for preprocessing
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = 28;
        tempCanvas.height = 28;

        // Draw the image onto the temp canvas (scaled and centered)
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;

        tempCtx.fillStyle = '#FFFFFF';
        tempCtx.fillRect(0, 0, 28, 28);
        tempCtx.drawImage(img, x, y, size, size, 0, 0, 28, 28);

        // Get image data
        const imageData = tempCtx.getImageData(0, 0, 28, 28);
        const data = imageData.data;

        // Convert to grayscale and normalize
        const processedData = new Float32Array(28 * 28);
        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const normalized = (255 - gray) / 255;
            processedData[i / 4] = normalized;
        }

        return processedData;
    }

    displayPrediction(prediction) {
        const { predictedClass, probabilities } = prediction;

        // Update main prediction display
        document.getElementById('predictedDigit').textContent = predictedClass;
        document.getElementById('predictedDigit').classList.add('pulse');

        // Update confidence
        const confidence = Math.max(...probabilities) * 100;
        document.getElementById('confidence').textContent = `${confidence.toFixed(1)}% confident`;

        // Update probability bars
        this.updateProbabilityBars(probabilities);

        // Remove pulse animation after 2 seconds
        setTimeout(() => {
            document.getElementById('predictedDigit').classList.remove('pulse');
        }, 2000);
    }

    updateProbabilityBars(probabilities) {
        const container = document.getElementById('probabilityBars');
        container.innerHTML = '';

        probabilities.forEach((prob, digit) => {
            const barElement = document.createElement('div');
            barElement.className = 'probability-bar';

            const percentage = (prob * 100).toFixed(1);

            barElement.innerHTML = `
                <div class="bar-label">${digit}</div>
                <div class="bar-container">
                    <div class="bar-fill" style="width: ${percentage}%"></div>
                </div>
                <div class="bar-value">${percentage}%</div>
            `;

            container.appendChild(barElement);
        });

        container.classList.add('fade-in');
    }

    clearPrediction() {
        document.getElementById('predictedDigit').textContent = '?';
        document.getElementById('confidence').textContent = 'Ready to predict';
        document.getElementById('probabilityBars').innerHTML = '';
    }

    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        overlay.classList.add('hidden');
        setTimeout(() => {
            overlay.style.display = 'none';
        }, 300);
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.mnistApp = new MNISTApp();
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        console.log('Page hidden - pausing operations');
    } else {
        console.log('Page visible - resuming operations');
    }
});