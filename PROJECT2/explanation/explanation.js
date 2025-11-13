// ================================
// API 및 기본 설정
// ================================
const SHEETAPI = 'https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e/tabs/CREWLIST';

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

let currentCrewData = null; // ⭐️ 현재 보고있는 크루 데이터 저장
// --- ⭐️ [신규] 끝 ---


// ================================
// 진행도 바 변수
// ================================
let scheduleDates, progressTrack;

// ================================
// 이미지 슬라이더 변수
// ================================
let slider, prevBtn, nextBtn, currentIndex = 0, totalSlides = 1;
let autoSlide;

// ================================
// 이미지 URL 파싱 함수 (전역)
// ================================
function parseImageUrls(imageString) {
  if (!imageString || !imageString.trim()) {
    return ['../pic/default.jpg'];
  }
  
  return imageString
    .split(',')
    .map(url => {
      url = url.trim();
      
      if (!url || url === 'null' || url === 'undefined') return null;
      
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      
      return null;
    })
    .filter(url => url !== null);
}

// ================================
// 이미지 슬라이더 - 슬라이드 이동 함수 (자연스러운 무한 루프)
// ================================
function showSlide(index) {
  if (totalSlides <= 0) return;

  // 슬라이드 전환 시 부드럽게 이동
  slider.style.transition = 'transform 0.5s ease';
  slider.style.transform = `translateX(${-index * 100}%)`;
  currentIndex = index;

  // 루프 처리를 위한 트릭
  if (index === totalSlides + 1) {
    // 마지막 가짜(첫 번째 복제 슬라이드)로 이동 시
    setTimeout(() => {
      slider.style.transition = 'none'; // 애니메이션 제거
      slider.style.transform = `translateX(-100%)`; // 진짜 첫 슬라이드 위치로
      currentIndex = 1;
    }, 500);
  }

  if (index === 0) {
    // 첫 번째 가짜(마지막 복제 슬라이드)로 이동 시
    setTimeout(() => {
      slider.style.transition = 'none';
      slider.style.transform = `translateX(-${totalSlides * 100}%)`;
      currentIndex = totalSlides;
    }, 500);
  }
}

// ================================
// 이미지 슬라이더 - 자동 슬라이드 시작
// ================================
function startAutoSlide() {
  // ✅ 자동 슬라이드 비활성화 (수동 조작만 가능)
  // autoSlide = setInterval(() => {
  //   showSlide(currentIndex + 1);
  // }, 6000);
}

// ================================
// 이미지 슬라이더 - 자동 슬라이드 리셋
// ================================
function resetAutoSlide() {
  clearInterval(autoSlide);
  startAutoSlide();
}

// ================================
// 이미지 슬라이더 초기화 함수 (무한 루프용 수정)
// ================================
function initializeImageSlider(imageUrls) {
  slider = document.querySelector('.image-slider');
  prevBtn = document.querySelector('.arrow-prev');
  nextBtn = document.querySelector('.arrow-next');

  const validUrls = imageUrls.filter(url => url && url.trim() !== '');
  if (validUrls.length === 0) validUrls.push('../pic/default.jpg');

  // 슬라이더 초기화
  slider.innerHTML = '';

  // ✅ 맨 앞에 마지막 이미지 복제 추가
  const cloneLast = document.createElement('img');
  cloneLast.src = validUrls[validUrls.length - 1];
  slider.appendChild(cloneLast);

  // 원본 이미지 추가
  validUrls.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    slider.appendChild(img);
  });

  // ✅ 맨 뒤에 첫 이미지 복제 추가
  const cloneFirst = document.createElement('img');
  cloneFirst.src = validUrls[0];
  slider.appendChild(cloneFirst);

  totalSlides = validUrls.length;
  currentIndex = 1; // 첫 번째 진짜 슬라이드부터 시작

  // 슬라이더 크기 설정
  slider.style.width = `${(totalSlides + 2) * 100}%`;
  document.querySelectorAll('.image-slider img').forEach(img => {
    img.style.width = `${100 / (totalSlides + 2)}%`;
    img.style.objectFit = 'cover';
  });

  // 시작 위치 세팅
  slider.style.transition = 'none';
  slider.style.transform = `translateX(-100%)`;

  // 버튼 리스너 재등록
  const newPrevBtn = prevBtn.cloneNode(true);
  const newNextBtn = nextBtn.cloneNode(true);
  prevBtn.replaceWith(newPrevBtn);
  nextBtn.replaceWith(newNextBtn);
  prevBtn = newPrevBtn;
  nextBtn = newNextBtn;

  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showSlide(currentIndex - 1);
    resetAutoSlide();
  });

  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showSlide(currentIndex + 1);
    resetAutoSlide();
  });

  console.log(`무한 루프 슬라이더 초기화 완료: ${totalSlides}개 이미지`);
  startAutoSlide();
}

