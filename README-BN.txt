লিমন রেফ্রিজারেটর — Production Online Version

প্রথম login:
Username: admin
Password: 1234

Railway-এ চালানোর সংক্ষিপ্ত নিয়ম:
1) Railway-তে নতুন Project তৈরি করুন।
2) PostgreSQL Database service যোগ করুন।
3) এই project-এর ফাইল GitHub repository-তে upload করুন অথবা Railway-তে deploy করুন।
4) App service-এর Variables-এ:
   DATABASE_URL = আপনার PostgreSQL-এর DATABASE_URL
   JWT_SECRET = একটি দীর্ঘ random secret
5) Start command: npm start
6) App-এর জন্য Generate Domain করুন।
7) প্রথমবার login করে পরে admin password বদলানো উচিত।

এই ভার্সনে SQLite নয়, PostgreSQL ব্যবহার করা হয়েছে, তাই production online database-এর জন্য তৈরি।
