# app/database/connection.py
import os
import logging

logger = logging.getLogger(__name__)

# Global variable to store the database connection
database = None

async def connect_to_mongodb():
    """Connect to MongoDB database"""
    global database
    
    try:
        # Try to import motor
        import motor.motor_asyncio
        from pymongo.errors import ConnectionFailure
        
        # Get MongoDB URL from environment variables
        mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        database_name = os.getenv("DATABASE_NAME", "3dcraft_ai")
        
        # Create MongoDB client
        client = motor.motor_asyncio.AsyncIOMotorClient(mongodb_url)
        
        # Test the connection
        await client.admin.command('ping')
        
        # Get the database
        database = client[database_name]
        
        logger.info(f"✅ Connected to MongoDB at {mongodb_url}")
        logger.info(f"✅ Using database: {database_name}")
        
        return database
        
    except ImportError as e:
        logger.error(f"❌ Motor/PyMongo not installed: {e}")
        logger.warning("⚠️ Install with: pip install motor pymongo")
        return None
    except ConnectionRefusedError as e:
        logger.error(f"❌ MongoDB connection refused: {e}")
        logger.warning("⚠️ Make sure MongoDB is running on localhost:27017")
        return None
    except Exception as e:
        logger.error(f"❌ Unexpected error connecting to MongoDB: {e}")
        logger.warning("⚠️ Continuing without MongoDB for development")
        return None

async def close_mongodb_connection():
    """Close MongoDB connection"""
    global database
    
    if database:
        database.client.close()
        logger.info("✅ MongoDB connection closed")

def get_database():
    """Get the current database instance"""
    global database
    return database  # Can be None in development
