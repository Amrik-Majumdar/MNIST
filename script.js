// Main application logic
let canvas, ctx;
let isDrawing = false;
let currentModel = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    initializeCanvas();
    initializeFileUpload();
    initializeProbabilityBars();
    updateModelStatus('loading');
    showLoadingOverlay(); 
    let loaderTimeout = setTimeout(() => {
        hideLoadingOverlay();
        if (!currentModel || !currentModel.isLoaded) {
            updateModelStatus('error');
        }
    }, 5000);

    const modelLoaded = await initializeModel();
    
    if (modelLoaded) {
        currentModel = model;
        clearTimeout(loaderTimeout);
        hideLoadingOverlay();
    } else {
        updateModelStatus('error');
        clearTimeout(loaderTimeout);
        hideLoadingOverlay();
    }
});

// Initialize drawing canvas
function initializeCanvas() {
    canvas = document.getElementById('drawingCanvas');
    ctx = canvas.getContext('2d');
    
    // Set canvas properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    
    // Clear canvas
    clearCanvas();
    
    // Add event listeners
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', handleTouch);
    canvas.addEventListener('touchmove', handleTouch);
    canvas.addEventListener('touchend', stopDrawing);
    
    // Button event listeners
    document.getElementById('clearCanvas').addEventListener('click', clearCanvas);
    document.getElementById('predictDrawing').addEventListener('click', predictDrawing);
}

// Initialize file upload
function initializeFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadedImageContainer = document.getElementById('uploadedImageContainer');
    const uploadedImage = document.getElementById('uploadedImage');
    
    // Click to browse
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    
    // Predict upload button
    document.getElementById('predictUpload').addEventListener('click', predictUpload);
}

// Initialize probability bars
function initializeProbabilityBars() {
    const container = document.getElementById('probabilityBars');
    
    for (let i = 0; i < 10; i++) {
        const barElement = document.createElement('div');
        barElement.className = 'probability-bar';
        barElement.innerHTML = `
            <div class="bar-label">${i}</div>
            <div class="bar-container">
                <div class="bar-fill" id="bar-${i}" style="width: 0%"></div>
            </div>
            <div class="bar-value" id="value-${i}">0%</div>
        `;
        container.appendChild(barElement);
    }
}

// Canvas drawing functions
function startDrawing(e) {
    isDrawing = true;
    draw(e);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function stopDrawing() {
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
}

// Touch event handling
function handleTouch(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 'mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
    });
    canvas.dispatchEvent(mouseEvent);
}

// Clear canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    
    // Reset prediction display
    resetPredictionDisplay();
}

// File upload handling
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        displayUploadedImage(file);
    }
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
        displayUploadedImage(file);
    }
}

function handleDragLeave(e) {
    e.currentTarget.classList.remove('dragover');
}

function displayUploadedImage(file) {
    const uploadedImage = document.getElementById('uploadedImage');
    const uploadedImageContainer = document.getElementById('uploadedImageContainer');
    
    const reader = new FileReader();
    reader.onload = function(e) {
        uploadedImage.src = e.target.result;
        uploadedImageContainer.style.display = 'block';
    };
    reader.readAsDataURL(file);
}

// Convert image to 28x28 grayscale array
function imageToArray(imageElement) {
    return new Promise((resolve, reject) => {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        tempCanvas.width = 28;
        tempCanvas.height = 28;
        
        // Draw image scaled to 28x28
        tempCtx.drawImage(imageElement, 0, 0, 28, 28);
        
        // Get image data
        const imageData = tempCtx.getImageData(0, 0, 28, 28);
        const data = imageData.data;
        
        // Convert to grayscale and normalize
        const grayscale = [];
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const gray = (r + g + b) / 3;
            
            // Invert colors (white background to black, black digits to white)
            const inverted = 255 - gray;
            grayscale.push(inverted / 255.0);
        }
        
        resolve(grayscale);
    });
}

// Convert canvas to 28x28 grayscale array
function canvasToArray() {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    
    tempCanvas.width = 28;
    tempCanvas.height = 28;
    
    // Draw canvas scaled to 28x28
    tempCtx.drawImage(canvas, 0, 0, 28, 28);
    
    // Get image data
    const imageData = tempCtx.getImageData(0, 0, 28, 28);
    const data = imageData.data;
    
    // Convert to grayscale and normalize
    const grayscale = [];
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const gray = (r + g + b) / 3;
        
        // Invert colors (white background to black, black digits to white)
        const inverted = 255 - gray;
        grayscale.push(inverted / 255.0);
    }
    
    return grayscale;
}

// Predict drawing
async function predictDrawing() {
    if (!currentModel || !currentModel.isLoaded) {
        alert('Model not loaded yet. Please wait.');
        return;
    }
    
    try {
        const imageArray = canvasToArray();
        const result = currentModel.predict(imageArray);
        
        displayPrediction(result);
        
    } catch (error) {
        console.error('Prediction error:', error);
        alert('Error making prediction. Please try again.');
    }
}

// Predict upload
async function predictUpload() {
    if (!currentModel || !currentModel.isLoaded) {
        alert('Model not loaded yet. Please wait.');
        return;
    }
    
    const uploadedImage = document.getElementById('uploadedImage');
    if (!uploadedImage.src) {
        alert('Please upload an image first.');
        return;
    }
    
    try {
        const imageArray = await imageToArray(uploadedImage);
        const result = currentModel.predict(imageArray);
        
        displayPrediction(result);
        
    } catch (error) {
        console.error('Prediction error:', error);
        alert('Error making prediction. Please try again.');
    }
}

// Display prediction results
function displayPrediction(result) {
    const { digit, confidence, probabilities } = result;
    
    // Update main prediction display
    document.getElementById('predictedDigit').textContent = digit;
    document.getElementById('confidence').textContent = `${(confidence * 100).toFixed(1)}% confidence`;
    
    // Update probability bars
    for (let i = 0; i < 10; i++) {
        const probability = probabilities[i] * 100;
        document.getElementById(`bar-${i}`).style.width = `${probability}%`;
        document.getElementById(`value-${i}`).textContent = `${probability.toFixed(1)}%`;
    }
    
    // Add animation
    document.getElementById('predictedDigit').classList.add('pulse');
    setTimeout(() => {
        document.getElementById('predictedDigit').classList.remove('pulse');
    }, 2000);
}

// Reset prediction display
function resetPredictionDisplay() {
    document.getElementById('predictedDigit').textContent = '?';
    document.getElementById('confidence').textContent = 'Ready to predict';
    
    // Reset probability bars
    for (let i = 0; i < 10; i++) {
        document.getElementById(`bar-${i}`).style.width = '0%';
        document.getElementById(`value-${i}`).textContent = '0%';
    }
}

// Loading overlay functions
function showLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

// Update model status
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

// Utility functions
function downloadCanvas() {
    const link = document.createElement('a');
    link.download = 'digit_drawing.png';
    link.href = canvas.toDataURL();
    link.click();
}

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.key === 'c' && e.ctrlKey) {
        e.preventDefault();
        clearCanvas();
    } else if (e.key === 'p' && e.ctrlKey) {
        e.preventDefault();
        predictDrawing();
    } else if (e.key === 'Enter') {
        predictDrawing();
    }
});

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        canvasToArray,
        imageToArray,
        displayPrediction,
        resetPredictionDisplay
    };
}
