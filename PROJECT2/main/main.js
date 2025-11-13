/************************************
 * 1) 전역 변수 및 상수 선언
 ************************************/
const SHEET_BASE =
  "https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e";
const RESERVATION_API =
  "https://api.sheetbest.com/sheets/4e2d77b5-9ae8-4a14-bfee-5b7dffe35b95";

let map = null;
let scrolled = false;
let mapInitialized = false;

// ⭐️ [수정] 데이터 변수 세분화
let allCrewDataRaw = []; // ⭐️ API 원본 데이터 (모든 크루)
let crewDataForPanel = []; // ⭐️ 패널 리스트에 보여줄 데이터 (필터링/정렬된 전체 크루)
let crewDataForMap = []; // ⭐️ 지도 마커에 보여줄 데이터 (이름별 가장 빠른 크루)

let userPosition = null;
let userMarker = null;
let markerList = [];

// ⭐️ [수정] sessionStorage에서 로그인 정보 읽기 (login.js와 연동)
let USER_EMAIL = null;
const loggedInUser = sessionStorage.getItem("loggedInUser");
if (loggedInUser) {
  try {
    const user = JSON.parse(loggedInUser);
    USER_EMAIL = user.email;
  } catch (e) {
    console.error("Failed to parse user session", e);
  }
}

// DOM 요소 캐싱
const mapArea = document.querySelector(".map_area");
const slideOpenBtn = document.getElementById("slideOpenBtn");
const slideCloseBtn = document.getElementById("slideCloseBtn");
const slidePanel = document.getElementById("slidePanel");
const crewListPanel = document.getElementById("crewListPanel");
const mapElement = document.getElementById("map");

// 검색 관련 DOM 요소
const addressInput = document.getElementById("addressInput");
const myLocationBtn = document.getElementById("myLocationBtn");
const addressClearBtn = document.getElementById("addressClearBtn");

/************************************
 * 1.1) 헬퍼 함수 (모달 및 토스트)
 ************************************/

/**
 * ⭐️ [신규] 로그인 필요 모달 표시
 * main.css에 정의된 .login-modal 스타일을 사용합니다.
 */
