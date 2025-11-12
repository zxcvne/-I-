document.addEventListener("DOMContentLoaded", function () {
  const elJoinForm = document.querySelector("#userInfoForm");
  const elNameInput = document.querySelector('input[name="userName"]');
  const elEmailInput = document.querySelector('input[name="email"]');
  const elPasswordInput = document.querySelector('input[name="pw"]');

  if (!elJoinForm) {
    console.warn("회원가입 폼을 찾을 수 없습니다.");
    return;
  }

  elJoinForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = elNameInput.value.trim();
    const email = elEmailInput.value.trim();
    const password = elPasswordInput.value.trim();

    console.log("--- 회원가입 정보 ---");
    console.log("이름:", name);
    console.log("이메일:", email);
    console.log("비밀번호:", password);
    console.log("------------------");

    if (!name || !email || !password) {
      console.warn("Please enter all values");
      alert("Please enter all values");
      return;
    }

    if (name.length < 2) {
      console.warn("이름은 2자 이상이어야 합니다.");
      alert("이름은 2자 이상 입력해주세요.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn("올바른 이메일 형식이 아닙니다.");
      alert("올바른 이메일 형식을 입력해주세요.");
      return;
    }

    if (password.length < 8) {
      console.warn("비밀번호는 8자 이상이어야 합니다.");
      alert("비밀번호는 8자 이상 입력해주세요.");
      return;
    }

    // 이메일 중복 체크
    if (StorageUtil.isEmailExists(email)) {
      console.warn("이미 사용중인 이메일입니다.");
      alert("이미 사용중인 이메일입니다!");
      return;
    }

    // 회원가입 처리
    console.log("회원가입 시도 중..");

    const userData = {
      name,
      email,
      password,
    };

    StorageUtil.addUser(userData);

    console.log("회원가입 성공");
    console.log("저장된 정보:", userData);

    alert("회원가입이 완료되었습니다!");
    window.open("./login.html", "_blank");
    // 로그인 페이지로 이동
    // window.location.href = "./login.html";
  });
});
