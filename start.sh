docker start intelligent-app-db
sleep 2
npx prisma generate
npm run dev
