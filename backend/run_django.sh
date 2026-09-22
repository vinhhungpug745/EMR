#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

python -m pip install -r requirements.txt
python manage.py migrate

if [[ "${SEED_DEMO_DATA:-0}" == "1" ]]; then
    python seed.py
fi

echo 'Thiết lập hoàn tất. Chạy: python manage.py runserver 8000'
