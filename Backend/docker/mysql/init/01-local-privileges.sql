-- 仅本地开发：Prisma Migrate 需要创建 shadow database。
-- 默认 MYSQL_USER 只有 floraverse 库权限，这里额外授予本机 app 账号建库权限。
-- 生产数据库不要执行本脚本。
GRANT ALL PRIVILEGES ON *.* TO 'app'@'%';
FLUSH PRIVILEGES;
