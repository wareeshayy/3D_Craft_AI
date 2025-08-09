# Multiple AI service integrations
class MeshGenerator:
    def __init__(self):
        self.services = {
            'openai': OpenAI3DService(),
            'stability': StabilityAIService(),
            'huggingface': HuggingFaceService(),
            'local': LocalMeshService()
        }
    
    async def generate_mesh(self, prompt: str, service: str = 'openai'):
        return await self.services[service].generate(prompt)