// ================================
// URL 쿼리 파라미터 가져오기
// ================================
function getQueryParam(param) {
  return new URLSearchParams(window.location.search).get(param);
}

// ================================
// 시간대 분류 (한글)
// ================================
function getTimePeriod(timeStr) {
  const hour = parseInt(timeStr.split(':')[0]);
  if (hour >= 5 && hour < 12) return '새벽';
  if (hour >= 12 && hour < 18) return '오후';
  return '저녁';
}

// ================================
// 시간대 분류 (영문)
// ================================
function getTimePeriodEN(periodKR) {
  const map = {
    '새벽': 'morning',
    '오후': 'afternoon',
    '저녁': 'night'
  };
  return map[periodKR];
}

// ================================
// 거리 분류
// ================================
function getDistanceName(distance) {
  if (distance < 3) return '짧은';
  if (distance < 5) return '중간';
  return '긴';
}

// ================================
// 요일 가져오기 (한글)
// ================================
function getWeekday(dateStr) {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[new Date(dateStr).getDay()];
}

// ================================
// 요일 가져오기 (영문)
// ================================
function getWeekdayEN(dateStr) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[new Date(dateStr).getDay()];
}

// ================================
// 시간 형식 변환 (오전/오후)
// ================================
function formatTimeAMPM(timeStr) {
  const [hourStr, minStr] = timeStr.split(':');
  let hour = parseInt(hourStr);
  const min = minStr || '00';
  
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  
  return `${hour}:${min} ${ampm}`;
}

// ================================
// 진행도 바 업데이트 함수
// ================================
function updateScheduleProgressBar() {
  if (!scheduleDates || !progressTrack) return;
  
  const scrollLeft = scheduleDates.scrollLeft;
  const scrollWidth = scheduleDates.scrollWidth;
  const clientWidth = scheduleDates.clientWidth;
  
  const isScrollable = scrollWidth > clientWidth;
  
  if (!isScrollable) {
    progressTrack.classList.remove('has-scrollable');
    progressTrack.style.width = '0%';
    return;
  }
  
  progressTrack.classList.add('has-scrollable');
  
  const scrollableWidth = scrollWidth - clientWidth;
  const scrollPercentage = scrollableWidth > 0 ? scrollLeft / scrollableWidth : 0;
  const viewportPercentage = clientWidth / scrollWidth;
  const progressWidth = (viewportPercentage + (1 - viewportPercentage) * scrollPercentage) * 100;
  
  progressTrack.style.width = Math.min(progressWidth, 100) + '%';
}

// ================================
// 카카오맵 URL 생성 함수
// ================================
function openKakaoMap(locationName, lat, lng) {
  let kakaoMapUrl;
  
  if (lat && lng) {
    kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(locationName)}&p=${lat},${lng}`;
  } else {
    kakaoMapUrl = `https://map.kakao.com/?q=${encodeURIComponent(locationName)}`;
  }
  
  window.open(kakaoMapUrl, '_blank', 'width=800,height=600');
}

