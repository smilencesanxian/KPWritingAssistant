#!/bin/bash
# 阿里云 ECS 一键部署脚本
# 在服务器上执行：bash deploy.sh

set -e

echo "=== KPWritingAssistant 部署脚本 ==="

# 1. 安装 Docker（如已安装则跳过）
if ! command -v docker &> /dev/null; then
  echo "[1/4] 安装 Docker..."
  curl -fsSL https://get.docker.com | sh
  systemctl enable --now docker
else
  echo "[1/4] Docker 已安装，跳过"
fi

# 2. 检查 .env.production 是否存在
if [ ! -f ".env.production" ]; then
  echo ""
  echo "❌ 未找到 .env.production 文件！"
  echo "请先执行："
  echo "  cp .env.production.example .env.production"
  echo "  vim .env.production  # 填入真实密钥"
  exit 1
fi

# 3. 构建并启动
echo "[2/4] 构建 Docker 镜像..."
docker compose build

echo "[3/4] 启动服务..."
docker compose up -d

echo "[4/4] 检查运行状态..."
docker compose ps

echo ""
echo "✅ 部署完成！"
echo "访问地址：http://$(curl -s ifconfig.me):3000"
