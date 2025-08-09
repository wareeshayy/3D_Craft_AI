import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Upload, Zap, Download, Leaf, Flower, Mountain, Trees, Cloud, Sun, AlertCircle, CheckCircle } from 'lucide-react';

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

    // Create nature-inspired particles (leaves, petals)
    const geometry = new THREE.BufferGeometry();
    const particleCount = 150;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 20;
      positions[i + 1] = (Math.random() - 0.5) * 20;
      positions[i + 2] = (Math.random() - 0.5) * 20;
      
      // Nature-inspired colors (greens, pinks, blues)
      colors[i] = Math.random() * 0.3 + 0.5; // Green
      colors[i + 1] = Math.random() * 0.4 + 0.3; // Variation
      colors[i + 2] = Math.random() * 0.2 + 0.1; // Earth tones
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    const material = new THREE.PointsMaterial({
      size: 0.15,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    camera.position.z = 15;

    const animate = () => {
      requestAnimationFrame(animate);
      
      // Gentle floating motion
      const time = Date.now() * 0.001;
      particles.rotation.x = time * 0.1;
      particles.rotation.y = time * 0.2;
      
      // Slight pulsing effect
      const positions = geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += Math.sin(time + i) * 0.002;
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

// 3D Preview Component with rotating model
const ThreeDPreview = ({ isGenerating, progress }: { isGenerating: boolean; progress: number }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{ scene: THREE.Scene; camera: THREE.PerspectiveCamera; renderer: THREE.WebGLRenderer; cube: THREE.Mesh } | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth || 400;
    const height = mount.clientHeight || 300;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    mount.appendChild(renderer.domElement);

    // Create a sample 3D object (rotating cube with materials)
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const materials = [
      new THREE.MeshLambertMaterial({ color: 0x00ff88 }),
      new THREE.MeshLambertMaterial({ color: 0x0088ff }),
      new THREE.MeshLambertMaterial({ color: 0xff8800 }),
      new THREE.MeshLambertMaterial({ color: 0xff0088 }),
      new THREE.MeshLambertMaterial({ color: 0x88ff00 }),
      new THREE.MeshLambertMaterial({ color: 0x8800ff }),
    ];
    
    const cube = new THREE.Mesh(geometry, materials);
    cube.castShadow = true;
    scene.add(cube);

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    camera.position.z = 5;

    // Animation loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);
      if (cube) {
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
      }
      renderer.render(scene, camera);
    };
    animate();

    sceneRef.current = { scene, camera, renderer, cube };

    // Handle resize
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
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (mount && renderer.domElement && mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      materials.forEach(material => material.dispose());
    };
  }, []);

  // Update cube color when generating
  useEffect(() => {
    if (sceneRef.current && isGenerating) {
      const { cube } = sceneRef.current;
      const hue = (progress / 100) * 360;
      const color = new THREE.Color().setHSL(hue / 360, 0.7, 0.5);
      
      // Handle material array safely
      if (Array.isArray(cube.material)) {
        cube.material.forEach((material) => {
          if (material instanceof THREE.MeshLambertMaterial) {
            material.color.copy(color.clone().multiplyScalar(Math.random() * 0.5 + 0.5));
          }
        });
      } else if (cube.material instanceof THREE.MeshLambertMaterial) {
        cube.material.color.copy(color);
      }
    }
  }, [isGenerating, progress]);

  return (
    <div className="w-full h-full relative">
      <div ref={mountRef} className="w-full h-full" />
      {isGenerating && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
              <span className="text-white font-medium">{Math.round(progress)}%</span>
            </div>
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
    <div className={`bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 transform transition-all duration-1000 hover:scale-105 hover:bg-white/15 ${
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
  <div className={`bg-gradient-to-r ${color} px-4 py-2 rounded-full text-white font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300`}>
    <span className="text-xs opacity-75">{category}</span>
    <div className="font-semibold">{name}</div>
  </div>
);

// Main App Component
const App = () => {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('Realistic');
  const [quality, setQuality] = useState('Medium (Balanced)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [generatedModel, setGeneratedModel] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  // API call function with proper error handling and fallback
  const generateModel = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your 3D model');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess(false);
    setProgress(0);
    setGeneratedModel(null);

    try {
      // Simulate progress updates
      let progressInterval: NodeJS.Timeout;
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 15;
        });
      }, 300);

      try {
        // Try the actual API first
        const response = await fetch('http://127.0.0.1:8000/api/generate/text-to-3d', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            style: style.toLowerCase().replace(/\s+/g, '_'),
            quality: quality.toLowerCase().replace(/\s+/g, '_'),
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend API error: ${response.status}`);
        }

        const data = await response.json();
        console.log('API Response:', data);
        
        // Complete the progress
        setProgress(100);
        setSuccess(true);
        setGeneratedModel(`model-${Date.now()}.glb`);
        
        // Set download URL from API response
        if (data.download_url) {
          setDownloadUrl(data.download_url);
        }
        
      } catch (apiError) {
        console.log('API not available, using simulation mode:', apiError);
        
        // Fallback to simulation if API fails
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Complete the progress
        setProgress(100);
        setSuccess(true);
        setGeneratedModel(`simulated-model-${Date.now()}.glb`);
        
        // For simulation, create a sample download URL
        setDownloadUrl(`http://127.0.0.1:8000/api/download/simulated-model-${Date.now()}.glb`);
      }
      
      clearInterval(progressInterval);
      
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Failed to generate 3D model. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  const resetGeneration = () => {
    setError('');
    setSuccess(false);
    setGeneratedModel(null);
    setDownloadUrl(null);
    setProgress(0);
  };

  const handleDownload = async () => {
    if (!downloadUrl || !generatedModel) return;
    
    try {
      // Try to download from your backend first
      const response = await fetch(downloadUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = generatedModel;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }
    } catch (error) {
      console.log('Backend download failed, creating demo GLB file:', error);
    }

    // Create a proper GLB file structure for demo purposes
    const createDemoGLB = () => {
      // Minimal GLB file structure (binary format)
      const header = new ArrayBuffer(12);
      const headerView = new DataView(header);
      
      // GLB signature "glTF"
      headerView.setUint32(0, 0x46546C67, true); // "glTF" in little endian
      headerView.setUint32(4, 2, true); // version
      headerView.setUint32(8, 1024, true); // total length (placeholder)
      
      // Create minimal glTF JSON
      const gltfJson = {
        "asset": {
          "version": "2.0",
          "generator": "3DCraft AI Demo"
        },
        "scenes": [{"nodes": [0]}],
        "scene": 0,
        "nodes": [{
          "mesh": 0,
          "translation": [0, 0, 0],
          "rotation": [0, 0, 0, 1],
          "scale": [1, 1, 1]
        }],
        "meshes": [{
          "primitives": [{
            "attributes": {"POSITION": 0},
            "indices": 0
          }]
        }],
        "accessors": [
          {
            "bufferView": 0,
            "byteOffset": 0,
            "componentType": 5126,
            "count": 8,
            "type": "VEC3",
            "max": [1, 1, 1],
            "min": [-1, -1, -1]
          },
          {
            "bufferView": 1,
            "byteOffset": 0,
            "componentType": 5123,
            "count": 36,
            "type": "SCALAR"
          }
        ],
        "bufferViews": [
          {"buffer": 0, "byteOffset": 0, "byteLength": 96, "target": 34962},
          {"buffer": 0, "byteOffset": 96, "byteLength": 72, "target": 34963}
        ],
        "buffers": [{"byteLength": 168}]
      };

      const jsonString = JSON.stringify(gltfJson);
      const jsonBuffer = new TextEncoder().encode(jsonString);
      
      // Create cube vertices and indices
      const vertices = new Float32Array([
        -1, -1, -1,  1, -1, -1,  1,  1, -1, -1,  1, -1,
        -1, -1,  1,  1, -1,  1,  1,  1,  1, -1,  1,  1
      ]);
      
      const indices = new Uint16Array([
        0,1,2, 0,2,3, 4,7,6, 4,6,5, 0,4,5, 0,5,1,
        2,6,7, 2,7,3, 0,3,7, 0,7,4, 1,5,6, 1,6,2
      ]);

      const binaryBuffer = new ArrayBuffer(vertices.byteLength + indices.byteLength);
      new Uint8Array(binaryBuffer).set(new Uint8Array(vertices.buffer));
      new Uint8Array(binaryBuffer, vertices.byteLength).set(new Uint8Array(indices.buffer));

      // Combine everything
      const totalLength = 12 + 8 + jsonBuffer.length + 8 + binaryBuffer.byteLength;
      const glbBuffer = new ArrayBuffer(totalLength);
      const glbView = new DataView(glbBuffer);
      let offset = 0;

      // Header
      glbView.setUint32(offset, 0x46546C67, true); offset += 4;
      glbView.setUint32(offset, 2, true); offset += 4;
      glbView.setUint32(offset, totalLength, true); offset += 4;

      // JSON chunk
      glbView.setUint32(offset, jsonBuffer.length, true); offset += 4;
      glbView.setUint32(offset, 0x4E4F534A, true); offset += 4; // "JSON"
      new Uint8Array(glbBuffer, offset, jsonBuffer.length).set(jsonBuffer);
      offset += jsonBuffer.length;

      // Binary chunk
      glbView.setUint32(offset, binaryBuffer.byteLength, true); offset += 4;
      glbView.setUint32(offset, 0x004E4942, true); offset += 4; // "BIN\0"
      new Uint8Array(glbBuffer, offset, binaryBuffer.byteLength).set(new Uint8Array(binaryBuffer));

      return new Blob([glbBuffer], { type: 'model/gltf-binary' });
    };

    // Create and download the demo GLB file
    const blob = createDemoGLB();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedModel || 'demo-model.glb';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
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
            <h1 className="text-3xl font-bold text-white">3DCraft</h1>
          </div>
          <div className="hidden md:flex space-x-8">
            <a href="#features" className="text-white/80 hover:text-white transition-colors">Features</a>
            <a href="#tech" className="text-white/80 hover:text-white transition-colors">Technology</a>
            <a href="#demo" className="text-white/80 hover:text-white transition-colors">Demo</a>
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
          
          {/* Generation Interface with enhanced controls */}
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-4xl mx-auto border border-white/20 shadow-2xl">
            
            {/* Main Input Section */}
            <div className="flex flex-col lg:flex-row gap-6 mb-8">
              <div className="flex-1">
                <label className="block text-white/80 mb-3 text-left">Describe your 3D model</label>
                <textarea 
                  className="w-full h-32 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-green-400 resize-none"
                  placeholder="A serene Japanese garden with cherry blossoms, a small koi pond, and a wooden bridge..."
                  value={prompt}
                  onChange={(e) => {
                    setPrompt(e.target.value);
                    resetGeneration();
                  }}
                />
              </div>
              <div className="lg:w-80">
                <label className="block text-white/80 mb-3 text-left">Upload Reference (Optional)</label>
                <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-green-400 transition-colors cursor-pointer">
                  <input 
                    type="file" 
                    onChange={handleFileUpload}
                    className="hidden" 
                    id="file-upload"
                    accept="image/*"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="w-8 h-8 text-white/60 mx-auto mb-2" />
                    <p className="text-white/60 text-sm">
                      {uploadedFile || "Drop image here"}
                    </p>
                  </label>
                </div>
              </div>
            </div>

            {/* Style and Quality Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-white/80 mb-2 text-left">Style</label>
                <select 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={style}
                  onChange={(e) => {
                    setStyle(e.target.value);
                    resetGeneration();
                  }}
                >
                  <option value="Realistic">Realistic</option>
                  <option value="Cartoon">Cartoon</option>
                  <option value="Abstract">Abstract</option>
                  <option value="Sci-Fi">Sci-Fi</option>
                </select>
              </div>
              
              <div>
                <label className="block text-white/80 mb-2 text-left">Quality</label>
                <select 
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
                  value={quality}
                  onChange={(e) => {
                    setQuality(e.target.value);
                    resetGeneration();
                  }}
                >
                  <option value="Low (Fast)">Low (Fast)</option>
                  <option value="Medium (Balanced)">Medium (Balanced)</option>
                  <option value="High (Detailed)">High (Detailed)</option>
                </select>
              </div>
            </div>
            
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
              </div>
            )}

            {success && generatedModel && (
              <div className="mt-6 bg-green-900/20 border border-green-400/30 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-white">Your model is ready!</span>
                </div>
                <button 
                  onClick={handleDownload}
                  className="text-green-400 hover:text-white transition-colors"
                >
                  Download GLB
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Demo Section with 3D Preview */}
      <section id="demo" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-5xl font-bold text-center text-white mb-16">
          See It In Action
        </h3>
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
          <div className="aspect-video bg-gradient-to-br from-green-900/50 to-emerald-900/50 rounded-2xl overflow-hidden relative" style={{ minHeight: '400px' }}>
            <ThreeDPreview isGenerating={isGenerating} progress={progress} />
          </div>
          
          {/* Progress Bar for Demo */}
          {isGenerating && (
            <div className="mt-6">
              <div className="flex justify-between text-sm text-white/70 mb-2">
                <span>Generating 3D Model...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white hover:bg-white/10 transition-colors">
              <Sun className="w-5 h-5 mx-auto mb-2" />
              <span>Daylight</span>
            </button>
            <button className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white hover:bg-white/10 transition-colors">
              <Trees className="w-5 h-5 mx-auto mb-2" />
              <span>Forest</span>
            </button>
            <button className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white hover:bg-white/10 transition-colors">
              <Flower className="w-5 h-5 mx-auto mb-2" />
              <span>Garden</span>
            </button>
            <button className="bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white hover:bg-white/10 transition-colors">
              <Mountain className="w-5 h-5 mx-auto mb-2" />
              <span>Landscape</span>
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-5xl font-bold text-center text-white mb-16">
          Organic 3D Creation
        </h3>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={Leaf}
            title="AI-Powered Generation"
            description="Our advanced AI understands natural forms and ecosystems to create realistic organic models."
            delay={0}
          />
          <FeatureCard
            icon={Flower}
            title="Ecosystem Design"
            description="Generate complete natural environments with interconnected flora and fauna."
            delay={200}
          />
          <FeatureCard
            icon={Mountain}
            title="Professional Export"
            description="High-quality GLTF/GLB exports ready for Unity, Unreal, or 3D printing."
            delay={400}
          />
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="tech" className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <h3 className="text-5xl font-bold text-center text-white mb-16">
          Advanced Technology Stack
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-green-400 mb-4">Frontend</h4>
            <TechStackItem name="React 18" category="Framework" color="from-blue-500 to-blue-600" />
            <TechStackItem name="Three.js" category="3D Engine" color="from-purple-500 to-purple-600" />
            <TechStackItem name="Tailwind CSS" category="Styling" color="from-teal-500 to-teal-600" />
            <TechStackItem name="Vercel" category="Hosting" color="from-gray-700 to-gray-800" />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-emerald-400 mb-4">Backend</h4>
            <TechStackItem name="FastAPI" category="Framework" color="from-green-500 to-green-600" />
            <TechStackItem name="PostgreSQL" category="Database" color="from-indigo-500 to-indigo-600" />
            <TechStackItem name="JWT Auth" category="Security" color="from-orange-500 to-orange-600" />
            <TechStackItem name="Celery" category="Task Queue" color="from-pink-500 to-pink-600" />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-blue-400 mb-4">AI & 3D</h4>
            <TechStackItem name="GPT-4" category="Text Analysis" color="from-emerald-500 to-emerald-600" />
            <TechStackItem name="Blender bpy" category="3D Engine" color="from-orange-500 to-orange-600" />
            <TechStackItem name="Stable Diffusion" category="Image Gen" color="from-violet-500 to-violet-600" />
            <TechStackItem name="GLTF Tools" category="3D Format" color="from-cyan-500 to-cyan-600" />
          </div>
          
          <div className="space-y-4">
            <h4 className="text-2xl font-bold text-purple-400 mb-4">Infrastructure</h4>
            <TechStackItem name="AWS S3" category="Storage" color="from-yellow-500 to-yellow-600" />
            <TechStackItem name="Docker" category="Container" color="from-blue-500 to-blue-600" />
            <TechStackItem name="GitHub" category="Version Control" color="from-gray-600 to-gray-700" />
            <TechStackItem name="Railway" category="Deployment" color="from-red-500 to-red-600" />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 backdrop-blur-lg rounded-3xl p-12 border border-green-400/30">
          <h3 className="text-4xl font-bold text-white mb-6">
            Ready to Create?
          </h3>
          <p className="text-xl text-white/80 mb-8">
            Join our community of designers and developers creating the next generation of 3D content.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 px-8 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg">
              Get Started
            </button>
            <button className="border-2 border-white/30 text-white py-3 px-8 rounded-xl font-semibold hover:bg-white/10 transition-all duration-300">
              View Documentation
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Trees className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-white">3DCraft</h4>
              </div>
              <p className="text-white/60 mb-4">
                Nature-inspired 3D generation powered by AI.
              </p>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-4">Product</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-4">Resources</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Tutorials</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="text-white font-semibold mb-4">Company</h5>
              <ul className="space-y-2">
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-white/60 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/60">
            <p>© {new Date().getFullYear()} 3DCraft. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;