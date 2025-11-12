/************************************
 * 1) 전역 변수 및 상수 선언
 ************************************/
const SHEET_BASE = "https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e";
const RESERVATION_API = "https://api.sheetbest.com/sheets/4e2d77b5-9ae8-4a14-bfee-5b7dffe35b95";

let map = null;
let scrolled = false;
let mapInitialized = false;
let crewData = [];
let userPosition = null;
let userMarker = null;
let markerList = [];

const USER_EMAIL = localStorage.getItem("userEmail"); // 로그인 시 이메일 저장


// DOM 요소 캐싱
const mapArea = document.querySelector('.map_area');
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
 * 2) 초기화 함수
 ************************************/

/**
 * 사용자 위치 정보 가져오기 및 지도 초기화
 */
function initializeUserLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        userPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        initMapWithUser();
      },
      (error) => {
        console.log("위치 정보를 가져올 수 없음, 기본값 사용:", error);
        userPosition = { lat: 37.5665, lng: 126.9780 }; // 서울 기본값
        initMapWithUser();
      }
    );
  } else {
    console.log("위치 정보를 지원하지 않음");
    userPosition = { lat: 37.5665, lng: 126.9780 };
    initMapWithUser();
  }
}

/**
 * 지도 초기화 + 사용자 마커 추가
 */
function initMapWithUser() {
  initMap();
  addUserMarker();
}

/**
 * 카카오 지도 초기화 (유일한 initMap 함수)
 */
