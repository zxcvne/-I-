// ============================================
// onprogram.js - RUN TOGETHER SEOUL
// Kakao 지도 + 현재 위치 + 크루 리스트 렌더링
// ⭐️ [수정] 북마크 기능 추가
// ============================================

// --- ⭐️ [신규] 로그인 상태 및 북마크 키 ---
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
// ⭐️ [CSS 참고] 이 키는 mypage/userpage.js와 동일해야 합니다.
const LOCAL_STORAGE_ID_KEY = IS_LOGGED_IN
  ? `bookmarkedCrewIds_${currentUserEmail}`
  : "bookmarkedCrewIds_guest";
const LOCAL_STORAGE_DATA_KEY = IS_LOGGED_IN
  ? `bookmarkedRuns_${currentUserEmail}`
  : "bookmarkedRuns_guest";
// --- ⭐️ [신규] 끝 ---

// 전역 변수: 지도 객체 저장
let globalMap = null;
// 현재 활성화된 필터 저장
let activeFilter = "near";
// 전체 크루 데이터 저장 (필터링을 위해)
let allCrewData = [];
// 사용자의 현재 위치
let userLat = 37.5665;
let userLng = 126.9780;
// 🔑 검색한 주소의 좌표를 저장 (검색 기반 필터링용)
let searchLat = null;
let searchLng = null;

/**
 * 앱 초기화 함수
 * - 사용자 위치 확인
 * - 필터 버튼 이벤트 설정
 * - 검색창 이벤트 설정
 */
function initApp() {
  console.log('initApp 실행 시작');

  // 1. 사용자의 현재 위치 획득 후 지도 초기화
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        console.log('위치 획득 성공:', pos.coords.latitude, pos.coords.longitude);
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        initMap(pos.coords.latitude, pos.coords.longitude);
      },
      (error) => {
        console.log('위치 획득 실패, 서울 중심으로 설정');
        // 실패 시 서울 시청 좌표로 기본값 설정
        initMap(37.5665, 126.9780);
      }
    );
  } else {
    console.log('Geolocation 지원 안 함, 서울 중심으로 설정');
    initMap(37.5665, 126.9780);
  }

  // 2. filter-btn 클래스의 모든 필터 버튼에 클릭 이벤트 추가
  // (내 근처, 레이스거리, 날짜, MY)
  const filterBtns = document.querySelectorAll('.filter-btn');
  if (filterBtns.length > 0) {
    filterBtns.forEach(btn => {
      btn.addEventListener("click", e => {
        // 기존 active 클래스 제거
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove("active"));
        // 클릭된 버튼에만 active 클래스 추가
        btn.classList.add("active");

        // 🔑 클릭된 필터 버튼의 data-filter 값 저장
        activeFilter = btn.getAttribute("data-filter");
        console.log('선택된 필터:', activeFilter);

        // 필터 적용 후 크루 리스트 다시 렌더링
        fetchAndRenderRuns();
      });
    });
  }

  // 3. 🔑 location-search (검색창) 이벤트 추가
  // 사용자가 주소를 입력할 때 Kakao 주소 검색 API 사용
  // 3. 🔑 Daum 우편번호 검색 초기화
  initDaumPostcodeSearch();
  function initDaumPostcodeSearch() {
    const searchBtn = document.getElementById("search-btn");
    const searchInput = document.getElementById("location-search");
    const searchWrapper = document.querySelector(".search-wrapper");
    // 커서 pointer 적용 (금지마크 방지)
    if (searchInput) searchInput.style.cursor = "pointer";
    if (searchWrapper) searchWrapper.style.cursor = "pointer";

    // ✅ input 클릭에만 주소 검색 팝업 띄움
    searchInput.addEventListener("click", (e) => {
      execDaumPostcode();
    });

    // ✅ 검색 버튼 클릭 시에는 지도 갱신만, 주소창 팝업 X
    searchBtn.addEventListener("click", (e) => {
      updateMapAndList();
    });
  }

}



