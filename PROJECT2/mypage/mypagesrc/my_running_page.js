// [CSS 참고]: 이 스크립트는 CSS와 상호작용합니다.
// - [CSS Class]: .active 클래스를 필터 패널(#filter-panel)과 정렬 버튼(.sort-btn)에 토글합니다.
// - [CSS Attribute]: 정렬 버튼(.sort-btn)의 'data-order' 속성을 변경합니다.
// - [CSS Dynamic HTML]: 북마크 목록(#bookmarks-list)과 필터 옵션(#filter-year, #filter-month)의 HTML을 동적으로 생성합니다.

// --- 1. ⭐️ 전역 변수 및 상태 ---
let allBookmarks = []; // localStorage에서 가져온 원본 '북마크' 데이터

let currentUserEmail = "onrunning@example.com"; // 기본값
let IS_LOGGED_IN = false; // ⭐️ 로그인 상태 플래그

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

// [CSS 참고] onprogram.js와 동일한 사용자별 스토리지 키 정의
const LOCAL_STORAGE_ID_KEY = IS_LOGGED_IN
  ? `bookmarkedCrewIds_${currentUserEmail}`
  : "bookmarkedCrewIds_guest";
const LOCAL_STORAGE_DATA_KEY = IS_LOGGED_IN
  ? `bookmarkedRuns_${currentUserEmail}`
  : "bookmarkedRuns_guest";

// [CSS 참고] 현재 필터/정렬 상태를 저장하는 JS 객체. 이 값에 따라 UI가 변경됩니다.
let filterState = {
  year: "all",
  month: "all",
  level: "all",
};
let sortState = {
  main: { key: "date", order: "asc" },
};

