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

    // 유효성 검사
    if (!email || !password) {
      console.warn("이메일과 비밀번호를 모두 입력해주세요.");
      // alert("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn("올바른 이메일 형식이 아닙니다.");
      // alert("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    // 로그인 검증
    console.log("로그인 시도 중..");
    const result = StorageUtil.validateLogin(email, password);

    if (!result.success) {
      // 오류 메시지에 따라 구분된 alert 띄우기
      if (result.message.includes("이메일")) {
        alert("잘못된 이메일입니다.");
      } else if (result.message.includes("비밀번호")) {
        alert("비밀번호가 잘못되었습니다.");
      } else {
        alert(result.message);
      }
      return;
    }

    // 로그인 성공
    StorageUtil.setCurrentUser(result.user);
    //-------------------------------------------------------------------------------
    // ⭐️⭐️⭐️ 수정: 로그인 성공 시 사용자 정보(이름, 이메일)를 sessionStorage에 저장 ⭐️⭐️⭐️
    sessionStorage.setItem(
      "loggedInUser",
      JSON.stringify({
        name: result.user.name,
        email: result.user.email,
      })
    );

    console.log(result.user.name + "님 로그인 성공. 메인 페이지로 이동합니다.");

    // ⭐️⭐️⭐️ 수정: 경로를 절대 경로(/onrunning/main.html)로 가정하여 이동 ⭐️⭐️⭐️
    // 로컬 환경에서 폴더 구조에 따라 상대 경로가 다를 수 있으므로, main.html이 있는 위치로 수정
    window.location.href = "../main/main.html";
  });
});

// 소셜 로그인
document.getElementById("oAuthGoogleBtn").addEventListener("click", () => {
  console.log("구글 로그인 버튼 클릭됨");
  // window.location.href = "/auth/google"; // 임시
});
document.getElementById("oAuthAppleBtn").addEventListener("click", () => {
  console.log("애플 로그인 버튼 클릭됨");
  // window.location.href = "/auth/apple"; // 임시
});
