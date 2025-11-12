// [CSS 참고]: 이 스크립트는 CSS와 상호작용합니다.
// - [CSS Class]: .active 클래스를 탭(.tab-btn, .tab-content), 필터 패널(#filter-panel), 정렬 버튼(.sort-btn)에 토글합니다.
// - [CSS Class]: FullCalendar 이벤트에 .event-upcoming, .event-past 클래스를 동적으로 할당합니다.
// - [CSS Attribute]: 정렬 버튼(.sort-btn)의 'data-order' 속성을 변경합니다.
// - [CSS Dynamic HTML]: 캘린더(#calendar), 목록(#filtered-results-list, #past-runs-list), 필터 옵션(#filter-year, #filter-month)의 HTML을 동적으로 생성합니다.

// API
const CREW_API =
  "https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e";
const RESERVE_API =
  "https://api.sheetbest.com/sheets/4e2d77b5-9ae8-4a14-bfee-5b7dffe35b95";

// --- 1. 전역 변수 및 상태 ---
// (CSS 담당자는 이 로직 자체는 크게 신경 쓰지 않아도 됩니다.)
let allUpcomingRuns = []; // '다가오는 러닝' 데이터
let allPastRuns = []; // '참여한 러닝' 데이터
let calendarInstance = null;

// [CSS 참고] 현재 필터/정렬 상태를 저장하는 JS 객체. 이 값에 따라 UI가 변경됩니다.
let filterState = {
  year: "all",
  month: "all",
  level: "all",
};

let sortState = {
  upcoming: { key: "date", order: "asc" }, // 다가오는 러닝 (기본: 날짜 오름차순)
  past: { key: "date", order: "desc" }, // 참여한 러닝 (기본: 최신순)
};

let currentUserEmail = "onrunning@example.com";
let IS_LOGGED_IN = false;

const loggedInUser = sessionStorage.getItem("loggedInUser");
if (loggedInUser) {
  try {
    const user = JSON.parse(loggedInUser);
    currentUserEmail = user.email || currentUserEmail;
    IS_LOGGED_IN = currentUserEmail !== "onrunning@example.com";
  } catch (e) {
    console.error("세션 사용자 정보 파싱 오류:", e);
  }
}

/**
 * ⭐️ [CSS Class]
 * FullCalendar 이벤트 객체로 변환하며,
 * '다가오는 러닝'에는 .event-upcoming, '참여한 러닝'에는 .event-past 클래스를 할당합니다.
 */
function crewsToCalendarEvents(crews, isUpcoming) {
  return crews.map((crew) => {
    const scheduleString = crew.schedule || "";
    const parts = scheduleString.split(" ");
    const datePart = parts[0];
    const formattedDate = datePart.replace(/\./g, "-");

    return {
      title: crew.name,
      start: formattedDate,
      // ⭐️ [CSS Class] 이벤트 색상 구분을 위한 className
      className: isUpcoming ? "event-upcoming" : "event-past",
      extendedProps: {
        crewId: crew.id,
        crewName: crew.name,
        originalCrew: crew,
      },
    };
  });
}

/**
 * ⭐️ [CSS Dynamic HTML]
 * '다가오는 러닝' 카드 목록(#filtered-results-list)을 렌더링합니다.
 * (이 함수는 .registered-item 또는 .empty-list-message HTML을 동적으로 생성합니다)
 */
function renderUpcomingRunList(crews, targetListElementId, emptyMessage) {
  const listContainer = document.getElementById(targetListElementId);
  if (!listContainer) return;

  listContainer.innerHTML = ""; // 목록 초기화

  if (crews.length === 0) {
    listContainer.innerHTML = `<p class="empty-list-message">${emptyMessage}</p>`;
    return;
  }

  crews.forEach((crew) => {
    // [CSS Dynamic HTML] .registered-item 구조 생성
    const runDate = crew.schedule
      ? crew.schedule.split(" ")[0]
      : "날짜 정보 없음";

     
    const detailLink = `../explanation/explanation.html?id=${encodeURIComponent(
      crew.id || ""
    )}`;

    const itemHtml = `
              <div class="registered-item">
                  <div class="item-info-box">
                      <!-- ... (기타 정보 행) ... -->
                      <div class="item-info-row">
                          <span class="info-label">위치</span>
                          <span class="info-value">${
                            crew.name || "정보 없음"
                          }</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">날짜</span>
                          <span class="info-value">${runDate}</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">거리</span>
                          <span class="info-value">${
                            crew.distance || "?"
                          }km</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">레벨</span>
                          <span class="info-value">${
                            crew.level || "정보 없음"
                          }</span>
                      </div>
                  </div>
                  <a href="${detailLink}" class="item-link" target="_blank">상세보기</a>
              </div>
          `;
    listContainer.insertAdjacentHTML("beforeend", itemHtml);
  });
}