document.addEventListener("DOMContentLoaded", function () {
  // --- 2. ⭐️ DOM 요소 선택 ---
  // [CSS 참고] JS가 제어할 DOM 요소들
  const elSearchToggleBtn = document.getElementById("search-toggle-btn");
  const elFilterPanel = document.getElementById("filter-panel");
  const elFilterApplyBtn = document.getElementById("filter-apply-btn");
  const elFilterResetBtn = document.getElementById("filter-reset-btn");
  const elFilterYear = document.getElementById("filter-year");
  const elFilterMonth = document.getElementById("filter-month");
  const elSortDateBookmark = document.getElementById("sort-by-date-bookmark");
  const elSortNameBookmark = document.getElementById("sort-by-name-bookmark");

  // --- 3. ⭐️ 렌더링 함수 ---

  /**
   * ⭐️ [CSS Dynamic HTML]
   * '북마크' 목록(#bookmarks-list)을 렌더링합니다.
   * (이 함수는 .registered-item 또는 .empty-list-message HTML을 동적으로 생성합니다)
   */
  function renderBookmarkList(bookmarks, targetListElementId, emptyMessage) {
    const listContainer = document.getElementById(targetListElementId);
    listContainer.innerHTML = "";

    if (!bookmarks || bookmarks.length === 0) {
      listContainer.innerHTML = `<p class="empty-list-message">${emptyMessage}</p>`;
      return;
    }

    bookmarks.forEach((run) => {
      const detailLink = `../${run.link || "#"}`;
      // [CSS Dynamic HTML] .registered-item 구조 생성
      const itemHtml = `
                    <div class="registered-item">
                        <div class="item-info-box">
                            <div class="item-info-row">
                                <span class="info-label">위치</span>
                                <span class="info-value">${
                                  run.location || "정보 없음"
                                }</span>
                            </div>
                            <!-- ... (기타 정보 행) ... -->
                            <div class="item-info-row">
                                <span class="info-label">날짜</span>
                                <span class="info-value">${
                                  run.date || "날짜 정보 없음"
                                }</span>
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
                                  run.distance
                                    ? run.distance + "km"
                                    : "정보 없음"
                                }</span>
                            </div>
                            <div class="item-info-row">
                                <span class="info-label">레벨</span>
                                <span class="info-value">${
                                  run.level || "정보 없음"
                                }</span>
                            </div>
                            <a href="${detailLink}" class="item-link" target="_blank">상세보기</a>
                        </div>
                    </div>
                `;
      listContainer.insertAdjacentHTML("beforeend", itemHtml);
    });
  }

  // --- 4. ⭐️ 필터 및 정렬 로직 ---

  /**
   * ⭐️ [CSS Dynamic HTML]
   * 필터와 정렬을 적용하고 렌더링을 실행합니다. (renderBookmarkList 호출)
   */
  function applyFiltersAndSort() {
    let sourceData = allBookmarks;
    let renderFunction = renderBookmarkList;
    let listElementId = "bookmarks-list";
    let emptyMessage = "필터 결과에 맞는 북마크가 없습니다.";
    let currentSort = sortState.main;

    // 2. 필터링 (filterState 값 기준)
    let filteredData = sourceData.filter((item) => {
      // ... (필터 로직) ...
      let itemDateStr = item.date;
      let itemLevel = item.level || "all";
      if (!itemDateStr || itemDateStr === "날짜 없음" || itemDateStr === "0")
        return false;
      const normalizedDateStr = itemDateStr.replace(/[.\/]/g, "-");
      const itemDate = new Date(normalizedDateStr);
      if (isNaN(itemDate.getTime())) return false;
      const itemYear = itemDate.getFullYear();
      const itemMonth = itemDate.getMonth();
      const yearMatch =
        filterState.year === "all" || itemYear == filterState.year;
      const monthMatch =
        filterState.month === "all" || itemMonth == filterState.month;
      const levelMatch =
        filterState.level === "all" ||
        itemLevel.toUpperCase() === filterState.level.toUpperCase();
      return yearMatch && monthMatch && levelMatch;
    });

    // 3. 정렬 (sortState 값 기준)
    filteredData.sort((a, b) => {
      // ... (정렬 로직) ...
      let valA, valB;
      let dateStrA, dateStrB;
      if (currentSort.key === "date") {
        dateStrA = a.date || "9999-12-31";
        dateStrB = b.date || "9999-12-31";
        valA = new Date(dateStrA.split(" ")[0].replace(/[.\/]/g, "-"));
        valB = new Date(dateStrB.split(" ")[0].replace(/[.\/]/g, "-"));
      } else {
        valA = (a.location || "").toLowerCase();
        valB = (b.location || "").toLowerCase();
      }
      if (valA < valB) return currentSort.order === "asc" ? -1 : 1;
      if (valA > valB) return currentSort.order === "asc" ? 1 : -1;
      return 0;
    });

    // 4. 렌더링
    renderFunction(filteredData, listElementId, emptyMessage);
  }

  /**
   * ⭐️ [CSS Dynamic HTML]
   * 날짜 필터(#filter-year, #filter-month)의 <option> 태그를 동적으로 생성합니다.
   */
  function populateDateFilters() {
    const currentYear = new Date().getFullYear();
    elFilterYear.innerHTML = '<option value="all">연도 (전체)</option>';
    for (let i = -5; i <= 2; i++) {
      const year = currentYear + i;
      elFilterYear.innerHTML += `<option value="${year}">${year}년</option>`;
    }

    elFilterMonth.innerHTML = '<option value="all">월 (전체)</option>';
    for (let i = 0; i < 12; i++) {
      elFilterMonth.innerHTML += `<option value="${i}">${i + 1}월</option>`;
    }
  }

  /**
   * ⭐️ 필터 UI 이벤트 리스너 설정
   */
  function setupFilterListeners() {
    // [CSS Class] 필터 토글 버튼 클릭 시 #filter-panel에 .active 클래스 토글
    elSearchToggleBtn.addEventListener("click", () => {
      elSearchToggleBtn.classList.toggle("active");
      elFilterPanel.classList.toggle("active");
    });

    // '조회' 버튼 클릭
    elFilterApplyBtn.addEventListener("click", () => {
      // 1. 현재 UI 값으로 전역 filterState 업데이트
      filterState.year = elFilterYear.value;
      filterState.month = elFilterMonth.value;
      filterState.level = document.querySelector(
        'input[name="level"]:checked'
      ).value;

      // 2. ⭐️ [CSS Dynamic HTML] 리스트 리프레시
      applyFiltersAndSort();
    });

    // '초기화' 버튼 클릭
    elFilterResetBtn.addEventListener("click", () => {
      // 1. UI 초기화 (select, radio)
      elFilterYear.value = "all";
      elFilterMonth.value = "all";
      document.querySelector('input[name="level"][value="all"]').checked = true;

      // 2. 전역 filterState 초기화
      filterState = { year: "all", month: "all", level: "all" };

      // 3. ⭐️ [CSS Class] 정렬 상태도 초기화
      sortState.main = { key: "date", order: "asc" };
      updateSortButtonUI();

      // 4. ⭐️ [CSS Dynamic HTML] 리스트 리프레시
      applyFiltersAndSort();
    });
  }

  /**
   * ⭐️ 정렬 버튼 클릭 핸들러
   */
  function handleSortClick(sortKey) {
    const currentTabSort = sortState.main;

    if (currentTabSort.key === sortKey) {
      // [CSS Attribute] 'data-order' 값을 asc/desc 토글
      currentTabSort.order = currentTabSort.order === "asc" ? "desc" : "asc";
    } else {
      currentTabSort.key = sortKey;
      currentTabSort.order = sortKey === "date" ? "asc" : "asc";
    }

    updateSortButtonUI(); // ⭐️ [CSS Class] [CSS Attribute] UI 업데이트
    applyFiltersAndSort(); // ⭐️ [CSS Dynamic HTML] 리스트 리프레시
  }

  /**
   * ⭐️ [CSS Class] [CSS Attribute]
   * 정렬 버튼(.sort-btn)의 .active 클래스와 [data-order] 속성을 업데이트합니다.
   */
  function updateSortButtonUI() {
    const currentTabSort = sortState.main;
    const dateBtn = document.getElementById(`sort-by-date-bookmark`);
    const nameBtn = document.getElementById(`sort-by-name-bookmark`);

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

  // --- 5. ⭐️ 데이터 로드 (메인 함수) ---

  /**
   * ⭐️ [CSS Dynamic HTML]
   * localStorage에서 '북마크' 데이터를 로드하고 최초 렌더링을 실행합니다.
   * (비로그인 시 에러 메시지 렌더링)
   */
  function loadBookmarks() {
    // ⭐️ 비회원인 경우
    if (!IS_LOGGED_IN) {
      document.getElementById("bookmarks-list").innerHTML =
        '<p class="empty-list-message">로그인 사용자만 북마크 목록을 볼 수 있습니다.</p>';
      return;
    }

    try {
      // [CSS 참고] 사용자별 고유 키(LOCAL_STORAGE_DATA_KEY)로 데이터를 가져옵니다.
      allBookmarks = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_DATA_KEY) || "[]"
      );

      // 최초 렌더링 (필터/정렬 적용)
      applyFiltersAndSort(); // [CSS Dynamic HTML] 호출
    } catch (error) {
      console.error("북마크 로드 중 오류 발생:", error);
      document.getElementById("bookmarks-list").innerHTML =
        '<p class="empty-list-message">북마크 로드 중 오류가 발생했습니다.</p>';
    }
  }

  // --- 6. ⭐️ 최초 실행 ---

  // [CSS Dynamic HTML] 필터 <option> 생성
  populateDateFilters();
  // [CSS Class] 필터 이벤트 리스너 설정
  setupFilterListeners();

  // [CSS Class] [CSS Attribute] 정렬 버튼 리스너 연결
  if (elSortDateBookmark)
    elSortDateBookmark.addEventListener("click", () => handleSortClick("date"));
  if (elSortNameBookmark)
    elSortNameBookmark.addEventListener("click", () => handleSortClick("name"));

  // [CSS Class] [CSS Attribute] 정렬 UI 초기 상태 반영
  updateSortButtonUI();

  // [CSS Dynamic HTML] 데이터 로드 및 최초 렌더링 실행
  loadBookmarks();
});
