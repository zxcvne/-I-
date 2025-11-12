## 디렉토리 구조

```
--memo--

마지막에 가져온 브렌치 기준으로 이름 작성했습니다.

```

- [x] 로그인 페이지 경로 수정
- [x] oncrew 페이지 경로 수정
- [x] html 파일 이름 수정
- [ ] 디렉토리 구조 수정

<pre>
/ONRUNNING-project  
│  readme.md
│
├─assets
│  ├─images
│  │
│  └─videos
│
├─check
│      check.css
│      check.html
│      check.js
│
├─common
│      font.css
│      header.css
│      header.html
│      header.js
│
├─contact
│      contact.html
│
├─docs
│      guideline.html
│
├─explanation
│      explanation.css
│      explanation.html
│      explanation.js
│
├─main
│      main.css
│      main.html
│      main.js
│
├─mypage
│  │  coming_running_page.html
│  │  mycard.html
│  │  my_running_page.html
│  │  userpage.html
│  │  userprofile.html
│  │
│  ├─mypagesrc
│  │      coming_running_page.js
│  │      mycard.js
│  │      my_running_page.js
│  │      userpage.js
│  │      userprofile.js
│  │
│  └─mypagestyle
│          coming_running_page.css
│          mycard.css
│          my_running_page.css
│          userpage.css
│          userprofile.css
│
├─oncrew
│      oncrew.css
│      oncrew.html
│      oncrew.js
│
├─ongear
│  │  ongear.css
│  │  ongear.html
│  │  ongear.js
│  │
│  └─onGearImage
│
├─onprogram
│      onprogram.css
│      onprogram.html
│      onprogram.js
│
├─qna
│      QnA.css
│      QnA.html
│      QnA.js
│
├─reserve
│      reserve.css
│      reserve.html
│      reserve.js
│      reserve_done.css
│      reserve_done.html
│
├─runtogetherseoul
│      runtogetherseoul.html
│
└─userauth
    │  createAccount.html
    │  login.html
    │
    ├─userAuthSrc
    │      createAccount.js
    │      login-textanimation.js
    │      login-utils.js
    │      login.js
    │
    └─userAuthStyle
            createAccount.css
            login.css
</pre>

## runOnSeoulIntroductionPage

`소개 페이지`

- [x] HTML 구조
- [x] 피그마 참고해서 작성했습니다.
- [x] js : swipe 기능만 작성했습니다. // banner

```
-memo-
- con-box4에 비디오 추가해야됩니다.
```

**1차 완성**

## user-auth

joinLoginPage -> user-auth

`회원가입/로그인 페이지`

- [x] HTML 구조
- [x] CSS
- [x] js : Text Loop // 글자 움직이는 기능
- [x] 회원가입
- [x] 로그인 구현

```
-memo-

- 회원가입시 로컬 스토리지에 저장하는 방식으로 해놨습니다.
- 로컬스토리지에 저장된 데이터 확인해서 로그인 가능하게 구현해놨습니다.

```

**완성**

## onCrewRunnerPage

`러너 소개 페이지`

- [x] HTML 구조

**skip**

## onGearPage

`상품 소개 페이지`

- [x] HTML 구조
- [x] CSS

```
-memo-

상품 이미지에 마우스 호버 시 커서 위치로 기울어지는 js 추가

```

**완성**

## reservationPage

`예약페이지(회원/비회원)`

- [x] HTML 구조
- [x] CSS

```
-memo-
 사용X
```

## 헤더파일

ONRUNNING-project/component/
header.html header.css header.js

-[x] 비로그인시 MYPAGE 버튼을 login 버튼으로 만들고 login시에만 mypage가 가능하도록 html을 js파일로 바꿔서 작업했습니다.

```javascript
/* ----------------------------
   2025.11.09
   Author: Hong Sumin(sumin5400@gmail.com)
   Description: Header menu section JavaScript
----------------------------- */

// header.js
fetch("../component/header.html")
  .then((response) => response.text())
  .then((html) => {
    document.body.insertAdjacentHTML("afterbegin", html);
    initializeHeader();
  });

function initializeHeader() {
  /* ----------------------------------------- 로그인 상태 확인 및 버튼 설정 ----------------------------------------- */
  const authButton = document.getElementById("authBtn");
  const isLoggedIn = checkLoginStatus(); // 로그인 상태 확인 함수

  if (isLoggedIn) {
    authButton.textContent = "MY PAGE";
    authButton.id = "myPageBtn";
  } else {
    authButton.textContent = "LOGIN";
    authButton.id = "loginBtn";
  }

  /* ----------------------------------------- 헤더 메뉴 JS ----------------------------------------- */
  document.getElementById("logoBtn").addEventListener("click", () => {
    window.location.href = "main.html";
  });

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
          window.location.href = "/contact.html";
          break;
        case "myPageBtn":
          window.location.href = "/mypage.html";
          break;
        case "loginBtn":
          window.location.href = "/00_user-auth/login-page.html";
          break;
      }
    });
  });

  document
    .querySelectorAll(".menu-itemList .menu-item")
    .forEach((item, index) => {
      item.addEventListener("click", () => {
        const links = [
          "/runonseoul.html",
          "/oncrew.html",
          "/ongear.html",
          "/onprogram.html",
        ];
        window.location.href = links[index];
      });
    });

  /*************** 메뉴 슬라이더 ***************/
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

  (function () {
    const nav = document.getElementById("menuNav");
    const title = nav.querySelector(".menu-title");
    const itemList = nav.querySelector(".menu-itemList");

    // hover로 열고 닫기
    nav.addEventListener("mouseenter", () => {
      if (isClosed(itemList)) slideDown(itemList);
    });
    nav.addEventListener("mouseleave", () => {
      if (!isClosed(itemList)) slideUp(itemList);
    });
  })();
}

/* ----------------------------------------- 로그인 상태 확인 함수 ----------------------------------------- */

function checkLoginStatus() {
  // 로컬 스토리지나 세션 스토리지에서 토큰 확인
  const token =
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken");

  // 또는 쿠키에서 확인
  // const token = document.cookie.split('; ').find(row => row.startsWith('authToken='));

  return !!token; // 토큰이 있으면 true, 없으면 false
}
```
