// ================================
// API 및 기본 설정
// ================================
const SHEETAPI = 'https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e/tabs/CREWLIST';

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
// 이미지 슬라이더 - 슬라이드 이동 함수 (뫼비우스 루프)
// ================================
function showSlide(index) {
  if (totalSlides <= 0) return;
  
  // ✅ 뫼비우스 루프: 항상 0 ~ (totalSlides-1) 범위 내로 정규화
  currentIndex = ((index % totalSlides) + totalSlides) % totalSlides;
  
  // ✅ 슬라이더 이동
  slider.style.transform = `translateX(${-currentIndex * 100}%)`;
  
  console.log(`슬라이드 ${currentIndex + 1}/${totalSlides}`);
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
// 이미지 슬라이더 초기화 함수
// ================================
function initializeImageSlider(imageUrls) {
  slider = document.querySelector('.image-slider');
  prevBtn = document.querySelector('.arrow-prev');
  nextBtn = document.querySelector('.arrow-next');
  
  const validUrls = imageUrls.filter(url => url && url.trim() !== '');
  
  if (validUrls.length === 0) {
    validUrls.push('../pic/default.jpg');
  }
  
  slider.innerHTML = '';
  
  validUrls.forEach(url => {
    const img = document.createElement('img');
    img.src = url;
    img.alt = '런닝 이미지';
    slider.appendChild(img);
  });
  
  totalSlides = validUrls.length;
  currentIndex = 0;
  
  slider.style.width = `${totalSlides * 100}%`;
  
  document.querySelectorAll('.image-slider img').forEach(img => {
    img.style.width = `${100 / totalSlides}%`;
    img.style.height = '100%';
    img.style.objectFit = 'cover';
  });
  
  const newPrevBtn = prevBtn.cloneNode(true);
  const newNextBtn = nextBtn.cloneNode(true);
  prevBtn.replaceWith(newPrevBtn);
  nextBtn.replaceWith(newNextBtn);
  
  prevBtn = newPrevBtn;
  nextBtn = newNextBtn;
  
  // 이전 버튼 (마지막 장에서 누르면 첫 장으로)
  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showSlide(currentIndex - 1);  // ✅ 무한 루프 처리
    resetAutoSlide();
  });
  
  // 다음 버튼 (마지막 장에서 누르면 첫 장으로)
  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    showSlide(currentIndex + 1);  // ✅ 무한 루프 처리
    resetAutoSlide();
  });
  
  console.log(`슬라이더 초기화 완료: ${totalSlides}개 이미지`);
  
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
// 북마크 버튼 클릭 이벤트
// ================================
document.getElementById('bookmark-btn').addEventListener('click', () => {
  const crewName = document.getElementById('crew-name').textContent;
  const crewSchedule = document.getElementById('crew-schedule').textContent;
  
  let bookmarks = JSON.parse(localStorage.getItem('bookmarkedRuns')) || [];
  bookmarks.push({ name: crewName, schedule: crewSchedule });
  localStorage.setItem('bookmarkedRuns', JSON.stringify(bookmarks));
  
  alert(`${crewName} ${crewSchedule}을 북마크했습니다!`);
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
    const scheduleDiv = document.getElementById('schedule-dates');
    scheduleDiv.innerHTML = '';
    
    const seen = new Set();
    
    const uniqueDates = crewRows
      .map(row => {
        if (!row.schedule) return null;
        const [date, time] = row.schedule.split(' ');
        const key = `${row.id}-${row.schedule}`;
        
        if (seen.has(key)) return null;
        seen.add(key);
        
        return { date, time, crewData: row };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        
        return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
      });
    
    uniqueDates.forEach(item => {
      const btn = document.createElement('button');
      btn.textContent = `${item.date} ${item.time}`;
      btn.classList.add('schedule-date-btn');
      
      if (defaultCrewData && item.crewData.id === defaultCrewData.id && 
          item.date === defaultCrewData.schedule.split(' ')[0] &&
          item.time === defaultCrewData.schedule.split(' ')[1]) {
        btn.classList.add('active');
      }
      
      btn.addEventListener('click', () => {
        updateCrewInfo(item.crewData);
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