/**
 * 지도 초기화 함수
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 */
function initMap(lat, lng) {
  console.log('initMap 실행:', lat, lng);

  // kakao 객체 존재 여부 확인
  if (typeof kakao === 'undefined') {
    console.error('Kakao 객체가 정의되지 않았습니다!');
    return;
  }

  // map-container (지도를 표시할 HTML 요소) 확인
  const mapContainer = document.getElementById("map");
  if (!mapContainer) {
    console.error('맵 컨테이너를 찾을 수 없습니다');
    return;
  }

  // 지도 옵션 설정
  const mapOptions = {
    center: new kakao.maps.LatLng(lat, lng),
    level: 7, // 줌 레벨
    draggable: false, // 초기 드래그 비활성화
    scrollwheel: false, // 마우스 휠로 줌 안 되도록 설정
    disableDoubleClickZoom: true // 더블클릭 줌 비활성화
  };

  // Kakao 지도 객체 생성 및 전역 변수에 저장
  globalMap = new kakao.maps.Map(mapContainer, mapOptions);
  let currentLevel = 7;

  // ============================================
  // map-controls (확대/축소 버튼) 이벤트 설정
  // ============================================
  const zoomInBtn = document.getElementById("zoom-in");
  const zoomOutBtn = document.getElementById("zoom-out");

  // + 버튼: 지도 확대 (레벨 감소)
  if (zoomInBtn) {
    zoomInBtn.addEventListener("click", () => {
      if (currentLevel > 1) {
        currentLevel--;
        globalMap.setLevel(currentLevel);
      }
    });
  }

  // - 버튼: 지도 축소 (레벨 증가)
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener("click", () => {
      if (currentLevel < 14) {
        currentLevel++;
        globalMap.setLevel(currentLevel);
      }
    });
  }

  // ============================================
  // 지도 드래그 설정 (Long-press 방식)
  // ============================================

  // 드래그 상태 토글 헬퍼
  function setGrabbing(on) {
    const mapEl = document.getElementById('map');
    if (!mapEl) return;
    mapEl.classList.toggle('grabbing', !!on);
  }

  // 마우스 눌렀을 때: 드래그 가능 + grabbing 커서
  kakao.maps.event.addListener(globalMap, 'mousedown', () => {
    globalMap.setDraggable(true);
    setGrabbing(true);
  });

  // 마우스 뗐을 때: 드래그 불가 + grab 커서 복귀
  kakao.maps.event.addListener(globalMap, 'mouseup', () => {
    globalMap.setDraggable(false);
    setGrabbing(false);
  });

  // 맵 밖으로 나가면 안전하게 복귀
  kakao.maps.event.addListener(globalMap, 'mouseleave', () => {
    globalMap.setDraggable(false);
    setGrabbing(false);
  });

  // 카카오맵 자체 드래그 이벤트와도 동기화(권장)
  kakao.maps.event.addListener(globalMap, 'dragstart', () => setGrabbing(true));
  kakao.maps.event.addListener(globalMap, 'dragend', () => setGrabbing(false));

  // 문서 바깥에서 mouseup 되는 케이스 대비
  window.addEventListener('mouseup', () => setGrabbing(false));

  // ============================================
  // 크루 마커 로드 및 렌더링
  // ============================================
  loadCrewMarkers(globalMap);

  // ============================================
  // 크루 리스트 렌더링
  // ============================================
  fetchAndRenderRuns();
}

/**
 * 크루 마커 로드 함수
 * 지도 위에 각 크루의 위치를 마커로 표시
 * @param {kakao.maps.Map} map - Kakao 지도 객체
 */
function loadCrewMarkers(map) {
  console.log('마커 로드 시작');

  // SheetBest API에서 크루 데이터 가져오기
  fetch("https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e")
    .then(res => res.json())
    .then(data => {
      console.log('데이터 로드 성공:', data.length);

      // 같은 이름의 크루 중 가장 가까운 일정만 선택
      const nearestByName = Object.values(
        data.reduce((acc, item) => {
          const scheduleDate = new Date(item.schedule);
          const key = item.name.trim();
          if (!acc[key] || scheduleDate < new Date(acc[key].schedule)) {
            acc[key] = item;
          }
          return acc;
        }, {})
      );

      // 선택된 크루들의 마커 생성
      nearestByName.forEach(run => {
        // run-marker 스타일의 마커 HTML 생성
        // 남은 인원 수를 마커에 표시
        const markerHTML = `<div class="run-marker">${run.remain}</div>`;

        // 커스텀 오버레이로 마커 생성
        new kakao.maps.CustomOverlay({
          position: new kakao.maps.LatLng(run.lat, run.lng),
          content: markerHTML,
          yAnchor: 0.5 // 마커 수직 정렬
        }).setMap(map);
      });
    })
    .catch(err => {
      console.error('마커 데이터 로드 실패:', err);
    });
}