function initMap() {
  const mapContainer = document.getElementById("map");

  map = new kakao.maps.Map(mapContainer, {
    center: new kakao.maps.LatLng(userPosition.lat, userPosition.lng),
    level: 5,
    draggable: false,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    draggableCursor: 'grab',
    draggingCursor: 'grabbing'
  });

  // 지도 기능 초기화
  loadCrewData();
  addUserMarker();
  initLongPressDrag(map);
  createZoomButtons();

  // 지도 클릭 시 슬라이드 패널 닫기
  kakao.maps.event.addListener(map, 'click', function () {
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

  const markerPosition = new kakao.maps.LatLng(userPosition.lat, userPosition.lng);
  userMarker = new kakao.maps.Marker({
    position: markerPosition,
    image: new kakao.maps.MarkerImage(
      "https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png",
      new kakao.maps.Size(24, 35)
    )
  });
  userMarker.setMap(map);
}

/**
 * 지도에서 모든 크루 마커 초기화 (중복 방지)
 */
function clearMarkers() {
  markerList.forEach(m => m.setMap(null));
  markerList = [];
}

/**
 * 크루 데이터를 지도에 마커로 표시
 * @param {Array} list - 크루 데이터 배열
 */
function addCrewMarkers(list) {
  list.forEach(crew => {
    const remain = Number(crew.remain);

    const markerHTML = `
      <div class="crew-marker" onclick="goReserve('${crew.id}', '${crew.url}', ${remain}, '${crew.name}', '${crew.schedule}')">
        <span>${remain}</span>
      </div>
    `;

    const overlay = new kakao.maps.CustomOverlay({
      position: new kakao.maps.LatLng(parseFloat(crew.lat), parseFloat(crew.lng)),
      content: markerHTML,
      yAnchor: 1
    });

    overlay.setMap(map);
    markerList.push(overlay);
  });
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
  kakao.maps.event.addListener(map, 'mousedown', function () {
    pressTimer = setTimeout(() => {
      map.setDraggable(true);
      mapContainer.classList.add('grabbing');
    }, 200); // 200ms 이상 누르면 드래그 허용
  });

  // 마우스 뗌
  kakao.maps.event.addListener(map, 'mouseup', function () {
    clearTimeout(pressTimer);
    map.setDraggable(false);
    mapContainer.classList.remove('grabbing');
  });

  // 마우스가 지도 밖으로 나감
  kakao.maps.event.addListener(map, 'mouseout', function () {
    clearTimeout(pressTimer);
    map.setDraggable(false);
    mapContainer.classList.remove('grabbing');
  });
}


/************************************
 * 5) 크루 카드 HTML 구조 (공용 템플릿)
 * 모든 크루 카드가 사용하는 동일한 HTML 구조
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
  return `
    <div class="inner-img">
      <img src="${crew.image ? crew.image.split(',')[0] : 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${crew.name}">
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

/* 내 위치로부터의 거리
<div class="crew-trackInfo">
          <span class="crew-distance">📍${userDistance} </span>
          <span></span>
          <span class="crew-time">🏃 ${courseDistance}</span>
        </div>
*/


/************************************
 * 6) 크루 카드 렌더링 함수 (공용)
 * searchAddressWithDaum, handleNearbyFilter, renderCrewList에서 재사용
 ************************************/

/**
 * 크루 카드 목록을 화면에 렌더링
 * - 중복 제거: 이 함수 하나로 모든 렌더링 처리
 * - getCrewCardHTML 함수로 HTML 구조 재사용
 * - 모든 상황에서 사용자 거리 + 코스거리 표시
 * @param {Array} crewList - 렌더링할 크루 배열
 */
function renderCrewCards(crewList) {
  crewListPanel.innerHTML = "";
  crewList.forEach(crew => {
    const div = document.createElement("div");
    div.className = "crew-card";

    // 사용자 거리 표시
    const userDistance = crew.distanceFromUser !== undefined
      ? `${crew.distanceFromUser.toFixed(1)}km`
      : "-";
    const courseDistance = `${crew.distance}km`;

    div.innerHTML = getCrewCardHTML(crew, userDistance, courseDistance);

    // 예약 클릭 시 goReserve 사용
    div.onclick = () => goReserve(
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
 * - 검색한 주소 기준으로 모든 런닝 크루까지의 거리 계산
 * - 모든 크루를 거리순으로 정렬해서 표시
 * - 공용 renderCrewCards() 함수 사용
 */
function searchAddressWithDaum() {
  // crewData가 로드될 때까지 대기
  if (crewData.length === 0) {
    console.log('크루 데이터 로딩 중... 0.5초 후 다시 시도');
    setTimeout(() => searchAddressWithDaum(), 500);
    return;
  }

  if (typeof daum === 'undefined') {
    alert('다음 우편번호 서비스를 로드할 수 없습니다.');
    return;
  }

  new daum.Postcode({
    oncomplete: function (data) {
      let fullAddr = data.address;

      if (data.roadAddress) {
        fullAddr = data.roadAddress;
      }

      addressInput.value = fullAddr;

      // **추가** 검색창 옆 X 버튼 기능 초기화
      addressInput.dispatchEvent(new Event('input', { bubbles: true }));

      if (typeof kakao === 'undefined') {
        alert('카카오 맵 API를 로드할 수 없습니다.');
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
            lng: result[0].x
          };

          addUserMarker();

          // 검색한 주소 기준 모든 크루까지의 거리 계산
          const allCrewsWithDistance = crewData.map(crew => {
            const distanceToUser = calcDistance(
              userPosition.lat,
              userPosition.lng,
              parseFloat(crew.lat),
              parseFloat(crew.lng)
            );
            return {
              ...crew,
              distanceFromUser: distanceToUser  // 사용자 위치에서 크루까지의 거리
            };
          });

          // 모든 크루를 거리순으로 정렬 (필터링 없음)
          const nearbyCrew = allCrewsWithDistance.sort((a, b) => a.distanceFromUser - b.distanceFromUser);

          clearMarkers();
          addCrewMarkers(nearbyCrew);

          // ✅ 공용 renderCrewCards() 함수 사용
          renderCrewCards(nearbyCrew);

          console.log('주소 검색 완료:', fullAddr, '크루 목록:', nearbyCrew.length);
        } else {
          alert('주소 검색에 실패했습니다. 다시 시도해주세요.');
        }
      });
    },
    width: '100%',
    height: '100%'
  }).open();
}

/**
 * 현재 위치로 지도 이동
 * - GPS를 통해 현재 위치 획득
 * - 역지오코딩으로 주소 변환 후 입력창에 표시
 */
function moveToCurrentLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        userPosition = {
          lat: lat,
          lng: lng
        };

        const coords = new kakao.maps.LatLng(lat, lng);
        map.setCenter(coords);
        addUserMarker();

        // 좌표 → 주소 변환 (역지오코딩)
        if (typeof kakao !== 'undefined') {
          const geocoder = new kakao.maps.services.Geocoder();
          geocoder.coord2Address(lng, lat, function (result, status) {
            if (status === kakao.maps.services.Status.OK && result.length > 0) {
              addressInput.value = result[0].address.address_name;

              // **추가** 검색창 옆 X 버튼 기능 초기화
              addressInput.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
              addressInput.value = `현재 위치 (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            }
          });
        }

        console.log('현재 위치로 이동:', lat, lng);
      },
      function (error) {
        console.error('위치 정보 오류:', error);
        alert('현재 위치를 불러올 수 없습니다.');
      }
    );
  } else {
    alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
  }
}

/**
 * 검색 기능 초기화
 * - 주소 입력창 클릭 → 다음 우편번호 API 열기
 * - 현재 위치 아이콘 클릭 → GPS 현재 위치로 이동
 */
function initSearchFeatures() {
  if (addressInput) {
    addressInput.addEventListener('click', function (e) {
      e.stopPropagation();
      searchAddressWithDaum();
    });
  }

  if (myLocationBtn) {
    myLocationBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      moveToCurrentLocation();
    });
  }

}


// **추가** 검색창 옆 X 버튼 기능 초기화
// X 버튼 안 보임 상태
function updateClearButtonVisibility() {
  if (!addressInput || !addressClearBtn) return;
  addressClearBtn.style.display = addressInput.value.trim() !== "" ? "block" : "none";
}



/************************************
 * 8) 근처 필터 함수
 ************************************/

/**
 * 근처 필터 버튼 클릭 이벤트
 * - "근처" 필터 클릭 시 GPS 현재 위치 기준으로 리셋
 * - 현재 위치로 지도 이동
 * - 15km 반경 내 크루만 필터링
 * - 공용 renderCrewCards() 함수 사용
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
          lng: lng
        };

        // 지도 중심 이동
        const coords = new kakao.maps.LatLng(lat, lng);
        map.setCenter(coords);
        addUserMarker();

        // 근처 크루 필터링 - 모든 크루의 거리 계산
        const allCrewsWithDistance = crewData.map(crew => {
          const distance = calcDistance(
            userPosition.lat,
            userPosition.lng,
            parseFloat(crew.lat),
            parseFloat(crew.lng)
          );
          return { ...crew, distanceFromUser: distance };
        });

        // 15km 반경 내 크루만 필터링
        const nearbyCrew = allCrewsWithDistance.filter(crew => crew.distanceFromUser <= 15);

        // 거리순 정렬
        nearbyCrew.sort((a, b) => a.distanceFromUser - b.distanceFromUser);

        clearMarkers();
        addCrewMarkers(nearbyCrew);

        // ✅ 공용 renderCrewCards() 함수 사용
        renderCrewCards(nearbyCrew);

        console.log(`GPS 위치로 리셋, 근처 크루 ${nearbyCrew.length}개 찾음`);
      },
      function (error) {
        console.error('위치 정보 오류:', error);
        alert('현재 위치를 불러올 수 없습니다.');
      }
    );
  } else {
    alert('이 브라우저에서는 위치 정보를 지원하지 않습니다.');
  }
}


/************************************
 * 9) 크루 데이터 로드 및 처리
 ************************************/

/**
 * Google Sheet에서 크루 데이터 가져오고 처리
 * - 거리 계산 (사용자 위치 기준)
 * - 같은 이름의 크루는 가장 빠른 일정만 유지
 * - 지도 마커 및 리스트 업데이트
 */
async function loadCrewData() {
  try {
    const res = await fetch(`${SHEET_BASE}/tabs/CREWLIST`);
    const data = await res.json();

    // 1️⃣ 거리 계산
    let processedList = data.map(crew => {
      const distance = calcDistance(
        userPosition.lat,
        userPosition.lng,
        parseFloat(crew.lat),
        parseFloat(crew.lng)
      );
      return { ...crew, distanceFromUser: distance };
    });

    // 2️⃣ 같은 이름 중 가장 빠른 일정만 유지
    const earliestByName = {};
    processedList.forEach(c => {
      const key = c.name.trim();
      const d = new Date(c.schedule);
      if (!earliestByName[key] || d < new Date(earliestByName[key].schedule)) {
        earliestByName[key] = c;
      }
    });

    // 3️⃣ crewData 확정
    crewData = Object.values(earliestByName);

    // 4️⃣ 지도 마커 & 리스트 업데이트
    clearMarkers();
    addCrewMarkers(crewData);
    sortByNear();
    renderCrewList();

  } catch (err) {
    console.error("크루 데이터를 불러오는 중 오류:", err);
  }
}


/************************************
 * 10) 정렬 함수
 ************************************/

/**
 * 사용자 위치 기준 가까운 순으로 정렬
 */
function sortByNear() {
  crewData.sort((a, b) => a.distanceFromUser - b.distanceFromUser);
}

/**
 * 페이스(Pace) 기준 정렬 (빠른 속도 순)
 * 예: "6'50" → 410초
 */
function sortByPace() {
  crewData.sort((a, b) => paceToSeconds(a.pace) - paceToSeconds(b.pace));
}

/**
 * 거리 기준 정렬 (짧은 거리 순)
 */
function sortByDistance() {
  crewData.sort((a, b) => a.distance - b.distance);
}

/**
 * 날짜 기준 정렬 (가장 빠른 일정 순)
 */
function sortByDate() {
  crewData.sort((a, b) => new Date(a.schedule) - new Date(b.schedule));
}

/**
 * 페이스 문자열을 초 단위로 변환
 * @param {string} paceStr - 페이스 문자열 (예: "6'50")
 * @returns {number} 초 단위 페이스
 */
function paceToSeconds(paceStr) {
  const parts = paceStr.split("'");
  const minutes = parseInt(parts[0]);
  const seconds = parseInt(parts[1] || "0");
  return minutes * 60 + seconds;
}


/************************************
 * 11) 크루 리스트 렌더링
 ************************************/

/**
 * 사이드 패널에 크루 카드 리스트 렌더링
 * - 이름별로 가장 빠른 일정만 표시
 * - 공용 renderCrewCards() 함수 사용 (중복 제거)
 */
function renderCrewList() {
  if (isMyReservationMode) return; // 내 예약 모드면 전체 리스트 렌더링 금지

  const earliestCrewByName = {};
  crewData.forEach(crew => {
    const date = new Date(crew.schedule);
    if (!earliestCrewByName[crew.name] || date < new Date(earliestCrewByName[crew.name].schedule)) {
      earliestCrewByName[crew.name] = crew;
    }
  });

  const filteredCrewList = Object.values(earliestCrewByName);
  renderCrewCards(filteredCrewList);
}



/************************************
 * 12) 필터 버튼 및 정렬 적용
 ************************************/

/**
 * 필터 버튼의 정렬 기능 연결
 */
function initFilterButtons() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyFilter(btn.dataset.filter);
    });
  });
}



/* 나의 예약 기능 추가 */
let isMyReservationMode = false;

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (btn.dataset.filter === "myReservation") {
      isMyReservationMode = true; // 내 예약 모드 ON
      if (!USER_EMAIL) {
        crewListPanel.innerHTML = "<p>로그인이 필요합니다.</p>";
        return;
      }
      await showMyReservations(USER_EMAIL);
    } else {
      isMyReservationMode = false; // 내 예약 모드 OFF
      applyFilter(btn.dataset.filter);
    }
  });
});


/* 내 예약 가져오기 & 매칭 함수 추가 */
async function showMyReservations(userEmail) {
  try {
    const res = await fetch(RESERVATION_API);
    const reservations = await res.json();

    // 내 예약 필터링
    const myReservations = reservations.filter(r => r.email === userEmail);

    if (myReservations.length === 0) {
      crewListPanel.innerHTML = "<p>예약 내역이 없습니다.</p>";
      return;
    }

    // 예약과 크루 데이터 매칭
    const matchedCrew = myReservations.map(r => {
      const crewInfo = crewData.find(c => c.id.trim().toLowerCase() === r.crew_id.trim().toLowerCase());
      return crewInfo ? {
        ...r,
        name: crewInfo.name,
        distance: crewInfo.distance,
        time: crewInfo.time,
        explanation: crewInfo.explanation,
        image: crewInfo.image
      } : null;
    }).filter(c => c !== null);

    if (matchedCrew.length === 0) {
      crewListPanel.innerHTML = "<p>예약 내역이 없습니다.</p>";
    } else {
      renderCrewCards(matchedCrew);
    }

  } catch (err) {
    crewListPanel.innerHTML = "<p>예약 정보를 불러오지 못했습니다.</p>";
    console.error(err);
  }
}




/**
 * 선택된 필터에 따라 정렬 적용
 * @param {string} type - 필터 타입 (near, pace, distance, date)
 */
function applyFilter(type) {
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
  renderCrewList();
}


/************************************
 * 13) 예약 페이지 이동
 ************************************/

/**
 * 크루 클릭 시 예약 페이지로 이동
 * @param {string} id - 크루 ID
 * @param {string} url - 크루 URL
 * @param {number} remain - 남은 자리
 * @param {string} crewName - 크루 이름
 * @param {string} date - 크루 일정
 */
function goReserve(id, url, remain, crewName, date) {
  if (remain <= 0) {
    alert("⚠️ 이 크루는 예약이 마감되었습니다.");
    return;
  }

  const name = crewName.replace(/\s+/g, "").toLowerCase();
  let pageUrl = "";
  const encodedName = encodeURIComponent(crewName);
  const dateOnly = date.split(" ")[0];

  // 크루별 상세 페이지 매핑
  if (name.includes("여의도한강")) {
    pageUrl = `../explanation/explanation.html?date=${dateOnly}&name=${encodedName}`;
  } else if (name.includes("잠원한강")) {
    pageUrl = `../explanation/explanation.html?date=${dateOnly}&name=${encodedName}`;
  } else if (name.includes("성수서울숲")) {
    pageUrl = `../explanation/explanation.html?date=${dateOnly}&name=${encodedName}`;
  } else if (name.includes("석촌호수")) {
    pageUrl = `../explanation/explanation.html?date=${dateOnly}&name=${encodedName}`;
  } else if (name.includes("노들섬")) {
    pageUrl = `../explanation/explanation.html?date=${dateOnly}&name=${encodedName}`;
  } else {
    pageUrl = `reserve.html?id=${id}&date=${dateOnly}`;
  }

  window.open(pageUrl, "_blank");
}


/************************************
 * 14) 슬라이드 패널 제어
 ************************************/

/**
 * 슬라이드 패널 열기
 */
function openPanel() {
  slidePanel.classList.remove('closed');
  mapArea.classList.remove('panel-closed');
}

/**
 * 슬라이드 패널 닫기
 */
function closePanel() {
  slidePanel.classList.add('closed');
  mapArea.classList.add('panel-closed');
}

/**
 * 슬라이드 패널 이벤트 리스너 초기화
 */
function initSlidePanelEvents() {
  slideOpenBtn.onclick = openPanel;
  slideCloseBtn.onclick = closePanel;

  // 패널 내부 wheel 이벤트 전파 방지 (section 전환 방지)
  if (slidePanel) {
    slidePanel.addEventListener('wheel', function (e) {
      e.stopPropagation();
    }, { passive: false });

    slidePanel.addEventListener('scroll', function (e) {
      e.stopPropagation();
    }, { passive: false });
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
  const heroCtaBtn = document.querySelector('.foot-text');
  const section2 = document.querySelector('.section2');

  if (heroCtaBtn && section2) {
    heroCtaBtn.addEventListener('click', (e) => {
      e.preventDefault();
      smoothScrollTo(section2.offsetTop, 800);
    });
  }
}


/************************************
 * 16) 거리 계산 함수 (Haversine 공식)
 * 모든 거리 계산을 이 함수 하나로 통일 (중복 제거)
 ************************************/

/**
 * 두 좌표 간의 거리 계산 (Haversine 공식)
 * - loadCrewData에서 사용
 * - searchAddressWithDaum에서 사용
 * - handleNearbyFilter에서 사용
 * - 전체 앱에서 일관된 거리 계산
 * @param {number} lat1 - 시작점 위도
 * @param {number} lng1 - 시작점 경도
 * @param {number} lat2 - 끝점 위도
 * @param {number} lng2 - 끝점 경도
 * @returns {number} 거리 (km)
 */
function calcDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


/************************************
 * 17) 페이지 로드 시 전체 초기화
 ************************************/

document.addEventListener("DOMContentLoaded", () => {
  // 1️⃣ 사용자 위치 기반 지도 초기화
  initializeUserLocation();

  // 2️⃣ 슬라이드 패널 이벤트 초기화
  initSlidePanelEvents();
  initPanelDefault();

  // 3️⃣ 필터 버튼 초기화
  initFilterButtons();

  // 4️⃣ Hero CTA 버튼 초기화
  initHeroCtaButton();

  // 5️⃣ 검색 기능 초기화 (다음 우편번호 API + 현재 위치)
  initSearchFeatures();

  // 6️⃣ "근처" 필터 버튼 이벤트 바인딩
  const nearbyFilterBtn = document.querySelector('[data-filter="near"]');
  if (nearbyFilterBtn) {
    nearbyFilterBtn.addEventListener('click', handleNearbyFilter);
  }


  // **추가** 검색창 옆 X 버튼 기능 초기화
  // 1) 초기 상태 반영 (placeholder만 있으면 숨김)
  updateClearButtonVisibility();

  // 2) 값이 바뀔 때마다 토글 (readonly여도 '가짜 input 이벤트'를 우리가 날리면 이 리스너가 동작함)
  if (addressInput) {
    addressInput.addEventListener("input", updateClearButtonVisibility);
  }

  // 3) X 클릭 시 input 초기화
  if (addressClearBtn) {
    addressClearBtn.addEventListener("click", () => {
      addressInput.value = "";
      updateClearButtonVisibility(); // focus 불필요 (readonly)
    });
  }




});


/************************************
 * 18) Section 4 - 이미지 애니메이션
 * Intersection Observer를 사용해 화면에 나타날 때만 실행
 ************************************/

/**
 * Section 4 이미지가 하나씩 올라오는 애니메이션
 * - 느린 버전 (0.4초 간격)
 * - 화면에 나타날 때만 실행
 */

document.addEventListener('DOMContentLoaded', function () {
  const section4 = document.querySelector('.section4');
  const scrollImages = document.querySelectorAll('.scroll-image');

  if (!section4) return;

  const observerOptions = {
    threshold: 0.3,
    rootMargin: '0px 0px -100px 0px'
  };

  let hasAnimated = false;

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;

        scrollImages.forEach((img, index) => {
          // 각 이미지마다 0.4초씩 딜레이 추가
          img.style.animationDelay = `${index * 0.4}s`;
          img.classList.add('slide-up');
        });
      }
    });
  }, observerOptions);

  observer.observe(section4);
});


/************************************
 * 18) Section 4 - 링크 연결
 ************************************/

document.addEventListener('DOMContentLoaded', function () {
  const section4 = document.querySelector('.section4');
  const wrappers = document.querySelectorAll('.image-wrapper');
  if (!section4 || !wrappers.length) return;

  // 각 wrapper별 링크 지정
  const linkMap = {
    campaignLinkImg: '../runtogetherseoul/runtogetherseoul.html',
    onCrewLinkImg: '../oncrew/oncrew.html',
    onGearLinkImg: '../ongear/ongear.html'
  };

  // Intersection Observer (등장 애니메이션)
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        wrappers.forEach((wrap, index) => {
          wrap.style.animationDelay = `${index * 0.4}s`;
          wrap.classList.add('slide-up');
        });
        observer.unobserve(section4);
      }
    });
  }, { threshold: 0.3 });

  observer.observe(section4);

  // 클릭 이벤트 추가
  wrappers.forEach(wrap => {
    const link = linkMap[wrap.id];
    if (link) {
      wrap.addEventListener('click', () => {
        window.location.href = link; // ✅ 동일 탭 이동
        // window.open(link, '_blank'); // 새 탭으로 열고 싶으면 이걸로
      });
    }
  });
});



/************************************
 * 20) section3 chat message 애니메이션 
 ************************************/

(() => {
  const section = document.querySelector('.section3');
  if (!section) return;

  const items = [...section.querySelectorAll('.chat-message')];
  const shown = new WeakSet();           // 이미 등장시킨 요소 기록
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const el = entry.target;
      if (!entry.isIntersecting || shown.has(el)) return;

      // 최종 유지 클래스 부여
      el.classList.add('is-shown');
      // 애니메이션은 한 번만
      el.classList.add('just-shown');

      // 애니메이션 끝나면 just-shown만 제거(유지용 is-shown은 남김)
      el.addEventListener('animationend', () => {
        el.classList.remove('just-shown');
      }, { once: true });

      shown.add(el);
      io.unobserve(el); // 관찰 해제 → 다시는 안 숨김
    });
  }, { threshold: 1 }); // 100% 보이면

  items.forEach(el => io.observe(el));
})();