// js/3dModelService.js - Complete 3D Model Generation Service

class ModelGeneratorService {
    constructor(baseURL = 'http://127.0.0.1:8000') {
        this.baseURL = baseURL;
        this.activeTasks = new Map();
        this.eventListeners = new Map();
    }

    // Generate 3D Model
    async generate3DModel(prompt, options = {}) {
        const {
            style = 'realistic',
            complexity = 'medium',
            formats = ['obj', 'gltf', 'stl'],
            referenceImage = null
        } = options;

        try {
            // Show loading state
            this.updateUI('loading', { message: 'Starting 3D model generation...' });

            const formData = new FormData();
            formData.append('prompt', prompt);
            formData.append('style', style);
            formData.append('complexity', complexity);
            formData.append('formats', JSON.stringify(formats));
            
            if (referenceImage) {
                formData.append('reference_image', referenceImage);
            }

            const response = await fetch(`${this.baseURL}/api/generate/text-to-3d`, {
                method: 'POST',
                body: formData,
                headers: {
                    // Don't set Content-Type for FormData, let browser set it
                }
            });
            
            const result = await response.json();
            
            if (response.ok && result.generation_id) {
                // Start polling for status
                this.pollGenerationStatus(result.generation_id);
                
                this.updateUI('started', {
                    generationId: result.generation_id,
                    message: 'Generation started successfully!'
                });
                
                return result.generation_id;
            } else {
                throw new Error(result.message || result.detail || 'Generation failed');
            }
        } catch (error) {
            console.error('Generation error:', error);
            this.updateUI('error', { error: error.message });
            throw error;
        }
    }

