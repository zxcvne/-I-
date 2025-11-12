const StorageUtil = {
  // 모든 사용자 가져오기
  getUsers() {
    const users = localStorage.getItem("users");
    return users ? JSON.parse(users) : [];
  },

  // 사용자 추가
  addUser(userData) {
    const users = this.getUsers();
    users.push({
      ...userData,
      id: Date.now(), // 고유 ID 생성
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem("users", JSON.stringify(users));
    return true;
  },

  // 이메일로 사용자 찾기
  findUserByEmail(email) {
    const users = this.getUsers();
    return users.find((user) => user.email === email);
  },

  // 로그인 검증
  validateLogin(email, password) {
    const user = this.findUserByEmail(email);
    if (!user) {
      return { success: false, message: "존재하지 않는 이메일입니다." };
    }
    if (user.password !== password) {
      return { success: false, message: "비밀번호가 일치하지 않습니다." };
    }
    return { success: true, user };
  },

  // 현재 로그인한 사용자 저장
  setCurrentUser(user) {
    localStorage.setItem("currentUser", JSON.stringify(user));
  },

  // 현재 로그인한 사용자 가져오기
  getCurrentUser() {
    const user = localStorage.getItem("currentUser");
    return user ? JSON.parse(user) : null;
  },

  // 로그아웃
  logout() {
    localStorage.removeItem("currentUser");
  },

  // 이메일 중복 체크
  isEmailExists(email) {
    return this.findUserByEmail(email) !== undefined;
  },
};
