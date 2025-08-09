import cloudinary
import cloudinary.uploader
import cloudinary.api
from cloudinary.utils import cloudinary_url
import os
from typing import Dict, List, Optional
from pathlib import Path
import tempfile
from PIL import Image, ImageDraw, ImageFont
import io

class CloudinaryStorageService:
    def __init__(self):
        # Configure Cloudinary
        cloudinary.config(
            cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
            api_key=os.getenv('CLOUDINARY_API_KEY'),
            api_secret=os.getenv('CLOUDINARY_API_SECRET'),
            secure=True
        )
        
        # Verify configuration
        self.verify_credentials()
    
    def verify_credentials(self):
        """Verify Cloudinary credentials are working"""
        try:
            cloudinary.api.ping()
            print("✅ Cloudinary credentials verified successfully!")
        except Exception as e:
            print(f"❌ Cloudinary configuration error: {e}")
            raise Exception("Invalid Cloudinary credentials")
    
    async def upload_model_files(self, model_id: str, file_paths: Dict[str, str]) -> Dict[str, str]:
        """Upload 3D model files to Cloudinary"""
        
        uploaded_urls = {}
        
        for format_name, file_path in file_paths.items():
            if not os.path.exists(file_path):
                continue
                
            try:
                # Upload file
                upload_result = cloudinary.uploader.upload(
                    file_path,
                    public_id=f"3dcraft/models/{model_id}/model",
                    resource_type="raw",  # For non-image files
                    format=format_name,
                    folder="3dcraft/models",
                    use_filename=True,
                    unique_filename=False,
                    overwrite=True,
                    tags=[f"model_{model_id}", format_name, "3d_model"]
                )
                
                uploaded_urls[format_name] = upload_result['secure_url']
                print(f"✅ Uploaded {format_name}: {upload_result['secure_url']}")
                
            except Exception as e:
                print(f"❌ Failed to upload {format_name}: {e}")
                uploaded_urls[format_name] = None
        
        return uploaded_urls
    
    async def generate_and_upload_preview(self, model_id: str, model_data: Dict) -> str:
        """Generate preview image and upload to Cloudinary"""
        
        try:
            # Generate preview image
            preview_image = self.create_preview_image(model_data)
            
            # Save to temporary file
            with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as temp_file:
                preview_image.save(temp_file.name, 'PNG')
                temp_path = temp_file.name
            
            # Upload to Cloudinary
            upload_result = cloudinary.uploader.upload(
                temp_path,
                public_id=f"3dcraft/previews/{model_id}",
                folder="3dcraft/previews",
                resource_type="image",
                format="png",
                transformation=[
                    {"width": 400, "height": 400, "crop": "fill"},
                    {"quality": "auto", "fetch_format": "auto"}
                ],
                tags=[f"preview_{model_id}", "3d_preview"]
            )
            
            # Cleanup temp file
            os.unlink(temp_path)
            
            return upload_result['secure_url']
            
        except Exception as e:
            print(f"❌ Failed to generate/upload preview: {e}")
            return self.get_default_preview_url()
    
    def create_preview_image(self, model_data: Dict) -> Image.Image:
        """Create a preview image for the 3D model"""
        
        # Create a 400x400 image with gradient background
        img = Image.new('RGB', (400, 400), color=(45, 55, 72))
        draw = ImageDraw.Draw(img)
        
        # Add gradient effect
        for y in range(400):
            color_value = int(45 + (y / 400) * 30)
            draw.line([(0, y), (400, y)], fill=(color_value, color_value + 10, color_value + 27))
        
        # Add model info text
        try:
            # Try to use a nice font
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 24)
            font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 16)
        except:
            # Fallback to default font
            font_large = ImageFont.load_default()
            font_small = ImageFont.load_default()
        
        # Model type
        model_type = model_data.get('geometry_type', 'Generic').title()
        draw.text((20, 20), f"3D Model", font=font_large, fill=(255, 255, 255))
        draw.text((20, 50), f"Type: {model_type}", font=font_small, fill=(200, 200, 200))
        
        # Add some geometric shapes to represent 3D
        self.draw_3d_wireframe(draw, model_data)
        
        return img
    
    def draw_3d_wireframe(self, draw: ImageDraw.Draw, model_data: Dict):
        """Draw a simple 3D wireframe representation"""
        
        # Center coordinates
        cx, cy = 200, 250
        
        # Draw a simple cube wireframe
        # Front face
        draw.rectangle([cx-60, cy-60, cx+60, cy+60], outline=(100, 200, 255), width=2)
        
        # Back face (offset)
        offset = 30
        draw.rectangle([cx-60+offset, cy-60-offset, cx+60+offset, cy+60-offset], outline=(80, 160, 200), width=2)
        
        # Connect corners
        corners = [
            (cx-60, cy-60, cx-60+offset, cy-60-offset),
            (cx+60, cy-60, cx+60+offset, cy-60-offset),
            (cx-60, cy+60, cx-60+offset, cy+60-offset),
            (cx+60, cy+60, cx+60+offset, cy+60-offset),
        ]
        
        for corner in corners:
            draw.line(corner, fill=(60, 120, 180), width=1)
    
    def get_default_preview_url(self) -> str:
        """Return a default preview image URL"""
        # You can upload a default preview image to Cloudinary and return its URL here
        return "https://res.cloudinary.com/demo/image/upload/sample.png"
    
    async def delete_model(self, model_id: str):
        """Delete all files associated with a model"""
        
        try:
            # Delete all files with the model tag
            cloudinary.api.delete_resources_by_tag(f"model_{model_id}")
            cloudinary.api.delete_resources_by_tag(f"preview_{model_id}")
            print(f"✅ Deleted all files for model {model_id}")
        except Exception as e:
            print(f"❌ Failed to delete model files: {e}")
    
    async def get_model_info(self, model_id: str) -> Dict:
        """Get information about uploaded model files"""
        
        try:
            # Search for resources with model tag
            result = cloudinary.api.resources_by_tag(f"model_{model_id}")
            
            model_info = {
                'files': {},
                'total_size': 0,
                'upload_date': None
            }
            
            for resource in result['resources']:
                format_name = resource.get('format', 'unknown')
                model_info['files'][format_name] = {
                    'url': resource['secure_url'],
                    'size': resource.get('bytes', 0),
                    'created_at': resource.get('created_at')
                }
                model_info['total_size'] += resource.get('bytes', 0)
            
            return model_info
            
        except Exception as e:
            print(f"❌ Failed to get model info: {e}")
            return {'files': {}, 'total_size': 0, 'upload_date': None}
    
    def get_optimized_url(self, public_id: str, **transformations) -> str:
        """Get optimized URL with transformations"""
        
        url, options = cloudinary_url(
            public_id,
            secure=True,
            **transformations
        )
        return url
    
    async def get_usage_stats(self) -> Dict:
        """Get current Cloudinary usage statistics"""
        
        try:
            usage = cloudinary.api.usage()
            return {
                'storage': {
                    'used': usage.get('storage', {}).get('usage', 0),
                    'limit': usage.get('storage', {}).get('limit', 0),
                    'percentage': (usage.get('storage', {}).get('usage', 0) / usage.get('storage', {}).get('limit', 1)) * 100
                },
                'bandwidth': {
                    'used': usage.get('bandwidth', {}).get('usage', 0),
                    'limit': usage.get('bandwidth', {}).get('limit', 0),
                    'percentage': (usage.get('bandwidth', {}).get('usage', 0) / usage.get('bandwidth', {}).get('limit', 1)) * 100
                },
                'transformations': {
                    'used': usage.get('transformations', {}).get('usage', 0),
                    'limit': usage.get('transformations', {}).get('limit', 0),
                    'percentage': (usage.get('transformations', {}).get('usage', 0) / usage.get('transformations', {}).get('limit', 1)) * 100
                }
            }
        except Exception as e:
            print(f"❌ Failed to get usage stats: {e}")
            return {}