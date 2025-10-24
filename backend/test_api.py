"""
AI Chat Studio Backend - API测试脚本
自动测试所有API端点
"""

import requests
import json
import time
import os
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

# 配置
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
TEST_USER = {
    "username": "testuser",
    "email": "test@example.com",
    "password": "testpassword123"
}

# 颜色输出
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ {message}{Colors.END}")

def print_test(message):
    print(f"{Colors.YELLOW}▶ {message}{Colors.END}")

# 全局变量
access_token = None
conversation_id = None

def test_health_check():
    """测试健康检查"""
    print_test("测试健康检查")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            data = response.json()
            print_success(f"服务运行正常 - {data['status']}")
            print_info(f"活跃连接: {data['active_connections']}")
            return True
        else:
            print_error(f"健康检查失败: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"连接失败: {str(e)}")
        return False

def test_register():
    """测试用户注册"""
    print_test("测试用户注册")
    global access_token

    try:
        # 使用时间戳创建唯一用户名
        unique_user = TEST_USER.copy()
        unique_user["username"] = f"{TEST_USER['username']}_{int(time.time())}"

        response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json=unique_user
        )

        if response.status_code == 200:
            data = response.json()
            access_token = data["access_token"]
            print_success(f"注册成功 - Token: {access_token[:20]}...")
            return True
        else:
            print_error(f"注册失败: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print_error(f"注册异常: {str(e)}")
        return False

def test_get_user_info():
    """测试获取用户信息"""
    print_test("测试获取用户信息")

    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            f"{BASE_URL}/api/auth/me",
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            print_success(f"获取用户信息成功 - 用户: {data['username']}")
            return True
        else:
            print_error(f"获取用户信息失败: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"获取用户信息异常: {str(e)}")
        return False

def test_create_conversation():
    """测试创建对话"""
    print_test("测试创建对话")
    global conversation_id

    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        conversation_data = {
            "id": f"conv_{int(time.time())}",
            "title": "测试对话",
            "messages": [],
            "createdAt": int(time.time() * 1000),
            "updatedAt": int(time.time() * 1000),
            "model": "gpt-3.5-turbo",
            "userId": "test_user"
        }

        response = requests.post(
            f"{BASE_URL}/api/conversations",
            headers=headers,
            json=conversation_data
        )

        if response.status_code == 200:
            data = response.json()
            conversation_id = data["id"]
            print_success(f"创建对话成功 - ID: {conversation_id}")
            return True
        else:
            print_error(f"创建对话失败: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"创建对话异常: {str(e)}")
        return False

def test_get_conversations():
    """测试获取对话列表"""
    print_test("测试获取对话列表")

    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            f"{BASE_URL}/api/conversations",
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            print_success(f"获取对话列表成功 - 共 {len(data)} 个对话")
            return True
        else:
            print_error(f"获取对话列表失败: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"获取对话列表异常: {str(e)}")
        return False

def test_chat():
    """测试聊天API"""
    print_test("测试聊天API")

    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        chat_data = {
            "messages": [
                {
                    "id": "msg1",
                    "content": "你好",
                    "role": "user",
                    "timestamp": int(time.time() * 1000)
                }
            ],
            "model": "gpt-3.5-turbo",
            "temperature": 0.7,
            "max_tokens": 2048,
            "stream": False
        }

        response = requests.post(
            f"{BASE_URL}/api/chat",
            headers=headers,
            json=chat_data
        )

        if response.status_code == 200:
            data = response.json()
            print_success(f"聊天成功 - 响应: {data['content'][:50]}...")
            print_info(f"Tokens: {data['tokens']}, Model: {data['model']}")
            return True
        else:
            print_error(f"聊天失败: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"聊天异常: {str(e)}")
        return False

def test_get_stats():
    """测试获取统计信息"""
    print_test("测试获取统计信息")

    try:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(
            f"{BASE_URL}/api/stats",
            headers=headers
        )

        if response.status_code == 200:
            data = response.json()
            print_success("获取统计信息成功")
            print_info(f"对话数: {data['total_conversations']}")
            print_info(f"消息数: {data['total_messages']}")
            print_info(f"Tokens: {data['total_tokens']}")
            return True
        else:
            print_error(f"获取统计信息失败: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"获取统计信息异常: {str(e)}")
        return False

def run_all_tests():
    """运行所有测试"""
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}AI Chat Studio Backend - API测试{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

    tests = [
        ("健康检查", test_health_check),
        ("用户注册", test_register),
        ("获取用户信息", test_get_user_info),
        ("创建对话", test_create_conversation),
        ("获取对话列表", test_get_conversations),
        ("聊天API", test_chat),
        ("统计信息", test_get_stats),
    ]

    results = []
    for name, test_func in tests:
        try:
            success = test_func()
            results.append((name, success))
            print()  # 空行
        except Exception as e:
            print_error(f"测试 '{name}' 发生异常: {str(e)}")
            results.append((name, False))
            print()

    # 打印测试总结
    print(f"\n{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BLUE}测试总结{Colors.END}")
    print(f"{Colors.BLUE}{'='*60}{Colors.END}\n")

    passed = sum(1 for _, success in results if success)
    total = len(results)

    for name, success in results:
        status = f"{Colors.GREEN}✓ PASS{Colors.END}" if success else f"{Colors.RED}✗ FAIL{Colors.END}"
        print(f"{status} - {name}")

    print(f"\n{Colors.BLUE}总计: {passed}/{total} 通过{Colors.END}")

    if passed == total:
        print(f"{Colors.GREEN}\n🎉 所有测试通过!{Colors.END}\n")
    else:
        print(f"{Colors.YELLOW}\n⚠ 部分测试失败{Colors.END}\n")

if __name__ == "__main__":
    run_all_tests()