/**
 * 두 좌표 사이의 거리 계산 함수 (하버사인 공식)
 * @param {number} lat1 - 위도 1
 * @param {number} lng1 - 경도 1
 * @param {number} lat2 - 위도 2
 * @param {number} lng2 - 경도 2
 * @returns {number} 거리 (km)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 크루 리스트 정렬 함수
 * @param {array} crewList - 정렬할 크루 리스트
 * @param {string} filter - 필터 타입 (near, distance, date, my)
 * @returns {array} 정렬된 크루 리스트
 */
function sortCrewList(crewList, filter) {
  let sortedList = [...crewList];

  switch (filter) {
    case "near":
      // 🔑 내 근처: 검색한 위치 또는 사용자 위치를 기준으로 정렬
      console.log('내 근처 필터 적용');

      // 검색한 위치가 있으면 그걸 기준으로, 없으면 사용자 위치 기준
      const baseLat = searchLat !== null ? searchLat : userLat;
      const baseLng = searchLng !== null ? searchLng : userLng;

      sortedList.sort((a, b) => {
        const distA = calculateDistance(baseLat, baseLng, parseFloat(a.lat), parseFloat(a.lng));
        const distB = calculateDistance(baseLat, baseLng, parseFloat(b.lat), parseFloat(b.lng));
        return distA - distB;
      });
      break;

    case "distance":
      // 🔑 레이스거리: 짧은 거리부터 긴 거리 순서
      console.log('레이스거리 필터 적용');
      sortedList.sort((a, b) => {
        return parseFloat(a.distance) - parseFloat(b.distance);
      });
      break;

    case "date":
      // 🔑 날짜: 가장 가까운 날짜부터 순서
      console.log('날짜 필터 적용');
      sortedList.sort((a, b) => {
        const dateA = new Date(a.schedule);
        const dateB = new Date(b.schedule);
        return dateA - dateB;
      });
      break;

    case "my":
      // MY는 북마크된 것들 필터 (나중에 구현)
      console.log('MY 필터 선택 (구현 예정)');
      break;

    default:
      break;
  }

  return sortedList;
}

/**
 * 크루 리스트 데이터 fetch 및 렌더링 함수
 * @param {string} searchQuery - 검색 쿼리 (크루 이름으로 필터링)
 */
