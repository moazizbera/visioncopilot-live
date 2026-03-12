"""
Quick Test Script for VisionCopilot Live Backend

Tests:
1. Health check
2. Session creation
3. Chat interaction
"""

import asyncio
import httpx


BASE_URL = "http://localhost:8000"


async def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    async with httpx.AsyncClient() as client:
        response = await client.get(f"{BASE_URL}/api/health")
        print(f"✅ Health check: {response.json()}")
        return response.status_code == 200


async def test_session_creation():
    """Test session creation"""
    print("\n🔍 Testing session creation...")
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/sessions/",
            json={"user_id": "test_user"}
        )
        data = response.json()
        print(f"✅ Session created: {data['session_id']}")
        return data['session_id']


async def test_chat(session_id: str):
    """Test chat endpoint"""
    print(f"\n🔍 Testing chat with session {session_id}...")
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            f"{BASE_URL}/api/chat/",
            json={
                "prompt": "Hello! Can you introduce yourself?",
                "session_id": session_id,
                "include_history": False
            }
        )
        data = response.json()
        print(f"✅ AI Response: {data['response'][:200]}...")
        return response.status_code == 200


async def test_websocket():
    """Test WebSocket connection"""
    print("\n🔍 Testing WebSocket connection...")
    print("⚠️  WebSocket test requires manual testing - see docs/websocket-protocol.md")


async def main():
    """Run all tests"""
    print("=" * 60)
    print("VisionCopilot Live Backend Test Suite")
    print("=" * 60)
    
    try:
        # Test 1: Health check
        health_ok = await test_health()
        if not health_ok:
            print("❌ Health check failed")
            return
        
        # Test 2: Create session
        session_id = await test_session_creation()
        
        # Test 3: Chat
        try:
            chat_ok = await test_chat(session_id)
            if chat_ok:
                print("\n✅ All basic tests passed!")
            else:
                print("\n⚠️  Chat test failed - check if GEMINI_API_KEY is configured")
        except Exception as e:
            print(f"\n⚠️  Chat test failed: {e}")
            print("   This is expected if GEMINI_API_KEY is not configured")
        
        # Test 4: WebSocket
        await test_websocket()
        
        print("\n" + "=" * 60)
        print("Test suite completed!")
        print("=" * 60)
    
    except httpx.ConnectError:
        print("\n❌ Could not connect to backend server")
        print("   Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")


if __name__ == "__main__":
    asyncio.run(main())
