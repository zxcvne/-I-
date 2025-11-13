/* ----------------------------
   2025.11.10
   Author: Hong Sumin(sumin5400@gmail.com)
   Description: Header menu section JavaScript (개선판)
   - 헤더 HTML 캐싱 (불필요한 리렌더링 제거)
   - 중복 함수 제거
   - 메뉴 토글 기능 추가
----------------------------- */

let headerInitialized = false; // 헤더 초기화 여부 플래그

// header.html 캐싱
let cachedHeader = null;

// 헤더 초기화 (최초 1회만 실행)
function initializeHeaderOnce() {
  if (headerInitialized) return; // 이미 초기화되었으면 실행 안 함

  // 이미 header가 DOM에 있으면 바로 이벤트 리스너만 설정
  if (document.querySelector(".header-container")) {
    setupHeaderEventListeners();
    headerInitialized = true;
    return;
  }

  // header HTML이 없으면 fetch해서 추가
  if (!cachedHeader) {
    fetch("../common/header.html")
      .then((response) => response.text())
      .then((html) => {
        cachedHeader = html;
        document.body.insertAdjacentHTML("afterbegin", html);
        setupHeaderEventListeners();
        updateAuthButton();
        headerInitialized = true;
      })
      .catch((error) => console.error("헤더 로드 실패:", error));
  } else {
    document.body.insertAdjacentHTML("afterbegin", cachedHeader);
    setupHeaderEventListeners();
    updateAuthButton();
    headerInitialized = true;
  }
}

// 로그인 상태에 따라 인증 버튼 업데이트
function updateAuthButton() {
  const authButton = document.getElementById("authBtn");
  if (!authButton) return;

  const isLoggedIn = checkLoginStatus();
  console.log(
    "updateAuthButton 실행:",
    isLoggedIn ? "MY PAGE로 표시" : "LOGIN으로 표시"
  );

  if (isLoggedIn) {
    authButton.textContent = "MY PAGE";
    authButton.id = "myPageBtn";
  } else {
    authButton.textContent = "LOGIN";
    authButton.id = "loginBtn";
  }
}

// 헤더 이벤트 리스너 설정
function setupHeaderEventListeners() {
  // 로고 버튼
  const logoBtn = document.getElementById("logoBtn");
  if (logoBtn) {
    logoBtn.addEventListener("click", () => {
      window.location.href = "../main/main.html";
    });
  }

  // 우측 박스 버튼들 (SHOP, CONTACT, LOGIN/MY PAGE)
  document.querySelectorAll(".right-box button").forEach((btn) => {
    btn.addEventListener("click", () => {
      switch (btn.id) {
        case "shopBtn":
          window.open(
            "https://www.on.com/ko-kr/?srsltid=AfmBOopJbv_K0c-F0RsrUz6mfpNJ2z-j05tYoqkHJo9bZuJi6Uv1ak-Q",
            "_blank"
          );
          break;
        case "contactBtn":
          window.location.href = "../contact/contact.html";
          break;
        case "myPageBtn":
          window.location.href = "../mypage/userpage.html";
          break;
        case "loginBtn":
          window.location.href = "../userauth/login.html";
          break;
      }
    });
  });

  // 메뉴 아이템들
  document
    .querySelectorAll(".menu-itemList .menu-item")
    .forEach((item, index) => {
      item.addEventListener("click", () => {
        const links = [
          "../runtogetherseoul/runtogetherseoul.html",
          "../oncrew/oncrew.html",
          "../ongear/ongear.html",
          "../onprogram/onprogram.html",
        ];
        window.location.href = links[index];
      });
    });

  // 메뉴 토글 설정
  setupMenuToggle();
}

/* ============================================================
   메뉴 슬라이드 애니메이션 함수
============================================================ */

function slideDown(el) {
  el.style.display = "block";
  el.style.height = "auto";
  const h = el.scrollHeight;
  el.style.height = "0px";
  requestAnimationFrame(() => {
    el.style.height = h + "px";
  });

  const onEnd = () => {
    el.style.height = "auto";
    el.removeEventListener("transitionend", onEnd);
  };
  el.addEventListener("transitionend", onEnd);
}

function slideUp(el) {
  const h = el.scrollHeight;
  el.style.height = h + "px";
  requestAnimationFrame(() => {
    el.style.height = "0px";
  });

  const onEnd = () => {
    el.style.display = "none";
    el.removeEventListener("transitionend", onEnd);
  };
  el.addEventListener("transitionend", onEnd);
}

function isClosed(el) {
  return getComputedStyle(el).height === "0px";
}

/* ============================================================
   메뉴 토글 설정 (Hover + Click)
============================================================ */

function setupMenuToggle() {
  const nav = document.getElementById("menuNav");
  if (!nav) return;

  const menuTitle = nav.querySelector(".menu-title");
  const itemList = nav.querySelector(".menu-itemList");

  if (!menuTitle || !itemList) return;

  // 상태 관리
  let isMenuOpen = false;

  // 메뉴 제목 클릭 시 토글
  menuTitle.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isMenuOpen) {
      slideUp(itemList);
      isMenuOpen = false;
    } else {
      slideDown(itemList);
      isMenuOpen = true;
    }
  });

  // 메뉴 아이템 클릭 시 닫기
  itemList.querySelectorAll(".menu-item").forEach((item) => {
    item.addEventListener("click", () => {
      slideUp(itemList);
      isMenuOpen = false;
    });
  });
}

/* ============================================================
   로그인 상태 확인 함수 (통합)
============================================================ */

function checkLoginStatus() {
  // sessionStorage의 loggedInUser 확인 (login.js에서 저장)
  const loggedInUser =
    sessionStorage.getItem("loggedInUser") ||
    localStorage.getItem("loggedInUser");
  console.log(
    "checkLoginStatus 체크: ",
    loggedInUser ? "로그인됨" : "로그아웃"
  );
  return !!loggedInUser;
}

/* ============================================================
   페이지 로드 시 초기화
============================================================ */

// DOMContentLoaded 후 초기화
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeHeaderOnce);
} else {
  initializeHeaderOnce();
}

// 페이지 이동 후 돌아왔을 때 인증 상태 업데이트
window.addEventListener("pageshow", () => {
  updateAuthButton();
});
