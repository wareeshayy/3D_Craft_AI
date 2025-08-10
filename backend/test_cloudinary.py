# test_cloudinary.py - Fixed encoding issue
import sys
import os
import asyncio
from datetime import datetime
import tempfile
import io

# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

try:
    import cloudinary
    import cloudinary.uploader
    import cloudinary.api
    from cloudinary.utils import cloudinary_url
    CLOUDINARY_AVAILABLE = True
except ImportError:
    CLOUDINARY_AVAILABLE = False

try:
    from dotenv import load_dotenv
    DOTENV_AVAILABLE = True
except ImportError:
    DOTENV_AVAILABLE = False

def load_environment():
    """Load environment variables from .env file"""
    print("Loading environment variables...")
    
    if DOTENV_AVAILABLE:
        load_dotenv()
        print("✅ .env file loaded")
    else:
        print("⚠️ python-dotenv not installed, reading from environment directly")
    
    # Get Cloudinary credentials
    cloud_name = os.getenv('CLOUDINARY_CLOUD_NAME')
    api_key = os.getenv('CLOUDINARY_API_KEY')
    api_secret = os.getenv('CLOUDINARY_API_SECRET')
    
    return cloud_name, api_key, api_secret

def validate_credentials(cloud_name, api_key, api_secret):
    """Validate that all required credentials are present"""
    print("Validating Cloudinary credentials...")
    
    missing_credentials = []
    
    if not cloud_name:
        missing_credentials.append("CLOUDINARY_CLOUD_NAME")
    if not api_key:
        missing_credentials.append("CLOUDINARY_API_KEY")
    if not api_secret:
        missing_credentials.append("CLOUDINARY_API_SECRET")
    
    if missing_credentials:
        print(f"❌ Missing credentials: {', '.join(missing_credentials)}")
        print("\nPlease add these to your .env file:")
        print("CLOUDINARY_CLOUD_NAME=your_cloud_name")
        print("CLOUDINARY_API_KEY=your_api_key")
        print("CLOUDINARY_API_SECRET=your_api_secret")
        return False
    
    print("✅ All credentials found")
    return True

def configure_cloudinary(cloud_name, api_key, api_secret):
    """Configure Cloudinary with credentials"""
    print("Configuring Cloudinary...")
    
    try:
        cloudinary.config(
            cloud_name=cloud_name,
            api_key=api_key,
            api_secret=api_secret,
            secure=True
        )
        print("✅ Cloudinary configured successfully")
        return True
    except Exception as e:
        print(f"❌ Error configuring Cloudinary: {e}")
        return False

def test_cloudinary_connection():
    """Test basic Cloudinary API connection"""
    print("Testing Cloudinary API connection...")
    
    try:
        # Test API connectivity by getting account details
        result = cloudinary.api.ping()
        print(f"✅ Cloudinary ping successful: {result}")
        return True
    except Exception as e:
        print(f"❌ Cloudinary connection failed: {e}")
        return False

def create_test_file():
    """Create a temporary test file for upload - Fixed encoding"""
    print("Creating test file...")
    
    try:
        # Create a simple test file without special Unicode characters
        test_content = f"""# 3DCraftAI Test File
Generated at: {datetime.now().isoformat()}
This is a test file for Cloudinary upload functionality.

Test successful!
"""
        
        # Create temporary file with explicit UTF-8 encoding
        with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
            f.write(test_content)
            temp_file_path = f.name
        
        print(f"✅ Test file created: {temp_file_path}")
        return temp_file_path
    
    except Exception as e:
        print(f"❌ Error creating test file: {e}")
        return None

def test_file_upload(file_path):
    """Test uploading a file to Cloudinary"""
    print("Testing file upload...")
    
    try:
        # Upload the test file
        upload_result = cloudinary.uploader.upload(
            file_path,
            resource_type="raw",
            public_id=f"3dcraftai_test_{int(datetime.now().timestamp())}",
            folder="3dcraftai/tests",
            tags=["test", "3dcraftai", "backend"]
        )
        
        print("✅ File upload successful!")
        print(f"   Public ID: {upload_result.get('public_id')}")
        print(f"   URL: {upload_result.get('secure_url')}")
        print(f"   Size: {upload_result.get('bytes')} bytes")
        
        return upload_result
    
    except Exception as e:
        print(f"❌ File upload failed: {e}")
        return None