/**
 * ⭐️ [CSS Dynamic HTML]
 * '참여한 러닝' 카드 목록(#past-runs-list)을 렌더링합니다.
 * (이 함수는 .registered-item과 .status-badge.completed HTML을 동적으로 생성합니다)
 */
function renderPastRunList(runs, targetListElementId, emptyMessage) {
  const listContainer = document.getElementById(targetListElementId);
  listContainer.innerHTML = "";

  if (runs.length === 0) {
    listContainer.innerHTML = `<p class="empty-list-message">${emptyMessage}</p>`;
    return;
  }

  runs.forEach((crew) => {
    // [CSS Dynamic HTML] .registered-item 구조 생성
    const runDate = crew.schedule
      ? crew.schedule.split(" ")[0]
      : "날짜 정보 없음";
    const detailLink = `../onprogram/explanation.html?id=${crew.id || ""}`;

    const itemHtml = `
              <div class="registered-item">
                  <div class="item-info-box">
                      <!-- ... (기타 정보 행) ... -->
                      <div class="item-info-row">
                          <span class="info-label">위치</span>
                          <span class="info-value">${
                            crew.name || "정보 없음"
                          }</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">날짜</span>
                          <span class="info-value">${runDate}</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">거리</span>
                          <span class="info-value">${
                            crew.distance || "?"
                          }km</span>
                      </div>
                      <div class="item-info-row">
                          <span class="info-label">레벨</span>
                          <span class="info-value">${
                            crew.level || "정보 없음"
                          }</span>
                      </div>
                      <a href="${detailLink}" class="item-link" target="_blank">상세보기</a>
                  </div>
                  <!-- [CSS Dynamic HTML] 참여 완료 뱃지 -->
                  <span class="status-badge completed">참여 완료</span>
              </div>
          `;
    listContainer.insertAdjacentHTML("beforeend", itemHtml);
  });
}

/**
 * ⭐️ [CSS Dynamic HTML]
 * 날짜 필터(#filter-year, #filter-month)의 <option> 태그를 동적으로 생성합니다.
 */
function populateDateFilters() {
  const elFilterYear = document.getElementById("filter-year");
  const elFilterMonth = document.getElementById("filter-month");

  if (!elFilterYear || !elFilterMonth) return;

  const currentYear = new Date().getFullYear();
  elFilterYear.innerHTML = '<option value="all">연도 (전체)</option>';
  for (let i = -3; i <= 2; i++) {
    const year = currentYear + i;
    elFilterYear.innerHTML += `<option value="${year}">${year}년</option>`;
  }

  elFilterMonth.innerHTML = '<option value="all">월 (전체)</option>';
  for (let i = 0; i < 12; i++) {
    elFilterMonth.innerHTML += `<option value="${i}">${i + 1}월</option>`;
  }
}

/**
 * ⭐️ [CSS Dynamic HTML]
 * 필터와 정렬을 적용하고 탭에 맞게 렌더링 (핵심 함수)
 * (이 함수는 renderUpcomingRunList 또는 renderPastRunList를 호출합니다)
 */