async function fetchAndRenderRuns(searchQuery = "") {
  try {
    // SheetBest API에서 크루 리스트 데이터 가져오기
    const response = await fetch('https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e');
    let crewList = await response.json();

    // 🔑 이미지 URL에서 마크다운 형식 제거 (만약 있다면)
    crewList = crewList.map(crew => {
      if (crew.image && crew.image.includes(',')) {
  // 첫 번째 이미지만 추출
  const images = crew.image
    .split(',')
    .map(url => url.trim())
    .filter(url => url && url.length > 0 && url !== 'undefined' && url !== 'null');
  
  crew.image = images.length > 0 ? images[0] : 'https://placekitten.com/200/200';
} else if (!crew.image) {
  crew.image = 'https://placekitten.com/200/200'; // 기본 이미지
}

      return crew;
    });

    // 전체 크루 데이터 전역 변수에 저장
    allCrewData = crewList;

    // 검색 쿼리가 있으면 필터링
    if (searchQuery) {
      crewList = crewList.filter(crew => crew.name.includes(searchQuery));
    }

    // 현재 활성화된 필터에 따라 정렬
    crewList = sortCrewList(crewList, activeFilter);

    // ⭐️ [신규] 렌더링 전, 현재 사용자의 북마크 ID 목록 불러오기
    const bookmarkedIds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ID_KEY) || "[]");

    // 정렬된 크루 리스트 렌더링 (⭐️ 북마크 ID 목록 전달)
    renderRuns(crewList, bookmarkedIds);

  } catch (error) {
    console.error("데이터 로드 실패:", error);

    // API 실패 시 임시 데이터로 렌더링 (폴백)
    const fallbackData = [
      {
        id:'YEO01', 
        schedule:'2025-11-15 09:30', 
        location:'여의도 한강', 
        distance:'3.5', 
        remain:'7', 
        image:'https://placekitten.com/200/200',
        name: '여의도 한강 크루',
        lat: '37.5300',
        lng: '126.9244'
      },
      {
        id:'SEONG01', 
        schedule:'2025-11-10 07:00', 
        location:'성수 서울숲', 
        distance:'5.1', 
        remain:'3', 
        image:'https://placekitten.com/200/201',
        name: '성수 서울숲 크루',
        lat: '37.5448',
        lng: '127.0496'
      }
    ];
    
    allCrewData = fallbackData;
    let filtered = fallbackData;
    
    if (searchQuery) {
      filtered = fallbackData.filter(crew => crew.name.includes(searchQuery));
    }
    
    filtered = sortCrewList(filtered, activeFilter);
    
    // ⭐️ [신규] 북마크 ID 목록 (폴백)
    const bookmarkedIds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ID_KEY) || "[]");
    renderRuns(filtered, bookmarkedIds);
  }
}

/**
 * 크루 리스트 렌더링 함수
 * run-list 컨테이너에 run-card 카드들을 생성
 * 🔑 각 카드에 기준 위치(사용자 또는 검색 위치)로부터의 거리를 표시
 * @param {array} list - 렌더링할 크루 리스트 데이터
 * @param {array} bookmarkedIds - ⭐️ [신규] 북마크된 ID 목록
 */
function renderRuns(list, bookmarkedIds = []) { // ⭐️ [수정] bookmarkedIds 파라미터 추가
  // run-list 컨테이너 (grid 레이아웃) 선택
  const container = document.getElementById("run-list");
  if (!container) return;

  // 기존 카드들 제거
  container.innerHTML = "";

  // 검색 결과가 없으면 안내 메시지 표시
  if (list.length === 0) {
    container.innerHTML = "<div style='padding:70px;text-align:center;color:#a1a1a1;'>검색 결과가 없습니다.</div>";
    return;
  }

// 🔑 기준 위치 결정 (검색한 위치가 있으면 그것, 없으면 사용자 위치)
  const baseLat = searchLat !== null ? searchLat : userLat;
  const baseLng = searchLng !== null ? searchLng : userLng;

  // 각 크루 데이터를 run-card 카드로 변환해서 렌더링
  list.forEach(item => {
    // run-card: 개별 크루 카드
    const card = document.createElement("div");
    card.className = "run-card";
    
    // 더 알아보기 버튼 링크 생성
    // explanation.html에 id와 name 파라미터 전달
    const explanationUrl = `../explanation/explanation.html?id=${item.id}&name=${encodeURIComponent(item.name)}`;
    

    
    // 🔑 기준 위치에서 이 크루까지의 거리 계산
    const distanceToCrewLocation = calculateDistance(
      baseLat, 
      baseLng, 
      parseFloat(item.lat), 
      parseFloat(item.lng)
    );
    

    // 거리를 소수점 1자리까지 표시
    const distanceText = distanceToCrewLocation.toFixed(1);

    // ⭐️ [신규] 현재 아이템이 북마크되었는지 확인
    const isBookmarked = bookmarkedIds.includes(item.id.trim());

    card.innerHTML = `
      <img class="run-card-image" src="${item.image || 'https://placekitten.com/200/200'}" alt="${item.location}">
      
      <div class="run-info">
        <div class="run-schedule">${item.schedule}</div>
        
        <div class="run-location">온런 · ${item.location}</div>
        
        <div class="run-distance">${item.distance} km · ${item.distance} min</div>
        
        <div class="run-bottom">
          <div class="run-remain">신청인원 : ${item.remain} / ${item.limit} </div>
          
          <button class="bookmark-btn" type="button" aria-label="즐겨찾기" aria-pressed="${isBookmarked}">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="icon-default" viewBox="0 0 16 16">
              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1z"/>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="icon-active" viewBox="0 0 16 16">
              <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2"/>
            </svg>
          </button>
        </div>

        <div class="run-overlay">
          <span>더 알아보기</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor"
                class="bi bi-arrow-right-short" viewBox="0 0 16 16">
                <path fill-rule="evenodd"
                    d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8" />
          </svg>
        </div>
      </div>
    `;

    // 생성된 카드를 컨테이너에 추가
    container.appendChild(card);


    // ******* 북마크 버튼 제외하는게 어려워서 이미지만 선택하면 이동하는 것으로 변경 (2025.11.11) 추후 수정 시 삭제 *******
    // 썸네일 이미지 클릭 시 explanation.html로 이동
    card.querySelector('.run-card-image').addEventListener('click', (e) => {
      e.stopPropagation(); // 혹시 상위 이벤트 있을 때 대비
      window.location.href = `../explanation/explanation.html?id=${item.id}&name=${encodeURIComponent(item.name)}`;
    });

    // --- ⭐️ [신규] 북마크 버튼 이벤트 리스너 ---
    const bookmarkBtn = card.querySelector('.bookmark-btn');
    if (bookmarkBtn) {
      bookmarkBtn.addEventListener('click', (e) => {
        e.stopPropagation(); 
        e.preventDefault(); 
        
        if (!IS_LOGGED_IN) {
          alert("로그인 후 북마크할 수 있습니다.");
          window.location.href = '../userauth/login.html'; // 로그인 페이지로 이동
          return;
        }
        
        // 1. UI 즉시 업데이트
        const newState = !(bookmarkBtn.getAttribute('aria-pressed') === 'true');
        bookmarkBtn.setAttribute('aria-pressed', String(newState));
        
        // 2. localStorage 데이터 업데이트
        toggleBookmark(item); 
      });
    }
    // --- ⭐️ [신규] 끝 ---
  });
}







