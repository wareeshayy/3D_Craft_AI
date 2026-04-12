import React, { useRef, useEffect, useState } from 'react';

interface SimpleModelViewerProps {
  modelUrl?: string;
  modelData?: ArrayBuffer;
  className?: string;
}

const SimpleModelViewer: React.FC<SimpleModelViewerProps> = ({ 
  modelUrl, 
  modelData, 
  className = '' 
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [viewerUrl, setViewerUrl] = useState<string>('');

  useEffect(() => {
    if (modelUrl) {
      // Use a simple glTF viewer service
      setViewerUrl(`https://gltf-viewer.donmccurdy.com/#model=${encodeURIComponent(modelUrl)}`);
    } else if (modelData) {
      // Create a blob URL for the model data
      const blob = new Blob([modelData], { type: 'model/gltf-binary' });
      const url = URL.createObjectURL(blob);
      setViewerUrl(`https://gltf-viewer.donmccurdy.com/#model=${encodeURIComponent(url)}`);
      
      return () => URL.revokeObjectURL(url);
    }
  }, [modelUrl, modelData]);

  if (!viewerUrl) {
    return (
      <div className={`w-full h-96 bg-gray-100 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="text-gray-500 mb-2">📦</div>
          <p className="text-gray-600">No 3D model to display</p>
          <p className="text-sm text-gray-500">Generate a model to see it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-96 rounded-lg overflow-hidden border ${className}`}>
      <iframe
        ref={iframeRef}
        src={viewerUrl}
        className="w-full h-full border-0"
        title="3D Model Viewer"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
};

export default SimpleModelViewer;
