// [CSS 참고]: 이 스크립트는 CSS와 상호작용합니다.
// - [CSS Class]: .active, .restricted, .dimmed 등의 클래스를 동적으로 추가/제거합니다.
// - [CSS Dynamic HTML]: 특정 요소(#nextRunInfo, .stamp-grid 등)의 내부 HTML을 생성합니다.
// - [CSS Inline Style]: .showCustomToast() 함수에서 토스트 메시지 스타일을 직접 생성합니다.

// --- ⭐️ API 엔드포인트 ---
const CREW_API =
  "https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e";
const RESERVE_API =
  "https://api.sheetbest.com/sheets/4e2d77b5-9ae8-4a14-bfee-5b7dffe35b95";

// --- 1. 로그인 상태 및 데이터 정의 ---
// (CSS 담당자는 이 로직 자체는 크게 신경 쓰지 않아도 됩니다.)
let currentUserEmail = "onrunning@example.com";
let currentUserName = "비회원";
const isLoggedIn = !!sessionStorage.getItem("loggedInUser");

if (isLoggedIn) {
  try {
    const user = JSON.parse(sessionStorage.getItem("loggedInUser"));
    currentUserEmail = user.email || currentUserEmail;
    currentUserName = user.name || currentUserName;
  } catch (e) {
    console.error("세션 사용자 정보 파싱 오류:", e);
  }
}

// [CSS 참고]: 이 키는 onprogram.js와 동일하며, localStorage에서 북마크 데이터를 읽는 데 사용됩니다.
const LOCAL_STORAGE_ID_KEY = isLoggedIn
  ? `bookmarkedCrewIds_${currentUserEmail}`
  : "bookmarkedCrewIds_guest";
const LOCAL_STORAGE_DATA_KEY = isLoggedIn
  ? `bookmarkedRuns_${currentUserEmail}`
  : "bookmarkedRuns_guest";

// [JS] CSS 작업용 주석:
// -----------------------------------------------------------------
// [수정] userState에 하드코딩된 회원번호/등록일을
// localStorage "users" DB에서 실제 회원 정보로 대체합니다.
// -----------------------------------------------------------------
let actualMemberId = "12345678"; // 비회원 또는 오류 시 기본값
let actualJoinDate = "2025.01.01"; // 비회원 또는 오류 시 기본값

