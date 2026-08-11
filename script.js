// Wait for DOM to load
document.addEventListener('DOMContentLoaded', async () => {
    // Load face-api.js models
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
    
    // DOM elements
    const fileInput1 = document.getElementById('fileInput1');
    const fileInput2 = document.getElementById('fileInput2');
    const canvas1 = document.getElementById('canvas1');
    const canvas2 = document.getElementById('canvas2');
    const resultCanvas = document.getElementById('resultCanvas');
    const swapBtn = document.getElementById('swapBtn');
    const resetBtn = document.getElementById('resetBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const videoUpload = document.getElementById('videoUpload');
    const videoInput = document.getElementById('videoInput');
    const processVideoBtn = document.getElementById('processVideoBtn');
    
    // Global variables
    let image1 = null;
    let image2 = null;
    let detections1 = null;
    let detections2 = null;
    
    // Event listeners
    fileInput1.addEventListener('change', async (e) => {
        await handleImageUpload(e, canvas1, 1);
    });
    
    fileInput2.addEventListener('change', async (e) => {
        await handleImageUpload(e, canvas2, 2);
    });
    
    swapBtn.addEventListener('click', swapFaces);
    resetBtn.addEventListener('click', resetAll);
    downloadBtn.addEventListener('click', downloadResult);
    videoUpload.addEventListener('change', handleVideoUpload);
    processVideoBtn.addEventListener('click', processVideo);
    
    // Functions
    async function handleImageUpload(event, canvas, imageNumber) {
        const file = event.target.files[0];
        if (!file) return;
        
        const img = await faceapi.bufferToImage(file);
        if (imageNumber === 1) {
            image1 = img;
        } else {
            image2 = img;
        }
        
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        canvas.style.display = 'block';
        
        // Detect faces
        const detections = await faceapi.detectAllFaces(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks();
            
        if (imageNumber === 1) {
            detections1 = detections;
        } else {
            detections2 = detections;
        }
        
        // Draw detections (optional)
        // faceapi.draw.drawDetections(canvas, detections);
        // faceapi.draw.drawFaceLandmarks(canvas, detections);
        
        // Enable swap button if both images are loaded
        if (image1 && image2) {
            swapBtn.disabled = false;
        }
    }
    
    function swapFaces() {
        if (!image1 || !image2 || !detections1 || !detections2) {
            alert('Please upload both images first');
            return;
        }
        
        if (detections1.length === 0 || detections2.length === 0) {
            alert('No faces detected in one or both images');
            return;
        }
        
        // For simplicity, we'll just swap the first face in each image
        const face1 = detections1[0];
        const face2 = detections2[0];
        
        // Set up result canvas
        resultCanvas.width = image2.width;
        resultCanvas.height = image2.height;
        const ctx = resultCanvas.getContext('2d');
        
        // Draw the second image as background
        ctx.drawImage(image2, 0, 0, image2.width, image2.height);
        
        // Get the face from image1 and paste it onto image2
        const landmarks1 = face1.landmarks;
        const jawOutline = landmarks1.getJawOutline();
        const nose = landmarks1.getNose();
        const mouth = landmarks1.getMouth();
        const leftEye = landmarks1.getLeftEye();
        const rightEye = landmarks1.getRightEye();
        const leftEyeBrow = landmarks1.getLeftEyeBrow();
        const rightEyeBrow = landmarks1.getRightEyeBrow();
        
        // Create a path for the face
        ctx.save();
        ctx.beginPath();
        
        // Draw jawline
        for (let i = 0; i < jawOutline.length; i++) {
            const point = jawOutline[i];
            if (i === 0) {
                ctx.moveTo(point.x, point.y);
            } else {
                ctx.lineTo(point.x, point.y);
            }
        }
        
        // Draw forehead (approximate)
        const foreheadStart = leftEyeBrow[0];
        const foreheadEnd = rightEyeBrow[4];
        ctx.lineTo(foreheadEnd.x, foreheadEnd.y);
        ctx.lineTo(foreheadStart.x, foreheadStart.y);
        
        ctx.closePath();
        ctx.clip();
        
        // Draw the face from image1 onto image2
        ctx.drawImage(image1, 0, 0, image1.width, image1.height, 
                      0, 0, resultCanvas.width, resultCanvas.height);
        
        ctx.restore();
        
        // Show the result canvas
        resultCanvas.style.display = 'block';
        downloadBtn.disabled = false;
    }
    
    function resetAll() {
        // Clear all canvases
        const canvases = [canvas1, canvas2, resultCanvas];
        canvases.forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'none';
        });
        
        // Reset file inputs
        fileInput1.value = '';
        fileInput2.value = '';
        
        // Reset variables
        image1 = null;
        image2 = null;
        detections1 = null;
        detections2 = null;
        
        // Disable buttons
        swapBtn.disabled = true;
        downloadBtn.disabled = true;
    }
    
    function downloadResult() {
        if (!resultCanvas.style.display || resultCanvas.style.display === 'none') {
            alert('No result to download');
            return;
        }
        
        const link = document.createElement('a');
        link.download = 'face-swap-result.png';
        link.href = resultCanvas.toDataURL('image/png');
        link.click();
    }
    
    function handleVideoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const videoURL = URL.createObjectURL(file);
        videoInput.src = videoURL;
        videoInput.style.display = 'block';
        processVideoBtn.disabled = false;
    }
    
    function processVideo() {
        alert('Video processing is not implemented in this demo. This would require more advanced processing and potentially a backend service.');
    }
});