    // Poll for generation status
    pollGenerationStatus(generationId) {
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${this.baseURL}/api/generate/status/${generationId}`);
                const status = await response.json();
                
                // Update UI with progress
                this.updateProgressUI(status);
                
                if (status.status === 'completed') {
                    clearInterval(pollInterval);
                    this.handleGenerationComplete(status);
                    this.activeTasks.delete(generationId);
                } else if (status.status === 'failed') {
                    clearInterval(pollInterval);
                    this.handleGenerationError(status);
                    this.activeTasks.delete(generationId);
                } else if (status.status === 'processing') {
                    // Continue polling
                    this.updateUI('processing', status);
                }
                
            } catch (error) {
                console.error('Status check error:', error);
                clearInterval(pollInterval);
                this.activeTasks.delete(generationId);
                this.updateUI('error', { error: 'Failed to check generation status' });
            }
        }, 2000); // Poll every 2 seconds

        // Store the interval for cleanup
        this.activeTasks.set(generationId, pollInterval);
    }

    // Handle completed generation
    handleGenerationComplete(status) {
        const result = status.result || status;
        
        console.log('✅ Generation completed!');
        console.log('Files:', result.files);
        console.log('Preview:', result.preview_image);
        
        // Update UI with completion
        this.updateUI('completed', {
            generationId: status.generation_id || status.id,
            files: result.files,
            preview: result.preview_image,
            model: result
        });
        
        // Display download links
        this.displayDownloadLinks(result.files);
        
        // Show preview image
        this.displayPreview(result.preview_image);

        // Emit completion event
        this.emitEvent('generationComplete', { 
            generationId: status.generation_id || status.id, 
            result 
        });
    }

    // Handle generation error
    handleGenerationError(status) {
        console.error('❌ Generation failed:', status.error_message || status.error);
        
        this.updateUI('error', {
            generationId: status.generation_id || status.id,
            error: status.error_message || status.error || 'Generation failed'
        });
        
        this.emitEvent('generationError', { 
            generationId: status.generation_id || status.id, 
            error: status.error_message || status.error 
        });
    }

    // Update progress UI
    updateProgressUI(status) {
        const progress = status.progress || 0;
        const statusText = this.getStatusText(status.status);
        
        // Update progress bar
        const progressElement = document.getElementById('generation-progress');
        if (progressElement) {
            progressElement.innerHTML = `
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="progress-info">
                        <span class="status">${statusText}</span>
                        <span class="percentage">${Math.round(progress)}%</span>
                    </div>
                    <div class="progress-message">${status.message || ''}</div>
                </div>
            `;
        }

        // Update status indicator
        this.updateUI('progress', {
            progress,
            status: status.status,
            message: status.message
        });

        // Emit progress event
        this.emitEvent('generationProgress', status);
    }

    // Get user-friendly status text
    getStatusText(status) {
        const statusMap = {
            'pending': 'Preparing...',
            'processing': 'Generating 3D Model...',
            'ai_processing': 'AI Processing...',
            'mesh_generation': 'Creating 3D Mesh...',
            'blender_processing': 'Processing with Blender...',
            'uploading': 'Uploading Files...',
            'completed': 'Completed!',
            'failed': 'Failed',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    // Display download links
    displayDownloadLinks(files) {
        const container = document.getElementById('download-links');
        if (container && files) {
            container.innerHTML = '<h3>📥 Download Your 3D Model:</h3>';
            
            const linksHTML = Object.entries(files).map(([format, url]) => `
                <a href="${url}" 
                   download="model.${format}" 
                   class="download-link"
                   target="_blank">
                    <i class="icon-${format}"></i>
                    Download ${format.toUpperCase()}
                </a>
            `).join('');
            
            container.innerHTML += `<div class="download-grid">${linksHTML}</div>`;
        }
    }

    // Display preview image
    displayPreview(previewUrl) {
        const previewContainer = document.getElementById('model-preview');
        if (previewContainer && previewUrl) {
            previewContainer.innerHTML = `
                <h3>👀 Preview:</h3>
                <div class="preview-container">
                    <img src="${previewUrl}" 
                         alt="3D Model Preview" 
                         class="model-preview-image"
                         loading="lazy">
                    <div class="preview-controls">
                        <button onclick="this.previousElementSibling.requestFullscreen()" 
                                class="fullscreen-btn">
                            🔍 View Fullscreen
                        </button>
                    </div>
                </div>
            `;
        }
    }

    // Generic UI update method
    updateUI(type, data) {
        const mainContainer = document.getElementById('generation-container');
        if (!mainContainer) return;

        switch (type) {
            case 'loading':
                mainContainer.className = 'generation-container loading';
                break;
            case 'started':
                mainContainer.className = 'generation-container started';
                break;
            case 'processing':
                mainContainer.className = 'generation-container processing';
                break;
            case 'completed':
                mainContainer.className = 'generation-container completed';
                this.showSuccessAnimation();
                break;
            case 'error':
                mainContainer.className = 'generation-container error';
                this.showErrorMessage(data.error);
                break;
        }
    }

    // Show success animation
    showSuccessAnimation() {
        const successElement = document.getElementById('success-animation');
        if (successElement) {
            successElement.style.display = 'block';
            setTimeout(() => {
                successElement.style.display = 'none';
            }, 3000);
        }
    }

    // Show error message
    showErrorMessage(error) {
        const errorContainer = document.getElementById('error-message');
        if (errorContainer) {
            errorContainer.innerHTML = `
                <div class="error-alert">
                    <span class="error-icon">❌</span>
                    <span class="error-text">${error}</span>
                    <button onclick="this.parentElement.style.display='none'" class="close-error">×</button>
                </div>
            `;
            errorContainer.style.display = 'block';
        }
    }

    // Event system
    on(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }

    emitEvent(eventName, data) {
        if (this.eventListeners.has(eventName)) {
            this.eventListeners.get(eventName).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
        }

        // Also emit as DOM event
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    // Cancel a generation task
    cancelGeneration(generationId) {
        if (this.activeTasks.has(generationId)) {
            clearInterval(this.activeTasks.get(generationId));
            this.activeTasks.delete(generationId);
            
            // Optionally call API to cancel server-side task
            fetch(`${this.baseURL}/api/generate/cancel/${generationId}`, { 
                method: 'POST' 
            }).catch(error => console.error('Cancel request failed:', error));
            
            this.updateUI('cancelled', { generationId });
        }
    }

    // Clean up all active polling
    cleanup() {
        this.activeTasks.forEach((interval) => clearInterval(interval));
        this.activeTasks.clear();
    }

    // Get user's models
    async getUserModels() {
        try {
            const response = await fetch(`${this.baseURL}/api/models/user`, {
                headers: {
                    'Authorization': `Bearer ${this.getAuthToken()}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to fetch user models:', error);
            return [];
        }
    }

    // Get auth token (implement based on your auth system)
    getAuthToken() {
        return localStorage.getItem('auth_token') || '';
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModelGeneratorService;
}

// Global export for browser
if (typeof window !== 'undefined') {
    window.ModelGeneratorService = ModelGeneratorService;
}

// Auto-initialize if DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Auto-create global instance
    window.modelGenerator = new ModelGeneratorService();
    
    // Set up form submission handler
    const form = document.getElementById('generation-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const prompt = formData.get('prompt');
            const style = formData.get('style') || 'realistic';
            const complexity = formData.get('complexity') || 'medium';
            
            if (prompt) {
                try {
                    await window.modelGenerator.generate3DModel(prompt, {
                        style,
                        complexity
                    });
                } catch (error) {
                    console.error('Generation failed:', error);
                }
            }
        });
    }
});