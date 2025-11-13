/* ----------------------------
   2025.11.10
   Author: 남현서, Hong Sumin(sumin5400@gmail.com)
   Description: login page JavaScript
----------------------------- */

// createAccount 버튼 클릭 시 회원가입 페이지로 이동
document.getElementById("createAccBtn").addEventListener("click", function () {
  window.open("./createAccount.html", "_blank");
});

// 로그인 폼 제출
document.addEventListener("DOMContentLoaded", function () {
  const elLoginForm = document.getElementById("userInfoForm");
  const elEmailInput = document.querySelector('input[name="email"]');
  const elPasswordInput = document.querySelector('input[name="pw"]');

  if (!elLoginForm) {
    console.warn("로그인 폼을 찾을 수 없습니다.");
    return;
  }

  elLoginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const email = elEmailInput.value.trim();
    const password = elPasswordInput.value.trim();

    if (!email || !password) {
      alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    const result = StorageUtil.validateLogin(email, password);

    if (!result.success) {
      alert(result.message);
      return;
    }

    // ✅ 로그인 성공
    StorageUtil.setCurrentUser(result.user);

    // 🆕 sessionStorage와 localStorage 모두 저장
    const userData = {
      name: result.user.name,
      email: result.user.email,
    };

    // sessionStorage 저장
    sessionStorage.setItem("loggedInUser", JSON.stringify(userData));

    // 🆕 localStorage도 저장 (페이지 이동 전 기록)
    localStorage.setItem("loggedInUser", JSON.stringify(userData));

    console.log("✅ 로그인 성공! 정보 저장됨");
    console.log("sessionStorage:", sessionStorage.getItem("loggedInUser"));
    console.log("localStorage:", localStorage.getItem("loggedInUser"));

    // 메인 페이지로 이동
    setTimeout(() => {
      window.location.href = "../main/main.html";
    }, 500); // 저장 완료 대기
  });
});