// ================================
// 크루 정보 업데이트 함수
// ================================
function updateCrewInfo(selectedCrew) {
  if (!selectedCrew) return;

  // ⭐️ [신규] 현재 크루 정보 전역 변수에 저장
  currentCrewData = selectedCrew;
  
  document.getElementById('crew-name').textContent = selectedCrew.name;
  document.getElementById('crew-schedule').textContent = selectedCrew.schedule;
  document.getElementById('crew-distance').textContent = selectedCrew.distance + ' km';
  document.getElementById('crew-location').textContent = selectedCrew.location;
  document.getElementById('crew-duration').textContent = selectedCrew.time + '분';
  document.getElementById('crew-people').textContent = selectedCrew.remain + '명';
  document.querySelector('.level-badge').textContent = selectedCrew.level;
  
  document.getElementById('crew-explanation').innerHTML = selectedCrew.explanation || '설명 없음';
  
  // ✅ 출발지 업데이트 (클릭 기능 포함)
  const departureBox = document.getElementById('departure');
  const departureName = selectedCrew.departure ? selectedCrew.departure.split('\n')[0] : '정보 없음';
  const departureText = selectedCrew.departure 
    ? selectedCrew.departure.replace(/\n/g, '<br>') 
    : '정보 없음';
  
  departureBox.innerHTML = departureText;
  
  const newDepartureBox = departureBox.cloneNode(true);
  departureBox.replaceWith(newDepartureBox);
  
  newDepartureBox.addEventListener('click', () => {
    if (selectedCrew.departure) {
      openKakaoMap(departureName, selectedCrew.lat, selectedCrew.lng);
    }
  });
  
  // ✅ 도착지 업데이트 (클릭 기능 포함)
  const destinationBox = document.getElementById('destination');
  const destinationName = selectedCrew.destination ? selectedCrew.destination.split('\n')[0] : '정보 없음';
  const destinationText = selectedCrew.destination 
    ? selectedCrew.destination.replace(/\n/g, '<br>') 
    : '정보 없음';
  
  destinationBox.innerHTML = destinationText;
  
  const newDestinationBox = destinationBox.cloneNode(true);
  destinationBox.replaceWith(newDestinationBox);
  
  newDestinationBox.addEventListener('click', () => {
    if (selectedCrew.destination) {
      openKakaoMap(destinationName, selectedCrew.lat, selectedCrew.lng);
    }
  });

  // --- ⭐️ [신규] 북마크 상태 버튼에 반영 ---
  const bookmarkedIds = JSON.parse(localStorage.getItem(LOCAL_STORAGE_ID_KEY) || "[]");
  const isBookmarked = bookmarkedIds.includes(selectedCrew.id.trim());
  const bookmarkBtn = document.getElementById('bookmark-btn');
  if (bookmarkBtn) {
      // ⭐️ aria-pressed 속성으로 버튼 상태 관리 (CSS에서 .bookmark-btn[aria-pressed="true"] { ... } 스타일 지정 가능)
      bookmarkBtn.setAttribute('aria-pressed', String(isBookmarked));
  }
  // --- ⭐️ [신규] 끝 ---

  
  // ✅ 이미지 슬라이더 업데이트
  let imageUrls = [];
  
  if (selectedCrew['image(explanation)'] && selectedCrew['image(explanation)'].trim()) {
    imageUrls = parseImageUrls(selectedCrew['image(explanation)']);
  } else {
    imageUrls = ['../pic/default.jpg'];
  }
  
  console.log(`선택된 크루: ${selectedCrew.name}`);
  console.log('파싱된 이미지 URL:', imageUrls);
  console.log('이미지 개수:', imageUrls.length);
  
  initializeImageSlider(imageUrls);
  
  // 시간대 및 요일 계산
  const [dateOnly, timeOnly] = selectedCrew.schedule.split(' ');
  const period = getTimePeriod(timeOnly);
  const periodEN = getTimePeriodEN(period);
  const weekdayKR = getWeekday(dateOnly);
  const weekdayEN = getWeekdayEN(dateOnly);
  const formattedTime = formatTimeAMPM(timeOnly);
  
  // ✅ 한글 정보 (들여쓰기 적용)
  const infoKR = `
    <p style="margin: 0 0 12px 0; font-weight: 600;">On store Seoul에서는 ${weekdayKR}요일 ${period}에 그룹 런을 개최합니다.</p>
    <ul style="margin: 0; padding-left: 20px; list-style: none;">
      <li>집합 장소: ${selectedCrew.location}</li>
      <li>집합 날짜: ${dateOnly}</li>
      <li>집합 시간: ${formattedTime} (10분 전 도착 권장)</li>
      <li>대상: ${selectedCrew.distance}km 이상의 거리 달리기 가능</li>
    </ul>
  `;
  
  // ✅ 영문 정보 (들여쓰기 적용)
  const infoEN = `
    <p style="margin: 0 0 12px 0; font-weight: 600;">At On store Seoul, we host a group run on ${weekdayEN} during the ${periodEN}.</p>
    <ul style="margin: 0; padding-left: 20px; list-style: none;">
      <li>Meeting place: ${selectedCrew.location}</li>
      <li>Meeting time: ${formattedTime}</li>
      <li>Target: Participants able to run at least ${selectedCrew.distance}km</li>
    </ul>
  `;
  
  // ✅ 공지사항 (들여쓰기 적용)
  const notices = `
    <ul style="margin: 0; padding-left: 20px; list-style: none;">
      <li>달릴 수 있는 복장으로 오시기 바랍니다. (짐 보관 있음)</li>
      <li>신어보는 신발은 한정되어 있기 때문에 준비할 수 없을 가능성이 있습니다.</li>
      <li>인원수에 따라 그룹이 나뉠 수 있습니다.</li>
      <li style="margin-top: 10px;">Please come in suitable running attire (storage available)</li>
      <li>Shoes for trying are limited and may not be available</li>
      <li>Participants may be split into groups depending on number</li>
    </ul>
  `;
  
  document.getElementById('schedule-info').innerHTML = `
    <div style="margin-bottom: 30px;">${infoKR}</div>
    <div style="margin-bottom: 30px;">${infoEN}</div>
    <div>${notices}</div>
  `;
}

