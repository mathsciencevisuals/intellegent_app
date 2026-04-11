docker start intelligent-app-db
for attempt in $(seq 1 30); do
  if npx prisma migrate status >/dev/null 2>&1; then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    echo "Database did not become ready in time."
    exit 1
  fi

  sleep 2
done

npx prisma generate
npx prisma migrate deploy
npm run dev
