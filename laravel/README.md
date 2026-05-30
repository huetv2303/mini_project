docker compose build --no-cache

git merge --abort (quay lại trước khi merge)
git reset --hard HEAD (hủy pull khi confict)

docker exec -it laravel-app php artisan storage:link

docker compose down
docker compose build
docker compose up -d