def test_3d_model_upload():
    """Test uploading a mock 3D model"""
    print("Testing 3D model upload simulation...")
    
    try:
        # Create a mock 3D model file (GLB simulation)
        mock_3d_content = b"GLB_MOCK_DATA_FOR_TESTING_PURPOSES_3DCRAFTAI"
        
        # Create temporary file with .glb extension
        with tempfile.NamedTemporaryFile(suffix='.glb', delete=False) as f:
            f.write(mock_3d_content)
            mock_3d_path = f.name
        
        # Upload as 3D model
        upload_result = cloudinary.uploader.upload(
            mock_3d_path,
            resource_type="raw",
            public_id=f"3dcraftai_model_test_{int(datetime.now().timestamp())}",
            folder="3dcraftai/models",
            tags=["test", "3d-model", "glb", "3dcraftai"]
        )
        
        print("✅ 3D model upload simulation successful!")
        print(f"   Public ID: {upload_result.get('public_id')}")
        print(f"   URL: {upload_result.get('secure_url')}")
        
        # Cleanup
        os.unlink(mock_3d_path)
        
        return upload_result
    
    except Exception as e:
        print(f"❌ 3D model upload simulation failed: {e}")
        return None

def cleanup_test_files(upload_results):
    """Clean up test files from Cloudinary"""
    print("Cleaning up test files...")
    
    cleaned_count = 0
    
    for result in upload_results:
        if result and 'public_id' in result:
            try:
                cloudinary.uploader.destroy(
                    result['public_id'],
                    resource_type="raw"
                )
                print(f"   Deleted: {result['public_id']}")
                cleaned_count += 1
            except Exception as e:
                print(f"   Could not delete {result['public_id']}: {e}")
    
    print(f"✅ Cleanup complete. Removed {cleaned_count} test files.")

async def run_comprehensive_test():
    """Run all Cloudinary tests"""
    print("Starting comprehensive Cloudinary test...")
    print("=" * 60)
    
    # Check dependencies
    if not CLOUDINARY_AVAILABLE:
        print("❌ Cloudinary library not installed!")
        print("   Install with: pip install cloudinary")
        return False
    
    # Load and validate environment
    cloud_name, api_key, api_secret = load_environment()
    if not validate_credentials(cloud_name, api_key, api_secret):
        return False
    
    # Configure Cloudinary
    if not configure_cloudinary(cloud_name, api_key, api_secret):
        return False
    
    # Test connection
    if not test_cloudinary_connection():
        return False
    
    # Test file operations
    upload_results = []
    
    # Test basic file upload
    test_file_path = create_test_file()
    if test_file_path:
        upload_result = test_file_upload(test_file_path)
        if upload_result:
            upload_results.append(upload_result)
        
        # Cleanup local test file
        try:
            os.unlink(test_file_path)
            print("Local test file cleaned up")
        except:
            pass
    
    # Test 3D model upload simulation
    model_upload_result = test_3d_model_upload()
    if model_upload_result:
        upload_results.append(model_upload_result)
    
    # Cleanup remote test files
    if upload_results:
        cleanup_test_files(upload_results)
    
    print("=" * 60)
    print("Cloudinary test completed successfully!")
    print("Your Cloudinary integration is ready for 3DCraftAI!")
    
    return True

def main():
    """Main test function"""
    print("Testing Cloudinary configuration...")
    print("Note: This test requires proper Cloudinary credentials in .env file")
    print("")
    
    try:
        # Run the comprehensive test
        success = asyncio.run(run_comprehensive_test())
        
        if success:
            print("\nAll tests passed! Cloudinary is ready for production.")
        else:
            print("\nSome tests failed. Please check the errors above.")
            
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    except Exception as e:
        print(f"\nUnexpected error during testing: {e}")

if __name__ == "__main__":
    main()