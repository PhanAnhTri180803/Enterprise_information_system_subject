// Import các key cấu hình từ file config.js
import { CONFIG, DEFAULT_USERS } from './config.js';

const USER_STORAGE_KEY = CONFIG.USER_STORAGE_KEY;
const CURRENT_USER_STORAGE_KEY = CONFIG.CURRENT_USER_STORAGE_KEY;
const REMEMBERED_ACCOUNTS_KEY = CONFIG.REMEMBERED_ACCOUNTS_KEY;

// Lấy danh sách users từ localStorage, nếu không có thì khởi tạo bằng DEFAULT_USERS
function getUsers() {
  const rawUsers = localStorage.getItem(USER_STORAGE_KEY);

  if (!rawUsers) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  }

  try {
    const users = JSON.parse(rawUsers);
    return Array.isArray(users) ? users : [...DEFAULT_USERS];
  } catch (error) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
    return [...DEFAULT_USERS];
  }
}

// Lưu danh sách users vào localStorage
function saveUsers(users) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(users));
}

// Chuẩn hóa tên tài khoản: xóa khoảng trắng và chuyển thành chữ thường
function normalizeUsername(username) {
  return username.trim().toLowerCase();
}

// Hiển thị thông báo (thành công hoặc lỗi) cho người dùng
function showAuthMessage(message, type) {
  const messageBox = document.getElementById("authMessage");

  if (!messageBox) {
    return;
  }

  if (!message) {
    messageBox.textContent = "";
    messageBox.className = "auth-message";
    return;
  }

  messageBox.textContent = message;
  messageBox.className = `auth-message show ${type}`;
}

// Lấy danh sách tài khoản đã lưu từ localStorage
function getRememberedAccounts() {
  const rawAccounts = localStorage.getItem(REMEMBERED_ACCOUNTS_KEY);

  if (!rawAccounts) {
    return [];
  }

  try {
    const accounts = JSON.parse(rawAccounts);
    return Array.isArray(accounts) ? accounts : [];
  } catch (error) {
    return [];
  }
}

