import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Upload, Zap, Download, Leaf, Flower, Mountain, Trees, Cloud, Sun, AlertCircle, CheckCircle, Settings, Palette, Layers, Eye } from 'lucide-react';

// Types
interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  delay?: number;
}

interface TechStackItemProps {
  name: string;
  category: string;
  color: string;
}

interface GenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  prompt: string;
  style: string;
  quality: string;
  modelUrl?: string;
  errorMessage?: string;
}

// API Service
class API {
  private baseUrl = 'http://127.0.0.1:8000';

  async generateModel(data: {
    prompt: string;
    style: string;
    quality: string;
    referenceImage?: File;
  }): Promise<{ jobId: string }> {
    const formData = new FormData();
    formData.append('prompt', data.prompt);
    formData.append('style', data.style);
    formData.append('quality', data.quality);
    
    if (data.referenceImage) {
      formData.append('reference_image', data.referenceImage);
    }

    const response = await fetch(`${this.baseUrl}/api/generate/text-to-3d`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Generation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getJobStatus(jobId: string): Promise<GenerationJob> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.statusText}`);
    }

    return await response.json();
  }

  async downloadModel(jobId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/jobs/${jobId}/download`);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    return await response.blob();
  }

  async uploadModel(file: File): Promise<{ modelId: string; previewUrl: string }> {
    const formData = new FormData();
    formData.append('model_file', file);

    const response = await fetch(`${this.baseUrl}/api/upload/model`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return await response.json();
  }

  async getPresets(): Promise<{ styles: string[]; qualities: string[] }> {
    const response = await fetch(`${this.baseUrl}/api/presets`);
    
    if (!response.ok) {
      throw new Error(`Failed to get presets: ${response.statusText}`);
    }

    return await response.json();
  }
}

// Floating Nature Particles Component
const FloatingParticles = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0);
    
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Create nature-inspired particles
    const geometry = new THREE.BufferGeometry();
    const particleCount = 200;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;
      
      velocities[i] = (Math.random() - 0.5) * 0.02;
      velocities[i + 1] = (Math.random() - 0.5) * 0.02;
      velocities[i + 2] = (Math.random() - 0.5) * 0.02;
      
      // Nature-inspired colors
      colors[i] = Math.random() * 0.3 + 0.4; // Green component
      colors[i + 1] = Math.random() * 0.4 + 0.6; // Enhanced green
      colors[i + 2] = Math.random() * 0.2 + 0.1; // Earth tones
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    camera.position.z = 15;

    const animate = () => {
      requestAnimationFrame(animate);
      
      const time = Date.now() * 0.001;
      particles.rotation.x = time * 0.05;
      particles.rotation.y = time * 0.1;
      
      // Update particle positions
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1] + Math.sin(time + i) * 0.001;
        positions[i + 2] += velocities[i + 2];
        
        // Boundary wrapping
        if (Math.abs(positions[i]) > 10) velocities[i] *= -1;
        if (Math.abs(positions[i + 1]) > 10) velocities[i + 1] *= -1;
        if (Math.abs(positions[i + 2]) > 10) velocities[i + 2] *= -1;
      }
      geometry.attributes.position.needsUpdate = true;
      
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 pointer-events-none z-0" />;
};

