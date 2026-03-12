#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""Test Arabic text with Gemini API"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ai.gemini_client import GeminiClient

async def test_arabic():
    """Test Arabic text generation"""
    
    print("🧪 Testing Gemini API with Arabic text...")
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("❌ ERROR: GEMINI_API_KEY environment variable not set")
        print("   Please set it in your .env file or environment")
        return
    print(f"API Key configured: {bool(api_key)}")
    
    try:
        client = GeminiClient(api_key=api_key)
        
        # Test 1: English
        print("\n✅ Test 1: English")
        english_response = await client.generate_text("Hello, how are you?")
        print(f"Response: {english_response[:100]}...")
        
        # Test 2: Arabic
        print("\n✅ Test 2: Arabic")
        arabic_prompt = "مرحبا، كيف حالك؟"  # Hello, how are you? in Arabic
        print(f"Prompt: {arabic_prompt}")
        arabic_response = await client.generate_text(arabic_prompt)
        print(f"Response: {arabic_response[:200]}...")
        
        # Test 3: Mixed
        print("\n✅ Test 3: Mixed English and Arabic")
        mixed_prompt = "Please explain: مرحبا means hello in Arabic"
        print(f"Prompt: {mixed_prompt}")
        mixed_response = await client.generate_text(mixed_prompt)
        print(f"Response: {mixed_response[:200]}...")
        
        print("\n✅ ALL TESTS PASSED!")
        return True
        
    except Exception as e:
        print(f"\n❌ ERROR: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    result = asyncio.run(test_arabic())
    sys.exit(0 if result else 1)
