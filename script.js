// Main application logic
let canvas, ctx;
let isDrawing = false;
let currentModel = null;

document.addEventListener('DOMContentLoaded', async function() {
    console.log("DOM loaded, initializing...");
    
    initializeCanvas();
    initializeFileUpload();
    initializeProbabilityBars();

    // Show loading overlay if it exists
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        showLoadingOverlay();
    }
    updateModelStatus('loading');

    // Set up a 5-second timeout to hide the loader if model hasn't loaded
    let loaderTimeout = setTimeout(() => {
        if (loadingOverlay) {
            hideLoadingOverlay();
        }
        // Show error if the model didn't load
        if (!currentModel || !currentModel.isLoaded) {
            updateModelStatus('error');
        }
    }, 5000);

    const modelLoaded = await initializeModel();

    if (modelLoaded) {
        currentModel = model;
        clearTimeout(loaderTimeout);
        if (loadingOverlay) {
            hideLoadingOverlay();
        }
        updateModelStatus('ready');
    } else {
        updateModelStatus('error');
        clearTimeout(loaderTimeout);
        if (loadingOverlay) {
            hideLoadingOverlay();
        }
    }
});

// Initialize drawing canvas
function initializeCanvas() {
    console.log("Initializing canvas...");
    canvas = document.getElementById('drawingCanvas');
    if (!canvas) {
        console.error("drawingCanvas not found!");
        return;
    }
    ctx = canvas.getContext('2d');
    
    // Set canvas properties
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 8;
    
    // Clear canvas
    clearCanvas();
    
    // Add event listeners for mouse
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Add event listeners for touch
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
    
    // Button event listeners
    const clearBtn = document.getElementById('clearCanvas');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearCanvas);
        console.log("Clear button listener added");
    } else {
        console.error("clearCanvas button not found!");
    }

    const predictBtn = document.getElementById('predictDrawing');
    if (predictBtn) {
        predictBtn.addEventListener('click', predictDrawing);
        console.log("Predict button listener added");
    } else {
        console.error("predictDrawing button not found!");
    }
}

// Initialize file upload
function initializeFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const uploadedImageContainer = document.getElementById('uploadedImageContainer');
    const uploadedImage = document.getElementById('uploadedImage');
    
    if (!uploadArea || !fileInput) {
        console.error("Upload elements not found!");
        return;
    }
    
    // Click to browse
    uploadArea.addEventListener('click', () => {
        console.log("Upload area clicked");
        fileInput.click();
    });
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    
    // Predict upload button
    const predictUploadBtn = document.getElementById('predictUpload');
    if (predictUploadBtn) {
        predictUploadBtn.addEventListener('click', predictUpload);
    }
}

// Initialize probability bars
function initializeProbabilityBars() {
    const container = document.getElementById('probabilityBars');
    if (!container) {
        console.error("probabilityBars container not found!");
        return;
    }
    
    // Clear existing content
    container.innerHTML = '';
    
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
    console.log("Start drawing");
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
}

function stopDrawing() {
    if (!isDrawing) return;
    console.log("Stop drawing");
    isDrawing = false;
    ctx.beginPath();
}

// Touch event handling
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    isDrawing = true;
    ctx.beginPath();
    ctx.moveTo(x, y);
}

function handleTouchMove(e) {
    if (!isDrawing) return;
    e.preventDefault();
    
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
}

function handleTouchEnd(e) {
    e.preventDefault();
    if (!isDrawing) return;
    isDrawing = false;
    ctx.beginPath();
}

// Clear canvas
function clearCanvas() {
    console.log("Clearing canvas");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    
    // Reset prediction display
    resetPredictionDisplay();
}

// File upload handling
function handleFileSelect(e) {
    console.log("File selected");
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
    
    if (!uploadedImage || !uploadedImageContainer) {
        console.error("Upload image elements not found!");
        return;
    }
    
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
    console.log("Predict drawing clicked");
    
    if (!currentModel || !currentModel.isLoaded) {
        alert('Model not loaded yet. Please wait or reload the page.');
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
    console.log("Predict upload clicked");
    
    if (!currentModel || !currentModel.isLoaded) {
        alert('Model not loaded yet. Please wait or reload the page.');
        return;
    }
    
    const uploadedImage = document.getElementById('uploadedImage');
    if (!uploadedImage || !uploadedImage.src) {
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
    const predictedDigitEl = document.getElementById('predictedDigit');
    const confidenceEl = document.getElementById('confidence');
    
    if (predictedDigitEl) {
        predictedDigitEl.textContent = digit;
        // Add animation
        predictedDigitEl.classList.add('pulse');
        setTimeout(() => {
            predictedDigitEl.classList.remove('pulse');
        }, 2000);
    }
    
    if (confidenceEl) {
        confidenceEl.textContent = `${(confidence * 100).toFixed(1)}% confidence`;
    }
    
    // Update probability bars
    for (let i = 0; i < 10; i++) {
        const probability = probabilities[i] * 100;
        const barEl = document.getElementById(`bar-${i}`);
        const valueEl = document.getElementById(`value-${i}`);
        
        if (barEl) {
            barEl.style.width = `${probability}%`;
        }
        if (valueEl) {
            valueEl.textContent = `${probability.toFixed(1)}%`;
        }
    }
}

// Reset prediction display
function resetPredictionDisplay() {
    const predictedDigitEl = document.getElementById('predictedDigit');
    const confidenceEl = document.getElementById('confidence');
    
    if (predictedDigitEl) {
        predictedDigitEl.textContent = '?';
    }
    if (confidenceEl) {
        confidenceEl.textContent = 'Ready to predict';
    }
    
    // Reset probability bars
    for (let i = 0; i < 10; i++) {
        const barEl = document.getElementById(`bar-${i}`);
        const valueEl = document.getElementById(`value-${i}`);
        
        if (barEl) {
            barEl.style.width = '0%';
        }
        if (valueEl) {
            valueEl.textContent = '0%';
        }
    }
}

// Loading overlay functions
function showLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.remove('hidden');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
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

// Utility functions
function downloadCanvas() {
    const link = document.createElement('a');
    link.download = 'digit_drawing.png';
    link.href = canvas.toDataURL();
    link.click();
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        canvasToArray,
        imageToArray,
        displayPrediction,
        resetPredictionDisplay
    };
}