// Enhanced 3D Preview Component
const ThreeDPreview = ({ 
  isGenerating, 
  progress, 
  currentPreset, 
  generatedModel 
}: { 
  isGenerating: boolean; 
  progress: number; 
  currentPreset: string;
  generatedModel: string | null;
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ 
    scene: THREE.Scene; 
    camera: THREE.PerspectiveCamera; 
    renderer: THREE.WebGLRenderer; 
    models: THREE.Group;
    controls: any;
  } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 300;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    scene.fog = new THREE.Fog(0x0f172a, 10, 50);
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    mount.appendChild(renderer.domElement);

    // Create model group
    const models = new THREE.Group();
    scene.add(models);

    // Add environment
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    scene.add(gridHelper);

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0x00ff88, 0.5, 50);
    pointLight.position.set(-10, 10, 10);
    scene.add(pointLight);

    camera.position.set(5, 5, 5);
    camera.lookAt(0, 0, 0);

    // Simple orbit controls simulation
    let mouseX = 0, mouseY = 0;
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    mount.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      // Smooth camera movement based on mouse
      camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 5 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);
      
      // Rotate models
      models.rotation.y += 0.005;
      
      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { scene, camera, renderer, models, controls: null };

    const handleResize = () => {
      if (!mountRef.current || !sceneRef.current) return;
      const { camera, renderer } = sceneRef.current;
      const newWidth = mountRef.current.clientWidth || 400;
      const newHeight = mountRef.current.clientHeight || 300;
      
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      mount.removeEventListener('mousemove', handleMouseMove);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update scene based on preset
  useEffect(() => {
    if (!sceneRef.current) return;
    
    const { scene, models } = sceneRef.current;
    
    // Clear existing models
    while (models.children.length > 0) {
      const child = models.children[0];
      models.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(mat => mat.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    // Create different preview models based on preset
    if (currentPreset === 'Forest') {
      // Create tree-like structures
      for (let i = 0; i < 5; i++) {
        const trunkGeometry = new THREE.CylinderGeometry(0.1, 0.2, 2, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        const leavesGeometry = new THREE.SphereGeometry(0.8, 8, 6);
        const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
        leaves.position.y = 1.5;
        
        const tree = new THREE.Group();
        tree.add(trunk);
        tree.add(leaves);
        tree.position.set((Math.random() - 0.5) * 8, 0, (Math.random() - 0.5) * 8);
        tree.scale.setScalar(0.5 + Math.random() * 0.5);
        
        models.add(tree);
      }
    } else if (currentPreset === 'Garden') {
      // Create flower-like structures
      for (let i = 0; i < 8; i++) {
        const stemGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 6);
        const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x32CD32 });
        const stem = new THREE.Mesh(stemGeometry, stemMaterial);
        
        const flowerGeometry = new THREE.SphereGeometry(0.3, 8, 6);
        const flowerMaterial = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color().setHSL(Math.random(), 0.7, 0.6) 
        });
        const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
        flower.position.y = 0.8;
        
        const plant = new THREE.Group();
        plant.add(stem);
        plant.add(flower);
        plant.position.set((Math.random() - 0.5) * 6, 0, (Math.random() - 0.5) * 6);
        
        models.add(plant);
      }
    } else if (currentPreset === 'Landscape') {
      // Create mountain-like terrain
      const geometry = new THREE.PlaneGeometry(10, 10, 20, 20);
      const positions = geometry.attributes.position;
      
      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const z = positions.getZ(i);
        const height = Math.sin(x * 0.5) * Math.cos(z * 0.5) * 2;
        positions.setY(i, height);
      }
      
      geometry.computeVertexNormals();
      const material = new THREE.MeshLambertMaterial({ 
        color: 0x567d46,
        wireframe: false 
      });
      const terrain = new THREE.Mesh(geometry, material);
      terrain.rotation.x = -Math.PI / 2;
      
      models.add(terrain);
    } else {
      // Default: rotating geometric shapes
      const shapes = [
        new THREE.BoxGeometry(1, 1, 1),
        new THREE.SphereGeometry(0.7, 16, 12),
        new THREE.ConeGeometry(0.7, 1.5, 8),
        new THREE.CylinderGeometry(0.5, 0.5, 1.5, 12)
      ];
      
      shapes.forEach((geometry, index) => {
        const material = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color().setHSL(index * 0.25, 0.7, 0.5) 
        });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          (index - 1.5) * 2,
          Math.sin(index) * 0.5,
          Math.cos(index) * 2
        );
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        models.add(mesh);
      });
    }
  }, [currentPreset]);

  // Update scene when generating
  useEffect(() => {
    if (sceneRef.current && isGenerating) {
      const { models } = sceneRef.current;
      const hue = (progress / 100) * 360;
      
      models.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          const color = new THREE.Color().setHSL((hue + index * 60) / 360, 0.7, 0.5);
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              if (mat instanceof THREE.MeshLambertMaterial) {
                mat.color.copy(color);
              }
            });
          } else if (child.material instanceof THREE.MeshLambertMaterial) {
            child.material.color.copy(color);
          }
        } else if (child instanceof THREE.Group) {
          child.children.forEach(subChild => {
            if (subChild instanceof THREE.Mesh && subChild.material instanceof THREE.MeshLambertMaterial) {
              const color = new THREE.Color().setHSL((hue + index * 60) / 360, 0.7, 0.5);
              subChild.material.color.copy(color);
            }
          });
        }
      });
    }
  }, [isGenerating, progress]);

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-slate-900/50 to-purple-900/50 rounded-2xl overflow-hidden">
      <div ref={mountRef} className="w-full h-full" />
      {isGenerating && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white font-medium">Processing...</span>
            </div>
            <div className="w-48 bg-white/10 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-center mt-2 text-white/80 text-sm">{Math.round(progress)}%</div>
          </div>
        </div>
      )}
      {generatedModel && !isGenerating && (
        <div className="absolute top-4 right-4 bg-green-500/20 backdrop-blur-md rounded-lg p-3 border border-green-400/30">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-green-100 text-sm">Ready for download</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Feature Card Component
const FeatureCard = ({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 transform transition-all duration-1000 hover:scale-105 hover:bg-white/15 cursor-pointer ${
      isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
    }`}>
      <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
        <Icon className="w-8 h-8 text-white" />
      </div>
      <h3 className="text-2xl font-bold text-white mb-4">{title}</h3>
      <p className="text-white/80 leading-relaxed">{description}</p>
    </div>
  );
};

// Tech Stack Component
const TechStackItem = ({ name, category, color }: TechStackItemProps) => (
  <div className={`bg-gradient-to-r ${color} px-4 py-2 rounded-full text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 cursor-pointer`}>
    <span className="text-xs opacity-75">{category}</span>
    <div className="font-semibold">{name}</div>
  </div>
);

// Main App Component
const App = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('realistic');
  const [quality, setQuality] = useState('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [currentPreset, setCurrentPreset] = useState('Daylight');
  const [availableStyles, setAvailableStyles] = useState(['realistic', 'cartoon', 'abstract', 'sci-fi']);
  const [availableQualities, setAvailableQualities] = useState(['low', 'medium', 'high']);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const api = new API();

  // Load presets on component mount
  useEffect(() => {
    const loadPresets = async () => {
      try {
        const presets = await api.getPresets();
        setAvailableStyles(presets.styles);
        setAvailableQualities(presets.qualities);
      } catch (error) {
        console.log('Using default presets, backend not available');
      }
    };
    
    loadPresets();
  }, []);

  // Poll job status when generating
  useEffect(() => {
    if (!currentJob || currentJob.status === 'completed' || currentJob.status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const updatedJob = await api.getJobStatus(currentJob.id);
        setCurrentJob(updatedJob);
        setProgress(updatedJob.progress);

        if (updatedJob.status === 'completed') {
          setIsGenerating(false);
          setSuccess(true);
          clearInterval(pollInterval);
        } else if (updatedJob.status === 'failed') {
          setIsGenerating(false);
          setError(updatedJob.errorMessage || 'Generation failed');
          clearInterval(pollInterval);
        }
      } catch (error) {
        console.error('Failed to poll job status:', error);
      }
    }, 1000);

    return () => clearInterval(pollInterval);
  }, [currentJob]);

  // Enhanced generation function with real API integration
  const generateModel = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your 3D model');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess(false);
    setProgress(0);
    setCurrentJob(null);

    try {
      // Try real API first
      const result = await api.generateModel({
        prompt,
        style,
        quality,
        referenceImage: uploadedFile || undefined
      });

      const newJob: GenerationJob = {
        id: result.jobId,
        status: 'processing',
        progress: 0,
        prompt,
        style,
        quality
      };

      setCurrentJob(newJob);

    } catch (apiError) {
      console.log('API not available, using simulation:', apiError);
      
      // Fallback simulation
      const simulatedJob: GenerationJob = {
        id: `sim-${Date.now()}`,
        status: 'processing',
        progress: 0,
        prompt,
        style,
        quality
      };
      
      setCurrentJob(simulatedJob);
      
      // Simulate progress
      let simulatedProgress = 0;
      const progressInterval = setInterval(() => {
        simulatedProgress += Math.random() * 15;
        if (simulatedProgress >= 100) {
          simulatedProgress = 100;
          setProgress(100);
          setCurrentJob(prev => prev ? { ...prev, status: 'completed', progress: 100, modelUrl: `demo-model-${Date.now()}.glb` } : null);
          setIsGenerating(false);
          setSuccess(true);
          clearInterval(progressInterval);
        } else {
          setProgress(simulatedProgress);
          setCurrentJob(prev => prev ? { ...prev, progress: simulatedProgress } : null);
        }
      }, 300);
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setUploadedFileName(file.name);
      resetGeneration();
    }
  };

  // Reset generation state
  const resetGeneration = () => {
    setError('');
    setSuccess(false);
    setCurrentJob(null);
    setProgress(0);
  };

  // Enhanced download function
  const handleDownload = async () => {
    if (!currentJob || !currentJob.modelUrl) return;
    
    try {
      // Try to download from backend
      const blob = await api.downloadModel(currentJob.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentJob.modelUrl;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.log('Backend download failed, creating demo file:', error);
      
      // Create demo GLB file
      const createDemoGLB = () => {
        // Basic GLB file structure for demo
        const gltfJson = {
          "asset": { "version": "2.0", "generator": "3DCraft AI" },
          "scenes": [{"nodes": [0]}],
          "scene": 0,
          "nodes": [{ "mesh": 0 }],
          "meshes": [{ "primitives": [{ "attributes": {"POSITION": 0}, "indices": 0 }] }],
          "accessors": [
            { "bufferView": 0, "componentType": 5126, "count": 8, "type": "VEC3" },
            { "bufferView": 1, "componentType": 5123, "count": 36, "type": "SCALAR" }
          ],
          "bufferViews": [
            {"buffer": 0, "byteOffset": 0, "byteLength": 96},
            {"buffer": 0, "byteOffset": 96, "byteLength": 72}
          ],
          "buffers": [{"byteLength": 168}]
        };

        const jsonString = JSON.stringify(gltfJson);
        const jsonBuffer = new TextEncoder().encode(jsonString);
        
        // Create simple cube data
        const vertices = new Float32Array([
          -1,-1,-1, 1,-1,-1, 1,1,-1, -1,1,-1, -1,-1,1, 1,-1,1, 1,1,1, -1,1,1
        ]);
        const indices = new Uint16Array([
          0,1,2,0,2,3, 4,7,6,4,6,5, 0,4,5,0,5,1, 2,6,7,2,7,3, 0,3,7,0,7,4, 1,5,6,1,6,2
        ]);

        // Combine into GLB format
        const binaryBuffer = new ArrayBuffer(vertices.byteLength + indices.byteLength);
        new Uint8Array(binaryBuffer).set(new Uint8Array(vertices.buffer));
        new Uint8Array(binaryBuffer, vertices.byteLength).set(new Uint8Array(indices.buffer));

        const totalLength = 12 + 8 + jsonBuffer.length + 8 + binaryBuffer.byteLength;
        const glbBuffer = new ArrayBuffer(totalLength);
        const glbView = new DataView(glbBuffer);
        let offset = 0;

        // GLB Header
        glbView.setUint32(offset, 0x46546C67, true); offset += 4; // "glTF"
        glbView.setUint32(offset, 2, true); offset += 4; // version
        glbView.setUint32(offset, totalLength, true); offset += 4; // length

        // JSON chunk
        glbView.setUint32(offset, jsonBuffer.length, true); offset += 4;
        glbView.setUint32(offset, 0x4E4F534A, true); offset += 4; // "JSON"
        new Uint8Array(glbBuffer, offset, jsonBuffer.length).set(jsonBuffer);
        offset += jsonBuffer.length;

        // Binary chunk
        glbView.setUint32(offset, binaryBuffer.byteLength, true); offset += 4;
        glbView.setUint32(offset, 0x004E4942, true); offset += 4; // "BIN\0"
        new Uint8Array(glbBuffer, offset).set(new Uint8Array(binaryBuffer));

        return new Blob([glbBuffer], { type: 'model/gltf-binary' });
      };

      const blob = createDemoGLB();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = currentJob.modelUrl || 'demo-model.glb';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  // Preset buttons functionality
  const applyPreset = (presetType: string) => {
    setCurrentPreset(presetType);
    
    // Update prompt based on preset
    const presetPrompts = {
      'Daylight': 'A bright sunny day scene with soft natural lighting',
      'Forest': 'A dense forest with tall trees, moss, and filtered sunlight',
      'Garden': 'A beautiful garden with colorful flowers, butterflies, and stone paths',
      'Landscape': 'Rolling hills with grass, distant mountains, and dramatic sky'
    };
    
    if (presetPrompts[presetType as keyof typeof presetPrompts]) {
      setPrompt(presetPrompts[presetType as keyof typeof presetPrompts]);
    }
    
    resetGeneration();
  };

  // Upload model functionality
  const handleModelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.glb') && !file.name.toLowerCase().endsWith('.gltf')) {
      setError('Please upload a GLB or GLTF file');
      return;
    }

    try {
      setIsGenerating(true);
      const result = await api.uploadModel(file);
      setSuccess(true);
      setCurrentJob({
        id: result.modelId,
        status: 'completed',
        progress: 100,
        prompt: `Uploaded: ${file.name}`,
        style: 'uploaded',
        quality: 'original',
        modelUrl: file.name
      });
    } catch (error) {
      setError('Failed to upload model. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <FloatingParticles />
      
      {/* Navigation */}
      <nav className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <Trees className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">3DCraft AI</h1>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-white/80 hover:text-white transition-colors cursor-pointer">Features</a>
            <a href="#tech" className="text-white/80 hover:text-white transition-colors cursor-pointer">Technology</a>
            <a href="#demo" className="text-white/80 hover:text-white transition-colors cursor-pointer">Demo</a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-400 bg-clip-text text-transparent mb-8 leading-tight">
            Nature-Inspired
            <br />3D Generation
          </h2>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto leading-relaxed mb-12">
            Transform your ideas into stunning 3D models with AI. Create organic designs, landscapes, and natural structures with simple text prompts.
          </p>
          
          {/* Enhanced Generation Interface */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-5xl mx-auto border border-white/20 shadow-2xl">
            
            {/* Main Input Section */}
            <div className="flex flex-col xl:flex-row gap-6 mb-8">
              <div className="flex-1">
                <label className="block text-white/80 mb-3 text-left font-medium">Describe your 3D model</label>
                <textarea 
                  className="w-full h-32 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none transition-all duration-300"
                  placeholder="A serene Japanese garden with cherry blossoms, a small koi pond, and a wooden bridge..."
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    resetGeneration();
                  }}
                />
              </div>
              <div className="xl:w-80">
                <label className="block text-white/80 mb-3 text-left font-medium">Upload Reference (Optional)</label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-green-400 transition-colors cursor-pointer group">
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="file-upload"
                    accept="image/*"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-white/60 group-hover:text-green-400 mx-auto mb-2 transition-colors" />
                    <p className="text-white/60 group-hover:text-white text-sm transition-colors">
                      {uploadedFileName || "Drop image here"}
                    </p>
                    {uploadedFileName && (
                      <p className="text-green-400 text-xs mt-1">✓ File selected</p>
                    )}
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Style Presets */}
            <div className="mb-6">
              <label className="block text-white/80 mb-3 text-left font-medium">Quick Presets</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { name: 'Daylight', icon: Sun, description: 'Bright outdoor scene' },
                  { name: 'Forest', icon: Trees, description: 'Dense woodland' },
                  { name: 'Garden', icon: Flower, description: 'Colorful botanical' },
                  { name: 'Landscape', icon: Mountain, description: 'Natural terrain' }
                ].map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => applyPreset(preset.name)}
                    className={`group bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white hover:bg-white/10 transition-all duration-300 transform hover:scale-105 ${
                      currentPreset === preset.name ? 'bg-green-500/20 border-green-400/50' : ''
                    }`}
                  >
                    <preset.icon className="w-6 h-6 mx-auto mb-2 group-hover:text-green-400 transition-colors" />
                    <div className="font-medium">{preset.name}</div>
                    <div className="text-xs text-white/60 mt-1">{preset.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Controls Toggle */}
            <div className="mb-6">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Advanced Settings</span>
                <div className={`transform transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </button>
            </div>

            {/* Advanced Controls */}
            {showAdvanced && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <label className="block text-white/80 mb-2 text-left font-medium">Style</label>
                  <select 
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300"
                    value={style}
                    onChange={(e) => {
                      setStyle(e.target.value);
                      resetGeneration();
                    }}
                  >
                    {availableStyles.map(styleOption => (
                      <option key={styleOption} value={styleOption}>
                        {styleOption.charAt(0).toUpperCase() + styleOption.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-white/80 mb-2 text-left font-medium">Quality</label>
                  <select 
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-300"
                    value={quality}
                    onChange={(e) => {
                      setQuality(e.target.value);
                      resetGeneration();
                    }}
                  >
                    {availableQualities.map(qualityOption => (
                      <option key={qualityOption} value={qualityOption}>
                        {qualityOption.charAt(0).toUpperCase() + qualityOption.slice(1)}
                        {qualityOption === 'low' && ' (Fast)'}
                        {qualityOption === 'medium' && ' (Balanced)'}
                        {qualityOption === 'high' && ' (Detailed)'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 mb-2 text-left font-medium">Upload Model</label>
                  <div className="relative">
                    <input 
                      type="file" 
                      onChange={handleModelUpload}
                      className="hidden" 
                      id="model-upload"
                      accept=".glb,.gltf"
                    />
                    <label 
                      htmlFor="model-upload" 
                      className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white/80 hover:text-white cursor-pointer transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Upload GLB/GLTF</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Generate Button */}
            <button 
              onClick={generateModel}
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-xl font-semibold text-lg hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Generating 3D Model...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Generate 3D Model</span>
                </div>
              )}
            </button>

            {/* Status Messages */}
            {error && (
              <div className="mt-6 bg-red-900/20 border border-red-400/30 rounded-xl p-4 flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-200">{error}</span>
                <button 
                  onClick={resetGeneration}
                  className="ml-auto text-red-300 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
            )}

            {success && currentJob && (
              <div className="mt-6 bg-green-900/20 border border-green-400/30 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <div>
                      <div className="text-white font-medium">Model Generated Successfully!</div>
                      <div className="text-green-200 text-sm">{currentJob.prompt.substring(0, 50)}...</div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={handleDownload}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download</span>
                    </button>
                    <button 
                      onClick={() => {/* Add share functionality */}}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Share
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Generation Progress Details */}
            {isGenerating && currentJob && (
              <div className="mt-6 bg-blue-900/20 border border-blue-400/30 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-white font-medium">Processing: {currentJob.prompt.substring(0, 40)}...</span>
                  <span className="text-blue-300 text-sm">{currentJob.status}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-3">
                  <div 
                    className="bg-gradient-to-r from-blue-400 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-white/70 mt-2">
                  <span>Style: {currentJob.style} | Quality: {currentJob.quality}</span>
                  <span>{Math.round(progress)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-5xl font-bold text-center text-white mb-16">
          Interactive 3D Preview
        </h3>
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="aspect-video bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-2xl overflow-hidden relative" style={{ minHeight: '500px' }}>
            <ThreeDPreview 
              isGenerating={isGenerating} 
              progress={progress} 
              currentPreset={currentPreset}
              generatedModel={currentJob?.modelUrl || null}
            />
          </div>
          
          {/* Environment Controls */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <button 
              onClick={() => applyPreset('Daylight')}
              className={`bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white hover:bg-white/10 transition-all duration-300 transform hover:scale-105 ${
                currentPreset === 'Daylight' ? 'bg-yellow-500/20 border-yellow-400/50' : ''
              }`}
            >
              <Sun className="w-5 h-5 mx-auto mb-2" />
              <span>Daylight</span>
            </button>
            <button 
              onClick={() => applyPreset('Forest')}
              className={`bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white hover:bg-white/10 transition-all duration-300 transform hover:scale-105 ${
                currentPreset === 'Forest' ? 'bg-green-500/20 border-green-400/50' : ''
              }`}
            >
              <Trees className="w-5 h-5 mx-auto mb-2" />
              <span>Forest</span>
            </button>
            <button 
              onClick={() => applyPreset('Garden')}
              className={`bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white hover:bg-white/10 transition-all duration-300 transform hover:scale-105 ${
                currentPreset === 'Garden' ? 'bg-pink-500/20 border-pink-400/50' : ''
              }`}
            >
              <Flower className="w-5 h-5 mx-auto mb-2" />
              <span>Garden</span>
            </button>
            <button 
              onClick={() => applyPreset('Landscape')}
              className={`bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white hover:bg-white/10 transition-all duration-300 transform hover:scale-105 ${
                currentPreset === 'Landscape' ? 'bg-blue-500/20 border-blue-400/50' : ''
              }`}
            >
              <Mountain className="w-5 h-5 mx-auto mb-2" />
              <span>Landscape</span>
            </button>
          </div>

          {/* Additional Controls */}
          <div className="mt-6 flex flex-wrap gap-3 justify-center">
            <button 
              onClick={() => {/* Add wireframe toggle */}}
              className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
            >
              <Layers className="w-4 h-4" />
              <span>Wireframe</span>
            </button>
            <button 
              onClick={() => {/* Add lighting toggle */}}
              className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
            >
              <Palette className="w-4 h-4" />
              <span>Lighting</span>
            </button>
            <button 
              onClick={() => {/* Add camera reset */}}
              className="bg-white/5 border border-white/10 rounded-lg py-2 px-4 text-white hover:bg-white/10 transition-all duration-300 flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Reset View</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-5xl font-bold text-center text-white mb-16">
          Powerful Features
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Leaf}
            title="AI-Powered Generation"
            description="Advanced neural networks trained on millions of 3D models to create stunning, realistic organic structures and natural environments."
            delay={0}
          />
          <FeatureCard
            icon={Flower}
            title="Ecosystem Design"
            description="Generate complete natural environments with interconnected flora, fauna, and realistic ecosystem interactions using cutting-edge AI."
            delay={200}
          />
          <FeatureCard
            icon={Mountain}
            title="Professional Export"
            description="High-quality GLTF/GLB exports optimized for Unity, Unreal Engine, Blender, and 3D printing with full material support."
            delay={400}
          />
        </div>
      </section>

      {/* Enhanced Tech Stack Section */}
      <section id="tech" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-5xl font-bold text-center text-white mb-16">
          Advanced Technology Stack
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-green-400 mb-4 flex items-center">
              <Zap className="w-6 h-6 mr-2" />
              Frontend
            </h4>
            <TechStackItem name="React 18" category="Framework" color="from-blue-500 to-blue-600" />
            <TechStackItem name="Three.js r128" category="3D Engine" color="from-purple-500 to-purple-600" />
            <TechStackItem name="Tailwind CSS" category="Styling" color="from-teal-500 to-teal-600" />
            <TechStackItem name="TypeScript" category="Language" color="from-blue-600 to-blue-700" />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center">
              <Settings className="w-6 h-6 mr-2" />
              Backend
            </h4>
            <TechStackItem name="FastAPI" category="Framework" color="from-green-500 to-green-600" />
            <TechStackItem name="PostgreSQL" category="Database" color="from-indigo-500 to-indigo-600" />
            <TechStackItem name="Redis" category="Cache" color="from-red-500 to-red-600" />
            <TechStackItem name="Celery" category="Task Queue" color="from-pink-500 to-pink-600" />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-blue-400 mb-4 flex items-center">
              <Eye className="w-6 h-6 mr-2" />
              AI & 3D
            </h4>
            <TechStackItem name="OpenAI GPT-4" category="Text Analysis" color="from-emerald-500 to-emerald-600" />
            <TechStackItem name="Blender API" category="3D Processing" color="from-orange-500 to-orange-600" />
            <TechStackItem name="Stable Diffusion" category="Image Gen" color="from-violet-500 to-violet-600" />
            <TechStackItem name="Point-E" category="3D AI" color="from-cyan-500 to-cyan-600" />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-purple-400 mb-4 flex items-center">
              <Cloud className="w-6 h-6 mr-2" />
              Infrastructure
            </h4>
            <TechStackItem name="AWS S3" category="Storage" color="from-yellow-500 to-yellow-600" />
            <TechStackItem name="Docker" category="Container" color="from-blue-500 to-blue-600" />
            <TechStackItem name="GitHub Actions" category="CI/CD" color="from-gray-600 to-gray-700" />
            <TechStackItem name="Railway" category="Deployment" color="from-red-500 to-red-600" />
          </div>
        </div>
      </section>

      {/* Interactive CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-lg rounded-3xl p-12 border border-green-400/30">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Create Amazing 3D Models?
          </h3>
          <p className="text-xl text-white/80 mb-8">
            Join thousands of designers and developers creating the next generation of 3D content with AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => {
                document.querySelector('textarea')?.focus();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center space-x-2"
            >
              <Zap className="w-5 h-5" />
              <span>Start Creating</span>
            </button>
            <button 
              onClick={() => window.open('https://github.com/wareeshayyyyy/3DCraftAI', '_blank')}
              className="border-2 border-white/30 text-white py-4 px-8 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300 flex items-center justify-center space-x-2"
            >
              <span>View Documentation</span>
            </button>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Trees className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-white">3DCraft AI</h4>
              </div>
              <p className="text-white/60 mb-4">
                Nature-inspired 3D generation powered by cutting-edge artificial intelligence.
              </p>
              <div className="flex space-x-4">
                <button 
                  onClick={() => window.open('https://twitter.com/3dcraftai', '_blank')}
                  className="text-white/60 hover:text-green-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => window.open('https://github.com/wareeshayyyyy/3DCraftAI', '_blank')}
                  className="text-white/60 hover:text-green-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </button>
                <button 
                  onClick={() => window.open('https://discord.gg/3dcraftai', '_blank')}
                  className="text-white/60 hover:text-green-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-4">Product</h5>
              <ul className="space-y-2">
                <li><button onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})} className="text-white/60 hover:text-white transition-colors text-left">Features</button></li>
                <li><button onClick={() => {/* Add pricing modal */}} className="text-white/60 hover:text-white transition-colors text-left">Pricing</button></li>
                <li><button onClick={() => window.open('https://github.com/wareeshayyyyy/3DCraftAI/blob/main/API.md', '_blank')} className="text-white/60 hover:text-white transition-colors text-left">API</button></li>
                <li><button onClick={() => {/* Add gallery */}} className="text-white/60 hover:text-white transition-colors text-left">Gallery</button></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-4">Resources</h5>
              <ul className="space-y-2">
                <li><button onClick={() => window.open('https://github.com/wareeshayyyyy/3DCraftAI/blob/main/README.md', '_blank')} className="text-white/60 hover:text-white transition-colors text-left">Documentation</button></li>
                <li><button onClick={() => {/* Add tutorials */}} className="text-white/60 hover:text-white transition-colors text-left">Tutorials</button></li>
                <li><button onClick={() => window.open('https://discord.gg/3dcraftai', '_blank')} className="text-white/60 hover:text-white transition-colors text-left">Community</button></li>
                <li><button onClick={() => {/* Add examples */}} className="text-white/60 hover:text-white transition-colors text-left">Examples</button></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-4">Company</h5>
              <ul className="space-y-2">
                <li><button onClick={() => {/* Add about modal */}} className="text-white/60 hover:text-white transition-colors text-left">About</button></li>
                <li><button onClick={() => window.open('https://blog.3dcraft.ai', '_blank')} className="text-white/60 hover:text-white transition-colors text-left">Blog</button></li>
                <li><button onClick={() => window.open('mailto:contact@3dcraft.ai')} className="text-white/60 hover:text-white transition-colors text-left">Contact</button></li>
                <li><button onClick={() => {/* Add careers */}} className="text-white/60 hover:text-white transition-colors text-left">Careers</button></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 mb-4 md:mb-0">© {new Date().getFullYear()} 3DCraft AI. All rights reserved.</p>
            <div className="flex space-x-6">
              <button onClick={() => {/* Add privacy policy */}} className="text-white/60 hover:text-white transition-colors text-sm">Privacy Policy</button>
              <button onClick={() => {/* Add terms */}} className="text-white/60 hover:text-white transition-colors text-sm">Terms of Service</button>
              <button onClick={() => {/* Add cookies */}} className="text-white/60 hover:text-white transition-colors text-sm">Cookie Policy</button>
            </div>
          </div>
          
        </div>
        
      </footer>
    </div>
  );
};

export default App;