if (isLoggedIn) {
  try {
    // 1. localStorage에서 "users" DB 전체를 가져옵니다.
    const allUsers = JSON.parse(localStorage.getItem("users") || "[]");

    // 2. 현재 로그인한 이메일로 사용자 정보를 찾습니다.
    const foundUser = allUsers.find((user) => user.email === currentUserEmail);

    if (foundUser) {
      // 3. 찾은 사용자의 ID와 createdAt(가입일)을 사용합니다.
      actualMemberId = foundUser.id || actualMemberId; // 예: 1678886400000

      // 4. createdAt (ISO string)을 "YYYY.MM.DD" 형식으로 변경합니다.
      if (foundUser.createdAt) {
        const date = new Date(foundUser.createdAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // 0 -> 01
        const day = String(date.getDate()).padStart(2, "0"); // 5 -> 05
        actualJoinDate = `${year}.${month}.${day}`;
      }
    }
  } catch (e) {
    console.error("localStorage 사용자 정보 파싱 오류:", e);
    // 오류 발생 시 기본값을 사용합니다.
  }
}
// [수정 완료]

const userState = {
  name: currentUserName,
  userId: "user-kR-12345678", // ⭐️ 이 값은 현재 QR코드 생성용으로만 사용됩니다.
  memberId: actualMemberId, // [수정] 하드코딩된 "12345678" -> actualMemberId
  joinDate: actualJoinDate, // [수정] 하드코딩된 "2025.01.01" -> actualJoinDate
  bio: isLoggedIn
    ? `${currentUserName}님은 함께 달리는 기쁨을 아는 러너입니다! 🏃‍♂️`
    : "로그인 후 다양한 러닝 정보와 통계를 확인해보세요.",
  totalRuns: 0,
  totalDistance: 0.0,
  upcomingRuns: 0,
  stamps: 8,
  bookmarks: 0,
};

// --- 2. DOM 요소 선택 ---
// [CSS 참고]: 이 ID를 가진 요소들이 JS에 의해 제어됩니다.
const elUserNameDisplay = document.getElementById("userNameDisplay");
const elUserBioDisplay = document.getElementById("userBioDisplay");
const elTotalRunsDisplay = document.getElementById("totalRunsDisplay");
const elTotalDistanceDisplay = document.getElementById("totalDistanceDisplay");
const elStampCountDisplay = document.getElementById("stampCountDisplay");
const elBookmarkCountDisplay = document.getElementById("bookmarkCountDisplay");

const elEditProfileBtn = document.getElementById("editProfileBtn");
const elViewMyCardBtn = document.getElementById("viewMyCardBtn");
const elMyGearBtn = document.getElementById("myGearBtn");
const elUpcomingRunsBtn = document.getElementById("upcomingRunsBtn");
const elStampListBtn = document.getElementById("stampListBtn");
const elViewBookmarksBtn = document.getElementById("viewBookmarksBtn");

// [CSS 참고]: 모달 제어용 요소
const elStampModalOverlay = document.getElementById("stampModalOverlay");
const elStampModalCloseBtn = document.getElementById("stampModalCloseBtn");
const elStampModalStatus = document.getElementById("stampModalStatus");
const elStampGrid = document.querySelector(".stamp-grid"); // 스탬프 모달

const elBookmarkModalOverlay = document.getElementById("bookmarkModalOverlay");
const elBookmarkModalCloseBtn = document.getElementById(
  "bookmarkModalCloseBtn"
);
const elBookmarkModalList = document.getElementById("bookmarkModalList"); // 북마크 모달

// --- 3. 데이터 렌더링 함수 ---

/**
 * ⭐️ [CSS Dynamic HTML]
 * '다음 러닝' 정보를 카드에 렌더링합니다. (id="profileNextRunInfo")
 * (이 함수는 .run-date, .run-name 등의 HTML을 동적으로 생성합니다)
 */
function renderNextUpcomingRun(upcomingRuns, isError = false) {
  // ⭐️ [수정] 타겟 ID를 'profileNextRunInfo'에서 'nextRunInfoDisplay'로 변경
  const elNextRunInfo = document.getElementById("nextRunInfoDisplay");
  if (!elNextRunInfo) return;

  if (isError) {
    elNextRunInfo.innerHTML = `<p class="no-run-message">정보 로드 실패</p>`;
    return;
  }

  if (!upcomingRuns || upcomingRuns.length === 0) {
    elNextRunInfo.innerHTML = `<p class="no-run-message">예정된 러닝이 없습니다.</p>`;
    return;
  }

  // 1. 날짜순으로 정렬 (오름차순)
  upcomingRuns.sort((a, b) => {
    const dateA = new Date((a.schedule || "9999-12-31").replace(/\./g, "-"));
    const dateB = new Date((b.schedule || "9999-12-31").replace(/\./g, "-"));
    return dateA - dateB;
  });

  // 2. 가장 빠른 러닝 정보
  const nextRun = upcomingRuns[0];
  const [date, time] = nextRun.schedule.split(" ");

  // 3. HTML 렌더링
  elNextRunInfo.innerHTML = `
        <span class="run-date">${date} (${time})</span>
        <span class="run-name">${nextRun.name}</span>
        <span class="run-details">${nextRun.distance}km · ${nextRun.level} 레벨</span>
    `;
}

/**
 * ⭐️ [CSS Dynamic Text]
 * 프로필 통계 텍스트를 업데이트합니다.
 */
function renderProfileData(stats) {
  // 정적 데이터 렌더링
  if (elUserNameDisplay) elUserNameDisplay.textContent = userState.name;
  if (elUserBioDisplay) elUserBioDisplay.textContent = userState.bio;
  if (elStampCountDisplay) elStampCountDisplay.textContent = userState.stamps;

  // ⭐️ 동적 데이터 렌더링
  if (elTotalRunsDisplay) elTotalRunsDisplay.textContent = stats.totalRuns;
  if (elTotalDistanceDisplay)
    elTotalDistanceDisplay.textContent = stats.totalDistance.toFixed(1);
}

/**
 * ⭐️ [CSS Dynamic Text]
 * 북마크 카운트만 별도로 렌더링 (localStorage)
 */
function renderBookmarkCount() {
  if (!isLoggedIn) {
    userState.bookmarks = 0;
  } else {
    const bookmarksData = JSON.parse(
      localStorage.getItem(LOCAL_STORAGE_DATA_KEY) || "[]"
    );
    userState.bookmarks = bookmarksData.length;
  }

  if (elBookmarkCountDisplay)
    elBookmarkCountDisplay.textContent = userState.bookmarks;
}

/**
 * ⭐️ [CSS Dynamic HTML]
 * 북마크 모달 목록을 렌더링합니다. (id="bookmarkModalList")
 * (이 함수는 .registered-item 구조를 동적으로 생성합니다)
 */
function renderBookmarkModalList() {
  if (!elBookmarkModalList || !isLoggedIn) return;

  elBookmarkModalList.innerHTML = "";

  const bookmarksData = JSON.parse(
    localStorage.getItem(LOCAL_STORAGE_DATA_KEY) || "[]"
  );

  if (bookmarksData.length === 0) {
    elBookmarkModalList.innerHTML =
      '<p style="color: #6b7280; grid-column: 1 / -1; text-align: center;">북마크한 러닝이 없습니다.</p>';
    return;
  }

  // .registered-item HTML 구조 생성
  bookmarksData.forEach((run) => {
    const itemHtml = `
              <div class="registered-item">
                  <div class="item-info-box">
                      <div class="item-info-row">
                          <span class="info-label">위치</span>
                          <span class="info-value">${run.location}</span>
                      </div>
                      <!-- ... (기타 정보 행) ... -->
                      <div class="item-info-row">
                          <span class="info-label">날짜</span>
                          <span class="info-value">${run.date}</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">출발지</span>
                          <span class="info-value">${
                            run.departure || "정보 없음"
                          }</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">도착지</span>
                          <span class="info-value">${
                            run.destination || "정보 없음"
                          }</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">거리</span>
                          <span class="info-value">${
                            run.distance ? run.distance + "km" : "정보 없음"
                          }</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">레벨</span>
                          <span class="info-value">${
                            run.level || "정보 없음"
                          }</span>
                      </div>
                  </div>
                  <!-- ⭐️ [수정] 경로 수정 (../ -> ../../) -->
                  <a href="../../${run.link}" class="item-link" data-id="${
      run.id
    }" target="_blank">상세보기</a>
              </div>
          `;
    elBookmarkModalList.insertAdjacentHTML("beforeend", itemHtml);
  });
}

/**
 * ⭐️ [CSS Dynamic HTML] [CSS Class]
 * 스탬프 모달 렌더링 함수 (class="stamp-grid")
 * (이 함수는 .stamp-item / .stamp-item.dimmed 구조를 동적으로 생성합니다)
 */
function renderStampModal() {
  if (!elStampGrid || !elStampModalStatus || !isLoggedIn) return;

  const totalStamps = 10;
  const currentStamps = userState.stamps;
  const remainingStamps = Math.max(0, totalStamps - currentStamps);
  elStampGrid.innerHTML = "";

  for (let i = 0; i < totalStamps; i++) {
    const isStamped = i < currentStamps;
    // [CSS Class] 스탬프 획득 여부에 따라 .dimmed 클래스 토글
    const stampClass = isStamped ? "stamp-item" : "stamp-item dimmed";

    const itemHtml = `
              <div class="${stampClass}">
                  <svg class="placeholder-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              </div>
          `;
    elStampGrid.insertAdjacentHTML("beforeend", itemHtml);
  }

  elStampModalStatus.textContent = `앞으로 ${remainingStamps}개 남았습니다.`;
}

// --- ⭐️ 모달 여닫기 함수 ---
/**
 * ⭐️ [CSS Class]
 * 스탬프 모달에 '.active' 클래스를 추가하여 표시합니다.
 */
function openStampModal() {
  if (!isLoggedIn) return showCustomToast("로그인 후 이용 가능한 기능입니다.");
  renderStampModal(); // [CSS Dynamic HTML] 호출
  if (elStampModalOverlay) elStampModalOverlay.classList.add("active");
}
/**
 * ⭐️ [CSS Class]
 * 스탬프 모달에서 '.active' 클래스를 제거하여 숨깁니다.
 */
function closeStampModal() {
  if (elStampModalOverlay) elStampModalOverlay.classList.remove("active");
}

/**
 * ⭐️ [CSS Class]
 * 북마크 모달에 '.active' 클래스를 추가하여 표시합니다.
 */
function openBookmarkModal() {
  if (!isLoggedIn) return showCustomToast("로그인 후 이용 가능한 기능입니다.");
  renderBookmarkModalList(); // [CSS Dynamic HTML] 호출
  if (elBookmarkModalOverlay) elBookmarkModalOverlay.classList.add("active");
}
/**
 * ⭐️ [CSS Class]
 * 북마크 모달에서 '.active' 클래스를 제거하여 숨깁니다.
 */
function closeBookmarkModal() {
  if (elBookmarkModalOverlay) elBookmarkModalOverlay.classList.remove("active");
}

// --- ⭐️ 4. API 기반 동적 데이터 로드 함수 (핵심) ---
// (CSS 담당자는 이 함수가 renderProfileData와 renderNextUpcomingRun을 호출한다는 것만 알면 됩니다)
async function loadDynamicStats() {
  // [NEW] 비회원인 경우, 0으로 고정하고 바로 렌더링
  if (!isLoggedIn) {
    const zeroStats = { totalRuns: 0, totalDistance: 0.0, upcomingRuns: 0 };
    renderProfileData(zeroStats); // [CSS Dynamic Text] 호출
    renderNextUpcomingRun([]); // [CSS Dynamic HTML] 호출

    // ⭐️ [신규] 비회원 시 예정된 러닝 건수 0으로 렌더링
    const elUpcomingRunsCountDisplay = document.getElementById(
      "upcomingRunsCountDisplay"
    );
    if (elUpcomingRunsCountDisplay) {
      elUpcomingRunsCountDisplay.textContent = 0;
    }

    return; // API 호출 건너뛰기
  }

  try {
    // ... (API 호출 및 데이터 처리) ...
    const [reserveResponse, crewResponse] = await Promise.all([
      fetch(RESERVE_API),
      fetch(CREW_API + "/tabs/CREWLIST"),
    ]);
    // ... (데이터 파싱) ...
    const reservations = await reserveResponse.json();
    const crews = await crewResponse.json();
    const crewMap = new Map();
    crews.forEach((crew) => crewMap.set(crew.id, crew));
    const myReservations = reservations.filter(
      (res) => res.email === currentUserEmail
    );
    const myMergedRuns = myReservations
      .map((res) => ({
        reservationInfo: res,
        crewInfo: crewMap.get(res.crew_id) || {},
      }))
      .filter((run) => run.crewInfo.schedule);

    // ... (통계 계산) ...
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

    let upcomingRunsCount = 0;
    let pastRunsCount = 0;
    let pastDistance = 0.0;
    const allUpcomingRuns = []; // [CSS] renderNextUpcomingRun에 전달됨

    myMergedRuns.forEach((run) => {
      const scheduleDateStr = run.crewInfo.schedule.split(" ")[0];
      const runDate = new Date(scheduleDateStr.replace(/\./g, "-"));

      if (runDate >= today) {
        allUpcomingRuns.push(run.crewInfo);
        if (runDate <= oneMonthFromNow) {
          upcomingRunsCount++;
        }
      } else {
        pastRunsCount++;
        const distance = parseFloat(run.crewInfo.distance);
        if (!isNaN(distance)) {
          pastDistance += distance;
        }
      }
    });

    // 7. 계산된 통계
    const stats = {
      totalRuns: pastRunsCount,
      totalDistance: pastDistance,
      upcomingRuns: upcomingRunsCount,
    };

    // ⭐️ [신규] 예정된 총 러닝 건수(allUpcomingRuns.length)를 렌더링
    const elUpcomingRunsCountDisplay = document.getElementById(
      "upcomingRunsCountDisplay"
    );
    if (elUpcomingRunsCountDisplay) {
      elUpcomingRunsCountDisplay.textContent = allUpcomingRuns.length;
    }

    // 8. 렌더링 함수 호출
    renderProfileData(stats); // [CSS Dynamic Text] 호출
    renderNextUpcomingRun(allUpcomingRuns); // [CSS Dynamic HTML] 호출
  } catch (error) {
    console.error("동적 통계 로드 중 오류 발생:", error);
    // 오류 시 0으로 렌더링
    renderProfileData({
      totalRuns: 0,
      totalDistance: 0.0,
      upcomingRuns: 0,
    });
    renderNextUpcomingRun(null, true); // [CSS Dynamic HTML] 에러 상태 호출
  }
}

/**
 * ⭐️ [CSS Class]
 * 비회원일 때 대시보드 카드에 '.restricted' 클래스를 추가합니다.
 * (CSS 담당자는 .dashboard-card-item.restricted 스타일과
 * .restriction-overlay, .restriction-overlay-text 스타일을 정의해야 합니다)
 */
function restrictDashboard() {
  if (isLoggedIn) return; // 로그인했으면 함수 종료

  const dashboardCards = document.querySelectorAll(".dashboard-card-item");

  // ⭐️ [수정] 로그인 페이지 경로 수정 (경로 수정)
  const loginPageUrl = "../../user-auth/userAuthSrc/login-page.html";

  // 각 카드에 오버레이 추가
  dashboardCards.forEach((card) => {
    const overlay = document.createElement("a");
    overlay.href = loginPageUrl;
    // [CSS Class] 오버레이 스타일
    overlay.className = "restriction-overlay";

    const overlayText = document.createElement("span");
    overlayText.textContent = "로그인하기";
    // [CSS Class] 오버레이 텍스트 스타일
    overlayText.className = "restriction-overlay-text";

    overlay.appendChild(overlayText);
    card.appendChild(overlay);

    // [CSS Class] 카드 콘텐츠를 희미하게 만드는 클래스
    card.classList.add("restricted");
  });

  // 프로필 버튼 비활성화 (클릭 시 토스트)
  document.querySelectorAll(".profile-buttons-box button").forEach((btn) => {
    const originalClick = btn.onclick;
    btn.onclick = (e) => {
      e.preventDefault();
      showCustomToast("로그인 후 이용 가능한 기능입니다.");
      if (btn.id === "viewMyCardBtn") {
        return;
      }
      if (originalClick) originalClick(e);
    };
  });
}

// --- 5. 이벤트 핸들러 함수 (페이지 이동 및 팝업) ---
// (CSS 담당자에게는 중요도 낮음)
function handleEditProfileClick() {
  if (!isLoggedIn) return;
  // ⭐️ [수정] 경로 수정
  window.location.href = "./userprofile.html";
}

function handleViewMyCardClick() {
  if (!isLoggedIn) return;
  const popupWidth = 400;
  // ... (팝업 로직) ...
  // ⭐️ [수정] 경로 수정
  const popupUrl = `./mycard.html?userId=${
    userState.userId
  }&userName=${encodeURIComponent(userState.name)}&memberId=${
    userState.memberId
  }&joinDate=${userState.joinDate}&userEmail=${encodeURIComponent(
    currentUserEmail
  )}`;
  const popupOptions = `width=${popupWidth},height=600,scrollbars=no,resizable=no,toolbar=no,location=no,menubar=no,status=no`;
  window.open(popupUrl, "myCardPopup", popupOptions);
}

function handleMyGearClick() {
  if (!isLoggedIn) return;
  showCustomToast("MY GEAR (임시 기능)");
}

// '다가오는 러닝' 더보기 버튼
if (elUpcomingRunsBtn) {
  elUpcomingRunsBtn.addEventListener("click", () => {
    if (!isLoggedIn)
      return showCustomToast("로그인 후 이용 가능한 기능입니다.");
    // ⭐️ [수정] 경로 수정
    window.location.href = "./coming_running_page.html";
  });
}

// '스탬프' 더보기 버튼
if (elStampListBtn)
  elStampListBtn.addEventListener(
    "click",
    () => openStampModal() // [CSS Class] 호출
  );

// '북마크' 목록 보기 버튼
if (elViewBookmarksBtn) {
  elViewBookmarksBtn.addEventListener("click", () => {
    if (!isLoggedIn)
      return showCustomToast("로그인 후 이용 가능한 기능입니다.");
    // ⭐️ [수정] 경로 수정
    window.location.href = "./my_running_page.html";
  });
}

// --- 5. 이벤트 리스너 등록 ---
if (elEditProfileBtn)
  elEditProfileBtn.addEventListener("click", handleEditProfileClick);
if (elViewMyCardBtn)
  elViewMyCardBtn.addEventListener("click", handleViewMyCardClick);
if (elMyGearBtn) elMyGearBtn.addEventListener("click", handleMyGearClick);

// --- ⭐️ 모달 닫기 이벤트 리스너 ---
// (CSS 담당자는 모달 닫기 로직이 있음을 인지)
if (elStampModalCloseBtn)
  elStampModalCloseBtn.addEventListener("click", closeStampModal); // [CSS Class] 호출
if (elStampModalOverlay) {
  elStampModalOverlay.addEventListener("click", (event) => {
    if (event.target === elStampModalOverlay) {
      closeStampModal(); // [CSS Class] 호출
    }
  });
}
if (elBookmarkModalCloseBtn)
  elBookmarkModalCloseBtn.addEventListener("click", closeBookmarkModal); // [CSS Class] 호출
if (elBookmarkModalOverlay) {
  elBookmarkModalOverlay.addEventListener("click", (event) => {
    if (event.target === elBookmarkModalOverlay) {
      closeBookmarkModal(); // [CSS Class] 호출
    }
  });
}

// --- 6. 초기 실행 (페이지 로드 완료 시) ---
document.addEventListener("DOMContentLoaded", async function () {
  if (!isLoggedIn) {
    showCustomToast("로그인이 필요합니다. 비회원 정보로 표시됩니다.");
    restrictDashboard(); // ⭐️ [CSS Class] 비회원 UI 제한 적용
  }

  renderBookmarkCount(); // [CSS Dynamic Text] 호출
  await loadDynamicStats(); // [CSS Dynamic Text/HTML] 호출
});

/**
 * ⭐️ [CSS Inline Style]
 * 'alert'를 대체하는 커스텀 토스트 함수입니다.
 * (이 함수는 JS로 직접 *인라인 스타일*을 생성하여 적용합니다.
 * CSS 담당자는 이 스타일을 별도 클래스(.toast-popup 등)로 분리하는 것을 고려할 수 있습니다.)
 */
function showCustomToast(message) {
  console.log("[App Alert]:", message);

  const elAlertBox = document.createElement("div");
  // [CSS Inline Style] 토스트 스타일 직접 주입
  elAlertBox.style.cssText = `
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: #fff; 
          padding: 15px 20px; 
          border-radius: 8px; 
          box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
          z-index: 10000; 
          border-left: 5px solid #4f46e5; 
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #1f2937;
          opacity: 0;
          transform: translateX(20px);
          transition: opacity 0.3s ease, transform 0.3s ease;
      `;
  elAlertBox.textContent = message;
  document.body.appendChild(elAlertBox);

  // Animate in (나타나기)
  setTimeout(() => {
    elAlertBox.style.opacity = "1";
    elAlertBox.style.transform = "translateX(0)";
  }, 10);

  // Animate out and remove (사라지기 및 DOM에서 제거)
  setTimeout(() => {
    elAlertBox.style.opacity = "0";
    elAlertBox.style.transform = "translateX(20px)";
    elAlertBox.addEventListener("transitionend", () => {
      elAlertBox.remove();
    });
  }, 3000); // 3초 후 사라짐
}