// Lưu danh sách tài khoản đã lưu vào localStorage
function saveRememberedAccounts(accounts) {
  localStorage.setItem(REMEMBERED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

// Cập nhật danh sách gợi ý tài khoản trong datalist
function updateSavedAccountList() {
  const dataList = document.getElementById("savedAccountsList");

  if (!dataList) {
    return;
  }

  dataList.innerHTML = "";
  getRememberedAccounts().forEach((account) => {
    const option = document.createElement("option");
    option.value = account.username;
    dataList.appendChild(option);
  });
}

// Áp dụng tài khoản đã lưu: tự động điền mật khẩu khi người dùng nhập tên tài khoản
function applySavedAccount(value) {
  const username = value.trim();
  const normalizedUsername = normalizeUsername(username);
  const savedAccounts = getRememberedAccounts();

  const exactMatch = savedAccounts.find(
    (account) => normalizeUsername(account.username) === normalizedUsername
  );

  if (exactMatch) {
    document.getElementById("loginPass").value = exactMatch.password;
    document.getElementById("rememberAccount").checked = true;
    return;
  }

  if (normalizedUsername.length >= 2) {
    const partialMatches = savedAccounts.filter((account) =>
      normalizeUsername(account.username).startsWith(normalizedUsername)
    );

    if (partialMatches.length === 1) {
      document.getElementById("loginPass").value = partialMatches[0].password;
      document.getElementById("rememberAccount").checked = true;
    }
  }
}

// Bật/tắt hiển thị mật khẩu ở phần đăng nhập
function toggleLoginPassword() {
  const passwordInput = document.getElementById("loginPass");
  const toggleButton = document.getElementById("toggleLoginPasswordBtn");

  if (!passwordInput || !toggleButton) {
    return;
  }

  const isHidden = passwordInput.type === "password";
  passwordInput.type = isHidden ? "text" : "password";
  toggleButton.textContent = isHidden ? "🙈" : "👁";
  toggleButton.setAttribute("aria-label", isHidden ? "Ẩn mật khẩu" : "Hiện mật khẩu");
}

// Xóa nội dung tất cả trường nhập liệu trong phần đăng ký
function clearRegisterFields() {
  document.getElementById("registerUsername").value = "";
  document.getElementById("registerPassword").value = "";
  document.getElementById("registerConfirmPassword").value = "";
}

// Đặt lại nút toggle mật khẩu về trạng thái ẩn
function resetRegisterPasswordToggle() {
  const passwordInput = document.getElementById("registerPassword");
  const confirmInput = document.getElementById("registerConfirmPassword");

  passwordInput.type = "password";
  confirmInput.type = "password";
}

// Chuyển đổi giữa giao diện đăng nhập và đăng ký, cập nhật tiêu đề trang
function toggleRegisterSection(forceShow) {
  const registerSection = document.getElementById("registerSection");
  const loginSection = document.getElementById("loginSection");
  const authTitle = document.querySelector(".auth-title");
  const authSub = document.querySelector(".auth-sub");

  if (!registerSection || !loginSection || !authTitle || !authSub) {
    return;
  }

  const shouldShow = typeof forceShow === "boolean" ? forceShow : registerSection.hidden;
  registerSection.hidden = !shouldShow;
  loginSection.hidden = shouldShow;

  if (shouldShow) {
    authTitle.textContent = "Đăng ký tài khoản";
    authSub.textContent = "Tạo tài khoản mới để đăng nhập.";
    showAuthMessage("", "");
    document.getElementById("registerUsername").focus();
  } else {
    authTitle.textContent = "Đăng nhập";
    authSub.textContent = "Chào mừng bạn đến Blossom Flower Shop";
    clearRegisterFields();
    resetRegisterPasswordToggle();
    showAuthMessage("", "");
  }
}

// Bật/tắt hiển thị mật khẩu ở phần đăng ký (cả 2 trường: mật khẩu và xác nhận)
function toggleRegisterPasswords() {
  const passwordInput = document.getElementById("registerPassword");
  const confirmInput = document.getElementById("registerConfirmPassword");
  const isHidden = passwordInput.type === "password";
  const nextType = isHidden ? "text" : "password";

  passwordInput.type = nextType;
  confirmInput.type = nextType;
}


// Tạo tài khoản mới với các kiểm tra: tên tài khoản, mật khẩu, tồn tại
function createAccount() {
  const username = document.getElementById("registerUsername").value.trim();
  const password = document.getElementById("registerPassword").value;
  const confirmPassword = document.getElementById("registerConfirmPassword").value;
  const normalizedUsername = normalizeUsername(username);
  const users = getUsers();
  const existedUser = users.find((user) => normalizeUsername(user.username) === normalizedUsername);

  if (!username) {
    showAuthMessage("Vui lòng nhập tên tài khoản.", "error");
    return;
  }

  if (username.length < 4) {
    showAuthMessage("Tên tài khoản cần ít nhất 4 ký tự.", "error");
    return;
  }

  if (!password) {
    showAuthMessage("Vui lòng nhập mật khẩu.", "error");
    return;
  }

  if (password.length < 6) {
    showAuthMessage("Mật khẩu cần ít nhất 6 ký tự.", "error");
    return;
  }

  if (password !== confirmPassword) {
    showAuthMessage("Mật khẩu xác nhận chưa khớp.", "error");
    return;
  }

  if (existedUser) {
    showAuthMessage("Tên tài khoản này đã tồn tại.", "error");
    return;
  }

  users.push({
    username,
    password,
    createdAt: new Date().toISOString()
  });
  saveUsers(users);

  document.getElementById("loginUsername").value = username;
  document.getElementById("loginPass").value = password;
  clearRegisterFields();
  toggleRegisterSection(false);
  showAuthMessage("Tạo tài khoản thành công. Bạn có thể đăng nhập ngay.", "success");
}

// Xử lý đăng nhập: kiểm tra thông tin đăng nhập, lưu tài khoản nếu được chọn
function doLogin() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPass").value;
  const normalizedUsername = normalizeUsername(username);
  const users = getUsers();
  const matchedUser = users.find(
    (user) =>
      normalizeUsername(user.username) === normalizedUsername &&
      user.password === password
  );

  if (!username || !password) {
    showAuthMessage("Vui lòng nhập tên tài khoản và mật khẩu.", "error");
    return;
  }

  if (!matchedUser) {
    showAuthMessage("Sai tên tài khoản hoặc mật khẩu.", "error");
    return;
  }

  if (document.getElementById("rememberAccount").checked) {
    const savedAccounts = getRememberedAccounts();
    const existingIndex = savedAccounts.findIndex(
      (account) => normalizeUsername(account.username) === normalizeUsername(matchedUser.username)
    );

    if (existingIndex >= 0) {
      savedAccounts[existingIndex].password = matchedUser.password;
    } else {
      savedAccounts.push({
        username: matchedUser.username,
        password: matchedUser.password
      });
    }

    saveRememberedAccounts(savedAccounts);
    updateSavedAccountList();
  }

  localStorage.setItem(
    CURRENT_USER_STORAGE_KEY,
    JSON.stringify({
      username: matchedUser.username,
      loginAt: new Date().toISOString()
    })
  );

  showAuthMessage(`Đăng nhập thành công. Xin chào ${matchedUser.username}!`, "success");
}

// Đăng ký xử lý sự kiện phím Enter cho các trường nhập liệu
function registerEnterKeyHandlers() {
  const loginInputs = [
    document.getElementById("loginUsername"),
    document.getElementById("loginPass")
  ];
  const registerInputs = [
    document.getElementById("registerUsername"),
    document.getElementById("registerPassword"),
    document.getElementById("registerConfirmPassword")
  ];

  loginInputs.forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        doLogin();
      }
    });
  });

  registerInputs.forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        createAccount();
      }
    });
  });
}

// Khởi tạo trang xác thực: tải users, cập nhật danh sách lưu, đăng ký event handlers
function initAuthPage() {
  getUsers();
  updateSavedAccountList();
  registerEnterKeyHandlers();
}

window.toggleRegisterSection = toggleRegisterSection;
window.toggleRegisterPasswords = toggleRegisterPasswords;
window.toggleLoginPassword = toggleLoginPassword;
window.applySavedAccount = applySavedAccount;
window.createAccount = createAccount;
window.doLogin = doLogin;

document.addEventListener("DOMContentLoaded", initAuthPage);
