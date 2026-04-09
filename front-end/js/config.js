// Các key cấu hình ứng dụng
// ⚠️ CẢNH BÁO: File này phải được thêm vào .gitignore để tránh lộ thông tin
export const CONFIG = {
  USER_STORAGE_KEY: "bloom_flower_shop_users",
  CURRENT_USER_STORAGE_KEY: "bloom_flower_shop_current_user",
  REMEMBERED_ACCOUNTS_KEY: "bloom_flower_shop_saved_accounts"
};

export const DEFAULT_USERS = [
  {
    username: "admin",
    password: "123456",
    createdAt: "2026-04-07T00:00:00.000Z"
  }
];
