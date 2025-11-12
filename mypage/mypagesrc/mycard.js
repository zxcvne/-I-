// [CSS 참고]: 이 스크립트는 CSS와 상호작용합니다.
// - [JS Dynamic Text]: #card-user-name, #card-user-info의 텍스트를 채웁니다.
// - [CSS Dynamic HTML]: #qr-code-container 내부에 <canvas> 또는 <img> 태그를 생성합니다.
// - [CSS Inline Style]: #qr-code-container의 padding 스타일을 오류 발생 시 변경할 수 있습니다.

// alert() 대신 사용할 임시 토스트 (콘솔 출력)
function showToast(message) {
  console.log("[App Toast]:", message);
  // (userprofile.html의 showToast 함수와 동일한 기능)
}

// 페이지 로드 완료 시 실행
window.onload = function () {
  // [JS] userpage.html에서 window.open()으로 전달한 URL 파라미터(쿼리 스트링)를 읽습니다.
  const params = new URLSearchParams(window.location.search);

  // ⭐️ userEmail을 QR 코드 내용으로 사용합니다.
  const userEmail = params.get("userEmail");
  const userName = params.get("userName");
  const memberId = params.get("memberId");
  const joinDate = params.get("joinDate");

  // [JS Target] [CSS 참고] 정보를 표시할 DOM 요소를 선택합니다.
  const elUserName = document.getElementById("card-user-name");
  const elUserInfo = document.getElementById("card-user-info");

  // ⭐️ [JS Dynamic Text] 선택된 요소에 URL 파라미터 값을 채워넣습니다.
  elUserName.textContent = userName ? userName : userEmail || "방문자";
  elUserInfo.innerHTML =
    memberId && joinDate
      ? `회원 번호: ${memberId}<br>등록일: ${joinDate}`
      : "정보 없음";

  // [JS Target] [CSS 참고] QR 코드가 삽입될 컨테이너 요소를 선택합니다.
  const elQrContainer = document.getElementById("qr-code-container");

  if (userEmail) {
    // ⭐️ [CSS Dynamic HTML]
    // qrcode.js 라이브러리를 사용하여 #qr-code-container 내부에 QR 코드를 생성합니다.
    // 이 라이브러리는 내부에 <canvas> 또는 <img> 태그를 주입합니다.
    const qrContent = `ONRUNNING|${userEmail}|${userName}`; // QR 코드에 담길 텍스트

    new QRCode(elQrContainer, {
      text: qrContent,
      width: 230, // ⭐️ 생성될 QR 코드의 너비 (CSS가 아닌 JS가 제어)
      height: 230, // ⭐️ 생성될 QR 코드의 높이 (CSS가 아닌 JS가 제어)
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  } else {
    // [JS Dynamic Text] [CSS Inline Style]
    // 이메일 값이 없어 QR 생성 실패 시, 에러 메시지를 표시합니다.
    elQrContainer.textContent = "로그인 정보 없음";
    elQrContainer.style.padding = "20px"; // [CSS Inline Style] 오류 시 패딩 변경
  }
};