function applyFiltersAndSort(tabName) {
  let sourceData = [];
  let renderFunction = null;
  let listElementId = "";
  let emptyMessage = "";
  let currentSort = {};

  // 1. 탭에 맞는 데이터와 설정 가져오기
  if (tabName === "upcoming") {
    sourceData = allUpcomingRuns;
    renderFunction = renderUpcomingRunList;
    listElementId = "filtered-results-list";
    emptyMessage = "필터 결과에 맞는 러닝이 없습니다.";
    currentSort = sortState.upcoming;
  } else {
    // 'past'
    sourceData = allPastRuns;
    renderFunction = renderPastRunList;
    listElementId = "past-runs-list";
    emptyMessage = "필터 결과에 맞는 러닝이 없습니다.";
    currentSort = sortState.past;
  }

  // 2. 필터링 (filterState 값 기준)
  let filteredData = sourceData.filter((crew) => {
    // ... (필터 로직) ...
    const crewLevel = crew.level || "all";
    const crewSchedule = crew.schedule || "";
    if (!crewSchedule) return false;
    const crewDate = new Date(crewSchedule.split(" ")[0].replace(/\./g, "-"));
    const yearMatch =
      filterState.year === "all" || crewDate.getFullYear() == filterState.year;
    const monthMatch =
      filterState.month === "all" || crewDate.getMonth() == filterState.month;
    const levelMatch =
      filterState.level === "all" ||
      crewLevel.toUpperCase() === filterState.level.toUpperCase();
    return yearMatch && monthMatch && levelMatch;
  });

  // 3. 정렬 (sortState 값 기준)
  filteredData.sort((a, b) => {
    // ... (정렬 로직) ...
    let valA, valB;
    if (currentSort.key === "date") {
      valA = new Date((a.schedule || "9999-12-31").replace(/\./g, "-"));
      valB = new Date((b.schedule || "9999-12-31").replace(/\./g, "-"));
    } else {
      valA = (a.name || "").toLowerCase();
      valB = (b.name || "").toLowerCase();
    }
    if (valA < valB) return currentSort.order === "asc" ? -1 : 1;
    if (valA > valB) return currentSort.order === "asc" ? 1 : -1;
    return 0;
  });

  // 4. 렌더링
  renderFunction(filteredData, listElementId, emptyMessage);
}

/**
 * ⭐️ 필터 초기화 함수
 */
function resetFilters() {
  // 1. UI 초기화 (select, radio)
  document.getElementById("filter-year").value = "all";
  document.getElementById("filter-month").value = "all";
  document
    .querySelectorAll('input[name="level"][value="all"]')
    .forEach((r) => (r.checked = true));

  // 2. 전역 filterState 초기화
  filterState = { year: "all", month: "all", level: "all" };

  // 3. ⭐️ [CSS Class] [CSS Attribute] 정렬 상태도 기본값으로 초기화
  sortState.upcoming = { key: "date", order: "asc" };
  sortState.past = { key: "date", order: "desc" };
  updateSortButtonUI("upcoming");
  updateSortButtonUI("past");

  // 4. ⭐️ [CSS Dynamic HTML] 필터 적용 (양쪽 탭 모두 리스트 리프레시)
  applyFiltersAndSort("upcoming");
  applyFiltersAndSort("past");
}

/**
 * ⭐️ 필터 버튼 이벤트 리스너 설정
 */
function setupFilterListeners() {
  const elSearchToggleBtn = document.getElementById("search-toggle-btn");
  const elFilterPanel = document.getElementById("filter-panel");
  const elFilterApplyBtn = document.getElementById("filter-apply-btn");
  const elFilterResetBtn = document.getElementById("filter-reset-btn");

  if (elSearchToggleBtn && elFilterPanel) {
    // [CSS Class] 필터 토글 버튼 클릭 시 #filter-panel에 .active 클래스 토글
    elSearchToggleBtn.addEventListener("click", () => {
      elSearchToggleBtn.classList.toggle("active");
      elFilterPanel.classList.toggle("active");
    });
  }
  // '조회' 버튼
  if (elFilterApplyBtn)
    elFilterApplyBtn.addEventListener("click", () => {
      // 1. filterState 업데이트
      filterState.year = document.getElementById("filter-year").value;
      filterState.month = document.getElementById("filter-month").value;
      filterState.level = document.querySelector(
        'input[name="level"]:checked'
      ).value;
      // 2. ⭐️ [CSS Dynamic HTML] 양쪽 탭 모두 리스트 리프레시
      applyFiltersAndSort("upcoming");
      applyFiltersAndSort("past");
    });
  // '초기화' 버튼
  if (elFilterResetBtn)
    elFilterResetBtn.addEventListener("click", resetFilters);
}