// ================================
// ⭐️ [수정] 북마크 버튼 클릭 이벤트 (새 로직)
// ================================
document.getElementById('bookmark-btn').addEventListener('click', () => {
  if (!IS_LOGGED_IN) {
    alert("로그인 후 북마크할 수 있습니다.");
    // ⭐️ 로그인 페이지로 이동 (경로 수정 필요시 변경)
    window.location.href = '../userauth/login.html'; 
    return;
  }

  if (!currentCrewData) {
    alert("크루 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
    return;
  }

  // 1. localStorage 데이터 토글
  toggleBookmark(currentCrewData);
  
  // 2. 버튼 상태 즉시 업데이트
  const bookmarkBtn = document.getElementById('bookmark-btn');
  const newState = !(bookmarkBtn.getAttribute('aria-pressed') === 'true');
  bookmarkBtn.setAttribute('aria-pressed', String(newState));
  
  alert(newState ? "북마크에 추가했습니다." : "북마크에서 제거했습니다.");
});


// ================================
// 공유 버튼 클릭 이벤트
// ================================
document.getElementById('share-btn').addEventListener('click', () => {
  navigator.clipboard.writeText(window.location.href)
    .then(() => alert('URL이 복사되었습니다!'))
    .catch(err => alert('URL 복사 실패:', err));
});

// ================================
// 페이지 로드 시 실행
// ================================
document.addEventListener('DOMContentLoaded', async () => {
  scheduleDates = document.getElementById('schedule-dates');
  progressTrack = document.querySelector('.schedule-progress-track');
  
  if (scheduleDates) {
    scheduleDates.addEventListener('scroll', updateScheduleProgressBar);
  }
  
  try {
    const res = await fetch(SHEETAPI);
    const data = await res.json();
    
    if (!data || data.length === 0) throw new Error('데이터 없음');
    
    const crewNameParam = getQueryParam('name');
    const crewIdParam = getQueryParam('id');
    
    let crewRows = data;
    if (crewIdParam) {
      crewRows = crewRows.filter(c => 
        c.id.trim().toLowerCase() === crewIdParam.trim().toLowerCase()
      );
    } else if (crewNameParam) {
      crewRows = crewRows.filter(c => 
        c.name.replace(/\s/g, '').toLowerCase().includes(crewNameParam.replace(/\s/g, '').toLowerCase())
      );
    }
    
    if (crewRows.length === 0) {
      crewRows = data;
    }
    
    let defaultCrewData = null;
    
    if (crewIdParam) {
      const match = crewRows.find(d => 
        d.id.trim().toLowerCase() === crewIdParam.trim().toLowerCase()
      );
      if (match) defaultCrewData = match;
    }
    
    if (!defaultCrewData && crewNameParam) {
      const match = crewRows.find(d => 
        d.name.replace(/\s/g, '').toLowerCase().includes(crewNameParam.replace(/\s/g, '').toLowerCase())
      );
      if (match) defaultCrewData = match;
    }
    
    if (!defaultCrewData && crewRows.length > 0) {
      defaultCrewData = crewRows[0];
    }
    
    updateCrewInfo(defaultCrewData);
    
    // ===== 스케줄 버튼 생성 =====
    // 같은 name 모두 추출해서 여러 날짜 표시!
const scheduleDiv = document.getElementById('schedule-dates');
scheduleDiv.innerHTML = '';

// name 기준 그룹
const thisCrewRows = data.filter(row => row.name && row.name === defaultCrewData.name);

const seenSchedules = new Set();
const sameNameSchedules = thisCrewRows.filter(row => {
  if (!row.schedule) return false;
  const key = `${row.schedule}`;
  if (seenSchedules.has(key)) return false;
  seenSchedules.add(key);
  return true;
}).sort((a, b) => new Date(a.schedule) - new Date(b.schedule));

sameNameSchedules.forEach(item => {
  const btn = document.createElement('button');
  btn.textContent = item.schedule; // 날짜+시간만 (아래처럼 `${item.schedule} | ${item.location}` 등 필요한 정보 추가 가능)
  btn.classList.add('schedule-date-btn');
  if (
    defaultCrewData &&
    item.schedule === defaultCrewData.schedule
  ) {
    btn.classList.add('active');
  }
  btn.addEventListener('click', () => {
    updateCrewInfo(item);
    document.querySelectorAll('.schedule-date-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
  scheduleDiv.appendChild(btn);
});

    
    setTimeout(() => {
      updateScheduleProgressBar();
    }, 100);
    
  } catch (err) {
    console.error('에러:', err);
    initializeImageSlider(['../pic/default.jpg']);
    document.getElementById('schedule-info').textContent = '데이터를 불러올 수 없습니다.';
  }
});

// ================================
// 페이지 로드 완료 후 진행도 바 업데이트
// ================================
window.addEventListener('load', () => {
  setTimeout(() => {
    console.log('진행도 바 초기화 중...');
    updateScheduleProgressBar();
  }, 500);
});

// ================================
// 윈도우 리사이즈 시 진행도 바 업데이트
// ================================
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(updateScheduleProgressBar, 250);
});

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