function showLoginModal() {
  // 이미 모달이 떠 있으면 중복 실행 방지
  if (document.getElementById("loginModal")) return;

  const modalHTML = `
  <div class="login-modal" id="loginModal">
      <div class="login-modal-content">
          <h2>로그인 필요</h2>
          <p>이 기능을 사용하려면 로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?</p>
          <div class="login-modal-buttons">
              <button class="login-modal-btn close" id="loginModalClose">취소</button>
              <button class="login-modal-btn" id="loginModalGo">로그인</button>
          </div>
      </div>
  </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  // 닫기 버튼
  document.getElementById("loginModalClose").onclick = () => {
    document.getElementById("loginModal").remove();
  };
  // 로그인 이동 버튼
  document.getElementById("loginModalGo").onclick = () => {
    window.location.href = "../userauth/login.html"; // 로그인 페이지로 이동
  };
}

/**
 * ⭐️ [신규] alert() 대체를 위한 커스텀 토스트 메시지
 * @param {string} message - 표시할 메시지
 * @param {boolean} isError - 에러 여부 (true시 빨간색)
 */
function showCustomToast(message, isError = false) {
  // 이전 토스트가 있다면 제거
  if (document.getElementById("customToast")) {
    document.getElementById("customToast").remove();
  }

  const toast = document.createElement("div");
  toast.id = "customToast";
  toast.textContent = message;
  toast.style.position = "fixed";
  toast.style.top = "20px";
  toast.style.left = "50%";
  toast.style.transform = "translateX(-50%)";
  toast.style.padding = "12px 20px";
  toast.style.borderRadius = "8px";
  toast.style.backgroundColor = isError ? "#f44336" : "#333"; // 에러는 빨간색, 정보는 검은색
  toast.style.color = "white";
  toast.style.zIndex = "3000";
  toast.style.fontSize = "14px";
  toast.style.fontWeight = "600";
  toast.style.boxShadow = "0 4px 12px rgba(0,0,0,0.15)";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s ease, top 0.3s ease";

  document.body.appendChild(toast);

  // Animate in (나타나기)
  setTimeout(() => {
    toast.style.opacity = "1";
    toast.style.top = "30px";
  }, 10);

  // Animate out and remove (사라지기)
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.top = "20px";
    toast.addEventListener("transitionend", () => {
      if (toast.parentElement) {
        toast.remove();
      }
    });
  }, 3000); // 3초 후 사라짐
}

/************************************
 * 1.2) ⭐️ [신규] 위치 정보 Promisify
 ************************************/

/**
 * ⭐️ [신규] navigator.geolocation.getCurrentPosition을 Promise로 감싸서
 * async/await 구문에서 사용할 수 있게 합니다.
 */
function getGeoLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
    } else {
      // 성공 시 resolve(position), 실패 시 reject(error)
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
}

/************************************
 * 2) 초기화 함수
 ************************************/

/**
 * ⭐️ [수정] async 함수로 변경
 * 사용자 위치 정보 가져오기 및 지도 초기화
 */
async function initializeUserLocation() {
  try {
    // ⭐️ [수정] Promise 기반의 위치 정보 함수를 await로 호출
    const position = await getGeoLocation();
    userPosition = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch (error) {
    console.log("위치 정보를 가져올 수 없음, 기본값 사용:", error.message);
    userPosition = { lat: 37.5665, lng: 126.978 }; // 서울 기본값
  }

  // ⭐️ [수정] initMapWithUser가 완료되기를 기다림
  await initMapWithUser();
}

/**
 * ⭐️ [수정] async 함수로 변경
 * 지도 초기화 + 사용자 마커 추가
 */
async function initMapWithUser() {
  // ⭐️ [수정] initMap(및 내부의 loadCrewData)이 완료되기를 기다림
  await initMap();
  addUserMarker(); // ⭐️ 마커 추가는 맵 초기화가 끝난 후 실행
}

/**
 * ⭐️ [수정] async 함수로 변경
 * 카카오 지도 초기화 (유일한 initMap 함수)
 */
async function initMap() {
  const mapContainer = document.getElementById("map");

  map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(userPosition.lat, userPosition.lng),
    level: 5,
    draggable: false,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    draggableCursor: "grab",
    draggingCursor: "grabbing",
  });

  // ⭐️ [수정] loadCrewData가 완료될 때까지 기다림
  // 이 함수가 완료되어야 첫 "근처" 탭 렌더링이 보장됨
  await loadCrewData(); // ⭐️ 여기서 allCrewDataRaw, crewDataForPanel, crewDataForMap이 모두 채워짐

  // ⭐️ [수정] addUserMarker()는 initMapWithUser로 이동 (중복 제거)
  initLongPressDrag(map);
  createZoomButtons();

  // 지도 클릭 시 슬라이드 패널 닫기
  kakao.maps.event.addListener(map, "click", function () {
    closePanel();
    slideOpenBtn.style.display = "flex";
    slideOpenBtn.style.opacity = "1";
    slideOpenBtn.style.pointerEvents = "auto";
  });
}

/************************************
 * 3) 마커 관련 함수
 ************************************/

/**
 * 사용자 현재 위치 마커 표시
 */
function addUserMarker() {
  if (!map) return;

  if (userMarker) userMarker.setMap(null);

  const markerPosition = new kakao.maps.LatLng(
    userPosition.lat,
    userPosition.lng
  );
  userMarker = new kakao.maps.Marker({
    position: markerPosition,
    image: new kakao.maps.MarkerImage(
      "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      new kakao.maps.Size(24, 35)
    ),
  });
  userMarker.setMap(map);
}

/**
 * 지도에서 모든 크루 마커 초기화 (중복 방지)
 */
function clearMarkers() {
  markerList.forEach((m) => m.setMap(null));
  markerList = [];
}

/**
 * 크루 데이터를 지도에 마커로 표시
 * @param {Array} list - 크루 데이터 배열
 */
function addCrewMarkers(list) {
  list.forEach((crew) => {
    // ⭐️ lat, lng 값이 유효한지 확인
    const lat = parseFloat(crew.lat);
    const lng = parseFloat(crew.lng);
    if (isNaN(lat) || isNaN(lng)) {
      console.warn("Invalid coordinates for crew:", crew.name);
      return; // 유효하지 않은 좌표는 건너뛰기
    }

    const remain = Number(crew.remain);

    const markerHTML = `
      <div class="crew-marker" data-crew-id="${crew.id}">
        <span>${remain}</span>
      </div>
    `;

    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(lat, lng),
      content: markerHTML,
      yAnchor: 1,
    });

    overlay.setMap(map);
    markerList.push(overlay);
  });

  // ⭐️ [신규] 마커 클릭 이벤트 위임 (goReserve와 연동)
  // DOM에 마커가 추가된 후 이벤트 리스너 설정
  setTimeout(() => {
    document.querySelectorAll(".crew-marker").forEach((markerEl) => {
      markerEl.onclick = () => {
        const crewId = markerEl.dataset.crewId;

        // ⭐️ [수정] 'crewDataForPanel'(현재 패널 목록) 또는 'allCrewDataRaw' (전체)에서 크루 정보 찾기
        let crew = crewDataForPanel.find((c) => c.id === crewId);
        if (!crew) {
          crew = allCrewDataRaw.find((c) => c.id === crewId);
        }

        if (crew) {
          goReserve(
            crew.id,
            crew.url || "",
            crew.remain || 30,
            crew.name,
            crew.schedule ? crew.schedule.split(" ")[0] : ""
          );
        } else {
          console.warn(`Crew info not found for ID: ${crewId}`);
        }
      };
    });
  }, 0);
}

/************************************
 * 4) 지도 상호작용 함수
 ************************************/

/**
 * 줌 인/아웃 버튼 생성 및 이벤트 연결
 */
function createZoomButtons() {
  document.getElementById("zoomInBtn").addEventListener("click", () => {
    map.setLevel(map.getLevel() - 1);
  });

  document.getElementById("zoomOutBtn").addEventListener("click", () => {
    map.setLevel(map.getLevel() + 1);
  });
}

/**
 * 길게 누르고 드래그로 지도 이동 기능
 * @param {Object} map - 카카오 지도 객체
 */
function initLongPressDrag(map) {
  let pressTimer;
  const mapContainer = map.getNode();

  // 마우스 누름
  kakao.maps.event.addListener(map, "mousedown", function () {
    pressTimer = setTimeout(() => {
      map.setDraggable(true);
      mapContainer.classList.add("grabbing");
    }, 200); // 200ms 이상 누르면 드래그 허용
  });

  // 마우스 뗌
  kakao.maps.event.addListener(map, "mouseup", function () {
    clearTimeout(pressTimer);
    map.setDraggable(false);
    mapContainer.classList.remove("grabbing");
  });

  // 마우스가 지도 밖으로 나감
  kakao.maps.event.addListener(map, "mouseout", function () {
    clearTimeout(pressTimer);
    map.setDraggable(false);
    mapContainer.classList.remove("grabbing");
  });
}

/************************************
 * 5) 크루 카드 HTML 구조 (공용 템플릿)
 ************************************/

/**
 * 크루 카드 HTML 구조를 생성하는 함수
 * - renderCrewCards에서 호출
 * - 이미지, 일정, 이름, 사용자 거리, 코스거리 정보 포함
 * @param {Object} crew - 크루 데이터 객체
 * @param {string} userDistance - 사용자로부터의 거리 (예: "5.8km" 또는 "-")
 * @param {string} courseDistance - 크루 코스거리 (예: "3.5km")
 * @returns {string} 크루 카드 HTML
 */
function getCrewCardHTML(crew, userDistance, courseDistance) {
  // ⭐️ 이미지 URL 파싱 (콤마로 구분된 첫 번째 이미지만 사용)
  let imageUrl = "https://placehold.co/300x200/eee/aaa?text=No+Image";
  if (crew.image) {
    const firstImage = crew.image.split(",")[0].trim();
    if (firstImage && firstImage !== "null" && firstImage !== "undefined") {
      imageUrl = firstImage;
    }
  }

  return `
    <div class="inner-img">
      <img src="${imageUrl}" alt="${
    crew.name
  }" onerror="this.src='https://placehold.co/300x200/eee/aaa?text=No+Image'">
    </div>
    <div class="inner-details">
      <div class="inner-description">
        <div class="crew-date">${crew.schedule}</div>
        <div class="crew-name">${crew.name}</div>
        <div class="crew-trackInfo">
          <span class="crew-distnace"> ${crew.distance} km </span>
          <span>·</span>           
          <span class="crew-time"> ${crew.time} min</span>
        </div>
        <div class="crew-leftSpot">남은 인원 ${crew.remain} / 30</div>
      </div>
      <button class="crew-apply-btn" type="button" id="crewApplyBtn">
        <span>신청하기</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" class="bi bi-arrow-right-short" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M4 8a.5.5 0 0 1 .5-.5h5.793L8.146 5.354a.5.5 0 1 1 .708-.708l3 3a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708-.708L10.293 8.5H4.5A.5.5 0 0 1 4 8" />
        </svg>
      </button>
    </div>
  `;
}

/************************************
 * 6) 크루 카드 렌더링 함수 (공용)
 ************************************/

/**
 * 크루 카드 목록을 화면에 렌더링
 * - getCrewCardHTML 함수로 HTML 구조 재사용
 * - 모든 상황에서 사용자 거리 + 코스거리 표시
 * @param {Array} crewList - 렌더링할 크루 배열
 */
function renderCrewCards(crewList) {
  crewListPanel.innerHTML = ""; // 패널 비우기

  if (crewList.length === 0) {
    // ⭐️ [신규] 예약 내역이 없을 때 표시
    if (isMyReservationMode) {
      crewListPanel.innerHTML =
        '<p class="no-reservation">다가오는 예약이 없습니다.</p>'; // ⭐️ [수정] 메시지 변경
    } else {
      crewListPanel.innerHTML =
        '<p class="no-reservation">표시할 크루가 없습니다.</p>';
    }
    return;
  }

  crewList.forEach((crew) => {
    const div = document.createElement("div");
    div.className = "crew-card";

    // 사용자 거리 표시
    const userDistance =
      crew.distanceFromUser !== undefined
        ? `${crew.distanceFromUser.toFixed(1)}km`
        : "-";
    const courseDistance = `${crew.distance}km`;

    div.innerHTML = getCrewCardHTML(crew, userDistance, courseDistance);

    // 예약 클릭 시 goReserve 사용
    div.onclick = () =>
      goReserve(
        crew.id,
        crew.url || "",
        crew.remain || 30,
        crew.name,
        crew.schedule ? crew.schedule.split(" ")[0] : ""
      );
    crewListPanel.appendChild(div);
  });
}

/************************************
 * 7) 다음 우편번호 API + 주소 검색 기능
 ************************************/

/**
 * 다음 우편번호 API로 주소 검색
 */
function searchAddressWithDaum() {
  if (allCrewDataRaw.length === 0) {
    console.log("크루 데이터 로딩 중... 0.5초 후 다시 시도");
    setTimeout(() => searchAddressWithDaum(), 500);
    return;
  }

  if (typeof daum === "undefined") {
    showCustomToast("다음 우편번호 서비스를 로드할 수 없습니다.", true);
    return;
  }

  new daum.Postcode({
    oncomplete: function (data) {
      let fullAddr = data.address;

      if (data.roadAddress) {
        fullAddr = data.roadAddress;
      }

      addressInput.value = fullAddr;
      addressInput.dispatchEvent(new Event("input", { bubbles: true }));

      if (typeof kakao === "undefined") {
        showCustomToast("카카오 맵 API를 로드할 수 없습니다.", true);
        return;
      }

      const geocoder = new kakao.maps.services.Geocoder();
      geocoder.addressSearch(fullAddr, function (result, status) {
        if (status === kakao.maps.services.Status.OK) {
          const coords = new kakao.maps.LatLng(result[0].y, result[0].x);

          map.setCenter(coords);

          // 검색한 주소를 새로운 기준점으로 설정
          userPosition = {
            lat: result[0].y,
            lng: result[0].x,
          };

          addUserMarker();

          // ⭐️ [수정] 'allCrewDataRaw' (전체 크루) 기준으로 거리 계산
          const allCrewsWithDistance = allCrewDataRaw.map((crew) => {
            const distanceToUser = calcDistance(
              userPosition.lat,
              userPosition.lng,
              parseFloat(crew.lat),
              parseFloat(crew.lng)
            );
            return {
              ...crew,
              distanceFromUser: distanceToUser, // 사용자 위치에서 크루까지의 거리
            };
          });

          // ⭐️ [수정] 1. 패널용 데이터: 거리순 정렬된 *전체* 목록
          crewDataForPanel = [...allCrewsWithDistance].sort(
            (a, b) => a.distanceFromUser - b.distanceFromUser
          );

          // ⭐️ [수정] 2. 맵용 데이터: '이름별 가장 빠른' 크루 목록
          const earliestByName = {};
          allCrewsWithDistance.forEach((c) => {
            if (c.name && c.schedule) {
              const key = c.name.trim();
              const d = new Date(c.schedule.replace(/\./g, "-"));
              if (
                !earliestByName[key] ||
                d < new Date(earliestByName[key].schedule.replace(/\./g, "-"))
              ) {
                earliestByName[key] = c;
              }
            }
          });
          crewDataForMap = Object.values(earliestByName);

          // 3. 지도/패널 업데이트
          clearMarkers();
          addCrewMarkers(crewDataForMap); // ⭐️ 맵에는 '가장 빠른' 마커만 표시
          renderCrewCards(crewDataForPanel); // ⭐️ 패널에는 '전체' 목록 표시
          isMyReservationMode = false; // '나의 예약' 모드 해제
        } else {
          showCustomToast("주소 검색에 실패했습니다. 다시 시도해주세요.", true);
        }
      });
    },
    width: "100%",
    height: "100%",
  }).open();
}

/**
 * 현재 위치로 지도 이동
 */
function moveToCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        userPosition = {
          lat: lat,
          lng: lng,
        };

        const coords = new kakao.maps.LatLng(lat, lng);
        map.setCenter(coords);
        addUserMarker();

        // 좌표 → 주소 변환 (역지오코딩)
        if (typeof kakao !== "undefined") {
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.coord2Address(lng, lat, function (result, status) {
            if (
              status === kakao.maps.services.Status.OK &&
              result.length > 0
            ) {
              addressInput.value = result[0].address.address_name;
              addressInput.dispatchEvent(new Event("input", { bubbles: true }));
            } else {
              addressInput.value = `현재 위치 (${lat.toFixed(4)}, ${lng.toFixed(
                4
              )})`;
            }
          });
        }

        console.log("현재 위치로 이동:", lat, lng);
      },
      function (error) {
        console.error("위치 정보 오류:", error);
        showCustomToast("현재 위치를 불러올 수 없습니다.", true);
      }
    );
  } else {
    showCustomToast("이 브라우저에서는 위치 정보를 지원하지 않습니다.", true);
  }
}

/**
 * 검색 기능 초기화
 */
function initSearchFeatures() {
  if (addressInput) {
    addressInput.addEventListener("click", function (e) {
      e.stopPropagation();
      searchAddressWithDaum();
    });
  }

  if (myLocationBtn) {
    myLocationBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      moveToCurrentLocation();
    });
  }
}

/**
 * 검색창 X 버튼 가시성 업데이트
 */
function updateClearButtonVisibility() {
  if (!addressInput || !addressClearBtn) return;
  addressClearBtn.style.display =
    addressInput.value.trim() !== "" ? "block" : "none";
}

/************************************
 * 8) 근처 필터 함수
 ************************************/

/**
 * 근처 필터 버튼 클릭 이벤트
 */
function handleNearbyFilter() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        // 사용자 위치 리셋
        userPosition = {
          lat: lat,
          lng: lng,
        };

        // 지도 중심 이동
        const coords = new kakao.maps.LatLng(lat, lng);
        map.setCenter(coords);
        addUserMarker();

        // ⭐️ [수정] 'allCrewDataRaw' (전체 크루) 기준으로 거리 계산
        const allCrewsWithDistance = allCrewDataRaw.map((crew) => {
          const distance = calcDistance(
            userPosition.lat,
            userPosition.lng,
            parseFloat(crew.lat),
            parseFloat(crew.lng)
          );
          return { ...crew, distanceFromUser: distance };
        });

        // 15km 반경 내 크루만 필터링
        const nearbyCrew = allCrewsWithDistance.filter(
          (crew) => crew.distanceFromUser <= 15
        );

        // ⭐️ [수정] 1. 패널용 데이터: 15km 이내 '전체' 크루 (거리순 정렬)
        crewDataForPanel = [...nearbyCrew].sort(
          (a, b) => a.distanceFromUser - b.distanceFromUser
        );

        // ⭐️ [수정] 2. 맵용 데이터: 15km 이내 '이름별 가장 빠른' 크루
        const earliestByNameNearby = {};
        nearbyCrew.forEach((c) => {
          if (c.name && c.schedule) {
            const key = c.name.trim();
            const d = new Date(c.schedule.replace(/\./g, "-"));
            if (
              !earliestByNameNearby[key] ||
              d < new Date(earliestByNameNearby[key].schedule.replace(/\./g, "-"))
            ) {
              earliestByNameNearby[key] = c;
            }
          }
        });
        crewDataForMap = Object.values(earliestByNameNearby);

        // 3. 지도/패널 업데이트
        clearMarkers();
        addCrewMarkers(crewDataForMap); // ⭐️ 맵에는 '가장 빠른' 마커만 표시
        renderCrewCards(crewDataForPanel); // ⭐️ 패널에는 '전체' 목록 표시
        isMyReservationMode = false; // '나의 예약' 모드 해제
      },
      function (error) {
        console.error("위치 정보 오류:", error);
        showCustomToast("현재 위치를 불러올 수 없습니다.", true);
      }
    );
  } else {
    showCustomToast("이 브라우저에서는 위치 정보를 지원하지 않습니다.", true);
  }
}

/************************************
 * 9) 크루 데이터 로드 및 처리
 ************************************/

/**
 * Google Sheet에서 크루 데이터 가져오고 처리
 * - ⭐️ [수정] allCrewDataRaw, crewDataForPanel, crewDataForMap 분리
 */
async function loadCrewData() {
  try {
    const res = await fetch(`${SHEET_BASE}/tabs/CREWLIST`);
    const data = await res.json();

    // ⭐️ 1. 원본 데이터 저장 (나의 예약 매칭용)
    allCrewDataRaw = data;

    // 2. 거리 계산된 '전체' 목록 생성
    let processedList = data.map((crew) => {
      const distance = calcDistance(
        userPosition.lat,
        userPosition.lng,
        parseFloat(crew.lat),
        parseFloat(crew.lng)
      );
      return { ...crew, distanceFromUser: distance };
    });

    // ⭐️ 3. 패널용 데이터: 거리순 정렬된 '전체' 목록
    crewDataForPanel = [...processedList].sort(
      (a, b) => a.distanceFromUser - b.distanceFromUser
    );

    // ⭐️ 4. 맵용 데이터: '이름별 가장 빠른' 일정만 유지 (지도 표시용)
    const earliestByName = {};
    processedList.forEach((c) => {
      // ⭐️ 유효한 일정인지 확인
      if (c.name && c.schedule) {
        const key = c.name.trim();
        const d = new Date(c.schedule.replace(/\./g, "-")); // 날짜 형식 보정
        if (
          !earliestByName[key] ||
          d < new Date(earliestByName[key].schedule.replace(/\./g, "-"))
        ) {
          earliestByName[key] = c;
        }
      }
    });
    crewDataForMap = Object.values(earliestByName);

    // 5. 지도 마커 & 리스트 업데이트 (최초 로드)
    clearMarkers();
    addCrewMarkers(crewDataForMap); // ⭐️ 지도에는 '가장 빠른' 크루 마커만 표시
    renderCrewCards(crewDataForPanel); // ⭐️ 패널에는 '전체' 크루 목록 표시
  } catch (err) {
    console.error("크루 데이터를 불러오는 중 오류:", err);
  }
}

/************************************
 * 10) 정렬 함수 (crewDataForPanel 기준)
 ************************************/

/**
 * 사용자 위치 기준 가까운 순으로 정렬
 */
function sortByNear() {
  crewDataForPanel.sort((a, b) => a.distanceFromUser - b.distanceFromUser);
}

/**
 * 페이스(Pace) 기준 정렬 (빠른 속도 순)
 */
function sortByPace() {
  crewDataForPanel.sort((a, b) => paceToSeconds(a.pace) - paceToSeconds(b.pace));
}

/**
 * 거리 기준 정렬 (짧은 거리 순)
 */
function sortByDistance() {
  crewDataForPanel.sort((a, b) => a.distance - b.distance);
}

/**
 * 날짜 기준 정렬 (가장 빠른 일정 순)
 */
function sortByDate() {
  crewDataForPanel.sort(
    (a, b) =>
      new Date(a.schedule.replace(/\./g, "-")) -
      new Date(b.schedule.replace(/\./g, "-"))
  );
}

/**
 * 페이스 문자열을 초 단위로 변환
 */
function paceToSeconds(paceStr) {
  if (!paceStr) return 9999;
  const parts = paceStr.split("'");
  const minutes = parseInt(parts[0]) || 0;
  const seconds = parseInt(parts[1] || "0");
  return minutes * 60 + seconds;
}

/************************************
 * 11) 크루 리스트 렌더링 (패널)
 ************************************/

/**
 * 사이드 패널에 크루 카드 리스트 렌더링
 * - ⭐️ [수정] crewDataForPanel (전체 목록) 사용
 */
let isMyReservationMode = false; // ⭐️ '나의 예약' 모드 플래그

function renderCrewList() {
  if (isMyReservationMode) return; // 내 예약 모드면 이 함수 실행 안 함

  // ⭐️ [수정] 'crewDataForPanel'(전체 목록)을 렌더링
  renderCrewCards(crewDataForPanel);
}

/************************************
 * 12) 필터 버튼 및 정렬 적용
 ************************************/

/**
 * 필터 버튼의 정렬 기능 연결
 */
function initFilterButtons() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      document
        .querySelectorAll(".filter-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // ⭐️ [수정] "나의 예약" 버튼 클릭 로직
      if (btn.dataset.filter === "myReservation") {
        isMyReservationMode = true; // 내 예약 모드 ON
        if (!USER_EMAIL) {
          // ⭐️ [신규] 로그인 모달 표시
          showLoginModal();
          // ⭐️ [신규] 버튼 활성화 되돌리기
          btn.classList.remove("active");
          // '근처' 버튼을 다시 기본값으로 활성화
          const nearBtn = document.querySelector('[data-filter="near"]');
          if (nearBtn) nearBtn.classList.add("active");
          return;
        }
        // ⭐️ [신규] 나의 예약 목록 표시 함수 호출
        await showMyReservations(USER_EMAIL);
      } else {
        isMyReservationMode = false; // 내 예약 모드 OFF
        applyFilter(btn.dataset.filter);
      }
    });
  });
}

/**
 * ⭐️ [수정] 나의 예약 목록 가져오기 & 렌더링 (날짜 필터 추가)
 * @param {string} userEmail - 로그인한 사용자 이메일
 */
async function showMyReservations(userEmail) {
  try {
    const res = await fetch(RESERVATION_API);
    const reservations = await res.json();

    // 1. 내 이메일로 예약 목록 필터링
    const myReservations = reservations.filter((r) => r.email === userEmail);

    if (myReservations.length === 0) {
      renderCrewCards([]); // 빈 배열을 전달하여 "예약 내역이 없습니다" 메시지 표시
      clearMarkers(); // ⭐️ [신규] 지도 마커도 비우기
      return;
    }

    // 2. ⭐️ 'allCrewDataRaw' (전체 크루 목록)와 예약 매칭
    const matchedCrew = myReservations
      .map((r) => {
        if (!r.crew_id) return null;
        // ⭐️ allCrewDataRaw (원본)에서 검색
        const crewInfo = allCrewDataRaw.find(
          (c) =>
            c.id &&
            c.id.trim().toLowerCase() === r.crew_id.trim().toLowerCase()
        );

        if (!crewInfo) return null;

        // 3. 카드 렌더링에 필요한 'distanceFromUser' 계산
        const distanceToUser = userPosition
          ? calcDistance(
              userPosition.lat,
              userPosition.lng,
              parseFloat(crewInfo.lat),
              parseFloat(crewInfo.lng)
            )
          : undefined;

        return {
          ...crewInfo, // 모든 크루 정보
          distanceFromUser: distanceToUser, // 계산된 거리 추가
        };
      })
      .filter((c) => c !== null); // 못찾은 크루(null) 제거

    // ⭐️ [신규] 3. 오늘 날짜 기준으로 '다가오는 예약'만 필터링
    const today = new Date();
    today.setHours(0, 0, 0, 0); // 오늘 날짜의 00:00:00

    const upcomingReservations = matchedCrew.filter((crew) => {
      if (!crew.schedule) return false; // 일정이 없는 크루 제외
      // 날짜 형식이 'YYYY.MM.DD'이므로 '-'로 변경하여 Date 객체 생성
      const scheduleDate = new Date(crew.schedule.split(" ")[0].replace(/\./g, "-"));
      return scheduleDate >= today; // 오늘이거나 미래의 예약만 포함
    });

    // ⭐️ [수정] 4. 'crewDataForPanel'에 '다가오는 예약' 목록 할당
    crewDataForPanel = upcomingReservations;

    if (crewDataForPanel.length === 0) {
      renderCrewCards([]); // ⭐️ "다가오는 예약이 없습니다" 메시지가 표시됨
      clearMarkers(); // ⭐️ [신규] 지도 마커도 비우기
    } else {
      // 5. ⭐️ '다가오는' 나의 예약 목록은 '가까운 날짜순'(날짜 오름차순)으로 정렬
      crewDataForPanel.sort(
        (a, b) =>
          new Date(a.schedule.replace(/\./g, "-")) -
          new Date(b.schedule.replace(/\./g, "-"))
      );
      renderCrewCards(crewDataForPanel); // ⭐️ 패널 렌더링
      clearMarkers(); // ⭐️ [신규] 기존 마커 지우기
      addCrewMarkers(crewDataForPanel); // ⭐️ [신규] '예약한 크루' 마커만 지도에 표시
    }
  } catch (err) {
    console.error("나의 예약 로드 실패:", err);
    crewListPanel.innerHTML =
      '<p class="no-reservation">예약 정보를 불러오는 중 오류가 발생했습니다.</p>';
  }
}

/**
 * 선택된 필터에 따라 정렬 적용 (나의 예약 제외)
 * @param {string} type - 필터 타입 (near, pace, distance, date)
 */
function applyFilter(type) {
  // ⭐️ [수정] 1. 패널에 표시할 데이터를 '전체' 목록으로 리셋
  crewDataForPanel = allCrewDataRaw.map((crew) => {
    const distance = calcDistance(
      userPosition.lat,
      userPosition.lng,
      parseFloat(crew.lat),
      parseFloat(crew.lng)
    );
    return { ...crew, distanceFromUser: distance };
  });

  // ⭐️ [수정] 2. 탭에 맞게 '패널' 데이터 정렬
  switch (type) {
    case "near":
      sortByNear();
      break;
    case "pace":
      sortByPace();
      break;
    case "distance":
      sortByDistance();
      break;
    case "date":
      sortByDate();
      break;
  }

  // ⭐️ [수정] 3. 패널/지도 업데이트
  renderCrewList(); // ⭐️ 'crewDataForPanel' (필터링된 전체 목록)를 패널에 렌더링
  clearMarkers(); // ⭐️ 기존 마커 지우기
  addCrewMarkers(crewDataForMap); // ⭐️ 지도에는 'crewDataForMap' (이름별 가장 빠른) 마커 다시 표시
}

/************************************
 * 13) 예약 페이지 이동
 ************************************/

/**
 * ⭐️ [수정] 크루 클릭 시 로그인 확인 및 alert 변경
 * @param {string} id - 크루 ID
 * @param {string} url - 크루 URL
 * @param {number} remain - 남은 자리
 * @param {string} crewName - 크루 이름
 * @param {string} date - 크루 일정
 */
function goReserve(id, url, remain, crewName, date) {
  // ⭐️ [신규] 1. 로그인 상태 확인
  if (!USER_EMAIL) {
    showLoginModal(); // 로그인 안했으면 모달 표시
    return;
  }

  // ⭐️ [수정] 2. alert() -> showCustomToast()로 변경
  if (remain <= 0) {
    showCustomToast("⚠️ 이 크루는 예약이 마감되었습니다.", true);
    return;
  }

  // 3. 페이지 URL 생성
  let pageUrl = "";
  const encodedId = encodeURIComponent(id);

  // ⭐️ [수정] 모든 크루가 상세 페이지(explanation.html)로 가도록 로직 변경
  pageUrl = `../explanation/explanation.html?id=${encodedId}`;

  // 4. 새 탭으로 열기
  window.open(pageUrl, "_blank");
}

/************************************
 * 14) 슬라이드 패널 제어
 ************************************/

/**
 * 슬라이드 패널 열기
 */
function openPanel() {
  slidePanel.classList.remove("closed");
  mapArea.classList.remove("panel-closed");
}

/**
 * 슬라이드 패널 닫기
 */
function closePanel() {
  slidePanel.classList.add("closed");
  mapArea.classList.add("panel-closed");
}

/**
 * 슬라이드 패널 이벤트 리스너 초기화
 */
function initSlidePanelEvents() {
  slideOpenBtn.onclick = openPanel;
  slideCloseBtn.onclick = closePanel;

  // 패널 내부 wheel 이벤트 전파 방지 (section 전환 방지)
  if (slidePanel) {
    slidePanel.addEventListener(
      "wheel",
      function (e) {
        e.stopPropagation();
      },
      { passive: false }
    );

    slidePanel.addEventListener(
      "scroll",
      function (e) {
        e.stopPropagation();
      },
      { passive: false }
    );
  }

  // 스크롤 시 버튼 가시성 제어
  window.addEventListener("scroll", () => {
    const mapRect = mapElement.getBoundingClientRect();
    if (mapRect.bottom > 0 && mapRect.top < window.innerHeight) {
      slideOpenBtn.style.display = "flex";
    } else {
      slideOpenBtn.style.display = "none";
    }
  });
}

/**
 * 페이지 로드 시 패널 초기 상태 설정 (열린 상태)
 */
function initPanelDefault() {
  openPanel();
}

/************************************
 * 15) 스크롤 애니메이션
 ************************************/

/**
 * 대상 Y 좌표까지 부드럽게 스크롤
 * @param {number} targetY - 목표 Y 좌표
 * @param {number} duration - 애니메이션 지속 시간 (ms)
 */
function smoothScrollTo(targetY, duration = 800) {
  const startY = window.scrollY;
  const diff = targetY - startY;
  const startTime = performance.now();

  const easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutSine(progress);

    window.scrollTo(0, startY + diff * eased);
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
}

/**
 * Section2로 부드럽게 스크롤하는 버튼 초기화
 */
function initHeroCtaButton() {
  const heroCtaBtn = document.querySelector(".foot-text");
  const section2 = document.querySelector(".section2");

  if (heroCtaBtn && section2) {
    heroCtaBtn.addEventListener("click", (e) => {
      e.preventDefault();
      smoothScrollTo(section2.offsetTop, 800);
    });
  }
}

/************************************
 * 16) 거리 계산 함수 (Haversine 공식)
 ************************************/

/**
 * 두 좌표 간의 거리 계산 (Haversine 공식)
 * @param {number} lat1 - 시작점 위도
 * @param {number} lng1 - 시작점 경도
 * @param {number} lat2 - 끝점 위도
 * @param {number} lng2 - 끝점 경도
 * @returns {number} 거리 (km)
 */
function calcDistance(lat1, lng1, lat2, lng2) {
  // ⭐️ 유효성 검사 추가
  if (
    isNaN(parseFloat(lat1)) ||
    isNaN(parseFloat(lng1)) ||
    isNaN(parseFloat(lat2)) ||
    isNaN(parseFloat(lng2))
  ) {
    return undefined; // 계산 불가
  }

  const R = 6371; // 지구 반지름 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/************************************
 * 17) 페이지 로드 시 전체 초기화
 ************************************/

document.addEventListener("DOMContentLoaded", async () => {
  // 1️⃣ ⭐️ [수정] 사용자 위치 기반 지도 초기화 (async/await)
  await initializeUserLocation(); // ⭐️ 내부에서 loadCrewData() 및 첫 렌더링까지 완료됨

  // 2️⃣ 슬라이드 패널 이벤트 초기화
  initSlidePanelEvents();
  initPanelDefault();

  // 3️⃣ 필터 버튼 초기화
  initFilterButtons(); // ⭐️ "나의 예약" 로직 포함

  // 4️⃣ Hero CTA 버튼 초기화
  initHeroCtaButton();

  // 5️⃣ 검색 기능 초기화 (다음 우편번호 API + 현재 위치)
  initSearchFeatures();

  // 6️⃣ "근처" 필터 버튼 이벤트 바인딩
  const nearbyFilterBtn = document.querySelector('[data-filter="near"]');
  if (nearbyFilterBtn) {
    nearbyFilterBtn.addEventListener("click", handleNearbyFilter);
  }

  // 7️⃣ 검색창 X 버튼 기능 초기화
  updateClearButtonVisibility();

  if (addressInput) {
    addressInput.addEventListener("input", updateClearButtonVisibility);
  }

  if (addressClearBtn) {
    addressClearBtn.addEventListener("click", () => {
      addressInput.value = "";
      updateClearButtonVisibility();
    });
  }
});

/************************************
 * 18) Section 4 - 이미지 애니메이션
 ************************************/

document.addEventListener("DOMContentLoaded", function () {
  const section4 = document.querySelector(".section4");
  const scrollImages = document.querySelectorAll(".scroll-image");

  if (!section4) return;

  const observerOptions = {
    threshold: 0.3,
    rootMargin: "0px 0px -100px 0px",
  };

  let hasAnimated = false;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;

        scrollImages.forEach((img, index) => {
          // 각 이미지마다 0.4초씩 딜레이 추가
          img.style.animationDelay = `${index * 0.4}s`;
          img.classList.add("slide-up");
        });
      }
    });
  }, observerOptions);

  observer.observe(section4);
});

/************************************
 * 19) Section 4 - 링크 연결
 ************************************/

document.addEventListener("DOMContentLoaded", function () {
  const section4 = document.querySelector(".section4");
  const wrappers = document.querySelectorAll(".image-wrapper");
  if (!section4 || !wrappers.length) return;

  // 각 wrapper별 링크 지정
  const linkMap = {
    campaignLinkImg: "../runtogetherseoul/runtogetherseoul.html",
    onCrewLinkImg: "../oncrew/oncrew.html",
    onGearLinkImg: "../ongear/ongear.html",
  };

  // Intersection Observer (등장 애니메이션)
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          wrappers.forEach((wrap, index) => {
            wrap.style.animationDelay = `${index * 0.4}s`;
            wrap.classList.add("slide-up");
          });
          observer.unobserve(section4);
        }
      });
    },
    { threshold: 0.3 }
  );

  observer.observe(section4);

  // 클릭 이벤트 추가
  wrappers.forEach((wrap) => {
    const link = linkMap[wrap.id];
    if (link) {
      wrap.addEventListener("click", () => {
        window.location.href = link; // ✅ 동일 탭 이동
      });
    }
  });
});

/************************************
 * 20) section3 chat message 애니메이션
 ************************************/

(() => {
  const section = document.querySelector(".section3");
  if (!section) return;

  const items = [...section.querySelectorAll(".chat-message")];
  const shown = new WeakSet(); // 이미 등장시킨 요소 기록
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const el = entry.target;
        if (!entry.isIntersecting || shown.has(el)) return;

        // 최종 유지 클래스 부여
        el.classList.add("is-shown");
        // 애니메이션은 한 번만
        el.classList.add("just-shown");

        // 애니메이션 끝나면 just-shown만 제거(유지용 is-shown은 남김)
        el.addEventListener(
          "animationend",
          () => {
            el.classList.remove("just-shown");
          },
          { once: true }
        );

        shown.add(el);
        io.unobserve(el); // 관찰 해제 → 다시는 안 숨김
      });
    },
    { threshold: 1 }
  ); // 100% 보이면

  items.forEach((el) => io.observe(el));
})();