// --- ⭐️ [신규] 탭 및 정렬 관련 함수 ---

/**
 * ⭐️ [CSS Class]
 * 탭 버튼(.tab-btn)과 탭 콘텐츠(.tab-content)에 .active 클래스를 토글합니다.
 */
function setupTabListeners() {
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const targetTabId = button.dataset.tab;
      // 1. 모든 .active 클래스 제거
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      tabContents.forEach((content) => content.classList.remove("active"));

      // 2. 클릭된 대상에만 .active 클래스 추가
      button.classList.add("active");
      document.getElementById(targetTabId).classList.add("active");
    });
  });
}

/**
 * ⭐️ 정렬 버튼 클릭 이벤트 핸들러
 */
function handleSortClick(tabName, sortKey) {
  const currentTabSort = sortState[tabName];

  if (currentTabSort.key === sortKey) {
    // [CSS Attribute] 'data-order' 값을 asc/desc 토글
    currentTabSort.order = currentTabSort.order === "asc" ? "desc" : "asc";
  } else {
    currentTabSort.key = sortKey;
    currentTabSort.order =
      sortKey === "date" ? (tabName === "upcoming" ? "asc" : "desc") : "asc";
  }

  updateSortButtonUI(tabName); // ⭐️ [CSS Class] [CSS Attribute] UI 업데이트
  applyFiltersAndSort(tabName); // ⭐️ [CSS Dynamic HTML] 리스트 리프레시
}

/**
 * ⭐️ [CSS Class] [CSS Attribute]
 * 정렬 버튼(.sort-btn)의 .active 클래스와 [data-order] 속성을 업데이트합니다.
 */
function updateSortButtonUI(tabName) {
  const currentTabSort = sortState[tabName];
  const dateBtn = document.getElementById(`sort-by-date-${tabName}`);
  const nameBtn = document.getElementById(`sort-by-name-${tabName}`);

  if (!dateBtn || !nameBtn) return;

  // 1. 모든 버튼 초기화
  [dateBtn, nameBtn].forEach((btn) => {
    btn.classList.remove("active");
    btn.removeAttribute("data-order");
  });

  // 2. 활성 버튼에만 .active 및 data-order 추가
  const activeBtn = currentTabSort.key === "date" ? dateBtn : nameBtn;
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.setAttribute("data-order", currentTabSort.order);
  }
}

/**
 * ⭐️ 정렬 버튼 이벤트 리스너 설정
 */
function setupSortListeners() {
  // '다가오는 러닝' 탭
  document
    .getElementById("sort-by-date-upcoming")
    .addEventListener("click", () => handleSortClick("upcoming", "date"));
  document
    .getElementById("sort-by-name-upcoming")
    .addEventListener("click", () => handleSortClick("upcoming", "name"));

  // '참여한 러닝' 탭
  document
    .getElementById("sort-by-date-past")
    .addEventListener("click", () => handleSortClick("past", "date"));
  document
    .getElementById("sort-by-name-past")
    .addEventListener("click", () => handleSortClick("past", "name"));
}

// (FullCalendar의 '이전' 버튼 관련 로직은 CSS와 직접적 연관이 적어 주석 생략)
function togglePrevButton() {
  if (!calendarInstance) return;
  const prevButton = document.querySelector(".fc-prev-button");
  if (!prevButton) return;
  prevButton.disabled = false;
  prevButton.classList.remove("fc-button-disabled");
  prevButton.style.opacity = "1";
  prevButton.style.cursor = "pointer";
}

/**
 * ⭐️ 메인 함수 (데이터 로드 및 렌더링)
 */