// ============================================
// 🔑 Daum 우편번호 API 관련 함수들 (onprogram.js 맨 끝에 추가)
// ============================================

/**
 * 🔹 Daum 우편번호 API 초기화 함수
 * - 검색 버튼 클릭 시 팝업 실행
 * - 검색 input 클릭 시 팝업 실행
 * - search-wrapper 클릭 이벤트 제거 → 금지 버튼 문제 해결
 */
function initDaumPostcodeSearch() {
  const searchBtn = document.getElementById("search-btn");
  const searchInput = document.getElementById("location-search");

  // 검색 버튼 클릭 시 팝업 실행
  searchBtn.addEventListener("click", () => {
    execDaumPostcode();
  });

  // 검색 input 클릭 시 팝업 실행
  searchInput.addEventListener("click", () => {
    execDaumPostcode();
  });

  // CSS로 커서 스타일 변경 (금지 → pointer)
  searchInput.style.cursor = "pointer";
  if (searchInput.parentElement) {
    searchInput.parentElement.style.cursor = "pointer";
  }
}

/**
 * 🔹 Daum 우편번호 API 실행 함수
 * - 팝업 띄우고 선택한 주소를 처리
 * - 선택 후 검색 input에 주소만 표시
 */
function execDaumPostcode() {
  new daum.Postcode({
    oncomplete: function (data) {
      const addr = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
      document.getElementById("location-search").value = addr;
    },
    width: 400,
    height: 500,
    autoClose: true
  }).open();
}


/**
 * 🔹 검색 버튼 클릭 시 지도/리스트 갱신 함수
 * - 주소를 좌표로 변환하여 지도 중심 이동, 마커 표시
 * - 필터 "내 근처" 적용
 * - 리스트 거리순 정렬 후 렌더링
 */

function updateMapAndList() {
  const addr = document.getElementById("location-search").value.trim();
  if (!addr) {
    alert("주소를 입력해주세요.");
    return;
  }

  // 필터 "내 근처" 자동 적용
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
  document.querySelector('[data-filter="near"]').classList.add("active");
  activeFilter = "near";

  // 주소 좌표 변환 후 리스트 갱신
  geocodeAddress(addr, () => {
    fetchAndRenderRuns();
  });
}