async function loadAndRenderCalendar() {
  const elCalendar = document.getElementById("calendar");
  if (!elCalendar) return;

  // ⭐️ 비로그인 시 안내
  if (!IS_LOGGED_IN) {
    // [CSS Dynamic HTML] 비로그인 시 메시지 렌더링
    const msg =
      '<p class="empty-list-message" style="margin-bottom: 20px;">로그인 후 신청한 러닝 목록을 볼 수 있습니다.</p>';
    elCalendar.innerHTML = msg;
    document.getElementById("filtered-results-list").innerHTML = msg;
    document.getElementById("past-runs-list").innerHTML = msg;
    return;
  }

  try {
    // 1. API 동시 호출
    const [reserveResponse, crewResponse] = await Promise.all([
      fetch(RESERVE_API),
      fetch(`${CREW_API}/tabs/CREWLIST`),
    ]);
    // ... (데이터 파싱 및 처리) ...
    const allReservations = await reserveResponse.json();
    const allCrews = await crewResponse.json();
    if (!allCrews || allCrews.length === 0)
      throw new Error("크루 정보를 불러오지 못했습니다.");
    const crewMap = new Map();
    allCrews.forEach((crew) => crewMap.set(crew.id, crew));
    const myReservations = allReservations.filter(
      (res) => res.email === currentUserEmail
    );
    const myRuns = myReservations
      .map((reservation) => crewMap.get(reservation.crew_id))
      .filter(Boolean);

    // 4. '다가오는 러닝'과 '참여한 러닝'으로 분리
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    allUpcomingRuns = []; // 전역 변수
    allPastRuns = []; // 전역 변수
    myRuns.forEach((run) => {
      const crewSchedule = run.schedule || "";
      const crewDate = new Date(crewSchedule.split(" ")[0].replace(/\./g, "-"));
      if (crewDate >= today) {
        allUpcomingRuns.push(run);
      } else {
        allPastRuns.push(run);
      }
    });

    if (myRuns.length === 0) {
      elCalendar.innerHTML =
        '<p style="text-align: center; padding: 20px; color: #555;">신청한 러닝 내역이 없습니다.</p>';
    }

    // 5. ⭐️ [CSS Class] 달력 이벤트 생성 (색상 구분 클래스 할당)
    const upcomingEvents = crewsToCalendarEvents(allUpcomingRuns, true);
    const pastEvents = crewsToCalendarEvents(allPastRuns, false);
    const calendarEvents = [...upcomingEvents, ...pastEvents];

    // 6. [CSS Dynamic HTML] 캘린더 렌더링
    calendarInstance = new FullCalendar.Calendar(elCalendar, {
      initialView: "dayGridMonth",
      locale: "ko",
      height: "auto",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "",
      },
      events: calendarEvents, // ⭐️ .event-upcoming, .event-past 클래스가 포함된 이벤트
      eventClick: function (info) {
        const { crewId } = info.event.extendedProps;
        const url = `../onprogram/explanation.html?id=${encodeURIComponent(
          crewId || ""
        )}`;
        window.location.href = url;
      },
      viewDidMount: togglePrevButton,
      datesSet: togglePrevButton,
    });
    calendarInstance.render();

    // 7. ⭐️ UI 설정 및 목록 렌더링
    populateDateFilters(); // [CSS Dynamic HTML] 필터 옵션 생성
    setupFilterListeners(); // [CSS Class] 필터 이벤트 설정
    setupTabListeners(); // ⭐️ [CSS Class] 탭 이벤트 설정
    setupSortListeners(); // [CSS Class] [CSS Attribute] 정렬 이벤트 설정

    // [CSS Class] [CSS Attribute] 정렬 버튼 초기 상태 UI 반영
    updateSortButtonUI("upcoming");
    updateSortButtonUI("past");

    // 8. ⭐️ [CSS Dynamic HTML] 양쪽 탭의 목록 최초 렌더링
    applyFiltersAndSort("upcoming");
    applyFiltersAndSort("past");
  } catch (error) {
    console.error("크루 목록 로드 실패:", error);
    // [CSS Dynamic HTML] 에러 메시지 렌더링
    const errorMsg = `<p class="empty-list-message">오류가 발생했습니다: ${error.message}</p>`;
    elCalendar.innerHTML = errorMsg;
    document.getElementById("filtered-results-list").innerHTML = errorMsg;
    document.getElementById("past-runs-list").innerHTML = errorMsg;
  }
}

// 페이지 로드 시 달력 실행
document.addEventListener("DOMContentLoaded", loadAndRenderCalendar);