// 검색 버튼에 updateMapAndList 함수 연결
document.getElementById("search-btn").addEventListener("click", updateMapAndList);

/**
 * 🔹 주소를 좌표로 변환하는 함수
 * - Kakao Geocoder API 사용
 * - 변환 성공 시 전역 변수(searchLat, searchLng)에 저장
 * - 지도 중심 이동 및 빨간 마커 표시
 * @param {string} addr - 변환할 주소
 */
function geocodeAddress(addr, callback) {
  const geocoder = new kakao.maps.services.Geocoder();

  geocoder.addressSearch(addr, function (result, status) {
    if (status === kakao.maps.services.Status.OK) {
      const lat = parseFloat(result[0].y);
      const lng = parseFloat(result[0].x);

      // 검색 좌표 전역 변수에 저장
      searchLat = lat;
      searchLng = lng;

      // 지도 중심 이동
      globalMap.setCenter(new kakao.maps.LatLng(lat, lng));

      // 선택 위치 빨간 마커 표시
      displaySearchMarker(lat, lng, addr);

      // 좌표 변환 완료 후 콜백 호출
      if (callback) callback();
    } else {
      alert('주소를 좌표로 변환하지 못했습니다. 다시 시도해주세요.');
      console.error('좌표 변환 실패:', status);
    }
  });
}


/**
 * 🔹 선택한 위치에 빨간 마커 표시 함수
 * - 이전 마커가 있으면 제거
 * @param {number} lat - 위도
 * @param {number} lng - 경도
 * @param {string} placeName - 장소명/주소
 */
function displaySearchMarker(lat, lng, placeName) {
  if (window.searchMarker) {
    window.searchMarker.setMap(null);
  }

  const markerImage = new kakao.maps.MarkerImage(
    'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png',
    new kakao.maps.Size(31, 35)
  );

  window.searchMarker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(lat, lng),
    title: placeName,
    image: markerImage
  });

  window.searchMarker.setMap(globalMap);
}

// --- ⭐️ [신규] 북마크 토글 함수 ---
/**
 * 북마크 상태를 토글하고 localStorage에 저장합니다.
 * @param {object} crewItem - 북마크할 크루 아이템 객체
 */
function toggleBookmark(crewItem) {
    if (!crewItem || !crewItem.id) return;

    // 1. 현재 북마크 목록 (ID 배열, 데이터 배열) 불러오기
    let bookmarkedIds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ID_KEY) || "[]");
    let bookmarkedData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_DATA_KEY) || "[]");
    
    const crewId = crewItem.id.trim();
    const existingIndex = bookmarkedIds.indexOf(crewId);

    if (existingIndex > -1) {
        // --- 북마크 제거 ---
        bookmarkedIds.splice(existingIndex, 1); // ID 배열에서 제거
        bookmarkedData = bookmarkedData.filter(run => run.id !== crewId); // 데이터 배열에서 제거
        console.log("북마크 제거:", crewId);
    } else {
        // --- 북마크 추가 ---
        bookmarkedIds.push(crewId); // ID 배열에 추가
        
        // ⭐️ mypage에서 필요로 하는 객체 형식으로 저장
        const bookmarkObject = {
            id: crewId,
            location: crewItem.location || "정보 없음",
            date: crewItem.schedule ? crewItem.schedule.split(" ")[0] : "날짜 없음",
            departure: crewItem.departure || "정보 없음",
            destination: crewItem.destination || "정보 없음",
            distance: crewItem.distance || "?",
            level: crewItem.level || "정보 없음",
            link: `explanation/explanation.html?id=${crewId}` // ⭐️ mypage 기준 상대 경로
        };
        bookmarkedData.push(bookmarkObject);
        console.log("북마크 추가:", bookmarkObject);
    }

    // 3. localStorage에 다시 저장
    localStorage.setItem(LOCAL_STORAGE_ID_KEY, JSON.stringify(bookmarkedIds));
    localStorage.setItem(LOCAL_STORAGE_DATA_KEY, JSON.stringify(bookmarkedData));
}
// --- ⭐️ [신규] 끝 ---