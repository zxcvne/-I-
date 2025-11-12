// ✅ CREW LIST API
const CREW_API = "https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e";

// ✅ RESERVATIONS API
const RESERVE_API = "https://api.sheetbest.com/sheets/4e2d77b5-9ae8-4a14-bfee-5b7dffe35b95";

// 🔹 URL에서 ?id= 값 자동 가져오기
function getSelectedCrewFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id"); // 예: "SEONG01"
}


// ✅ loadCrewList 실행
document.addEventListener("DOMContentLoaded", () => {
  loadCrewList();
});


// 개인정보 동의 체크박스 3개 모두 체크되어야만 submit 버튼 활성화
const submitBtn = document.querySelector('.btn-submit');
const checks = [document.getElementById('agree1'), document.getElementById('agree2'), document.getElementById('agree3')];

function validateChecks() {
  const checked = checks.every(chk => chk.checked);
  submitBtn.disabled = !checked;
  submitBtn.style.opacity = checked ? "1" : "0.5";
  submitBtn.style.cursor = checked ? "pointer" : "not-allowed";
}

checks.forEach(chk => chk.addEventListener('change', validateChecks));

// 최초 로딩시에도 비활성화
validateChecks();

document.getElementById('reserveForm').addEventListener('submit', function(e){
  if (!checks.every(chk => chk.checked)) {
    e.preventDefault();
    alert("모든 약관에 동의해야 참가 신청이 가능합니다.");
  }
});








/************ */
/* 참가 희망 크루를 선택해주세요 */
/* 같은 런닝 이름, 다른 날짜의 런닝 스케줄이 있으면 가장 빠른 스케줄만 뜨게 만듬 */
// ✅ 크루 목록 불러오기
async function loadCrewList() {
  try {
    const res = await fetch(CREW_API);
    const crews = await res.json();

    const select = document.getElementById("crewSelect");
    const selectedCrewId = getSelectedCrewFromURL(); // URL에 들어온 ID

    // 🔹 중복 이름 제거, 날짜가 가장 빠른 것만 남기기
    const crewMap = new Map(); // name -> crew 객체
    crews.forEach(c => {
      const existing = crewMap.get(c.name);
      if (!existing || new Date(c.schedule) < new Date(existing.schedule)) {
        crewMap.set(c.name, c);
      }
    });

    // 🔹 Map에서 순서대로 select 옵션 생성
    Array.from(crewMap.values()).forEach(c => {
      const option = document.createElement("option");
      option.value = c.id.trim();
      option.textContent = `${c.name} (${c.schedule})`;

      // ✅ URL에서 넘어온 크루가 있으면 자동 선택
      if (c.id === selectedCrewId) {
        option.selected = true;
      }

      select.appendChild(option);
    });

  } catch (err) {
    console.error("크루 리스트 불러오기 실패", err);
  }
}







// 메일보내기
document.getElementById("reserveForm").addEventListener("submit", async function(e) {
  e.preventDefault();

  const formData = new FormData(e.target);
  const crew_id = formData.get("crew_id").trim();
  const last_name = formData.get("last_name");
  const first_name = formData.get("first_name");
  const email = formData.get("email");
  const fullName = `${last_name} ${first_name}`;


    // (안전) 필수값 체크
  if (!crew_id || !email || !first_name) {
    alert("필수 입력값이 비어있습니다. 이름, 이메일, 크루 선택을 확인해주세요.");
    return;
  }

  
  try {
    // 1) 예약 저장
    await fetch(RESERVE_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        timestamp: new Date().toLocaleString(),
        crew_id,
        last_name,
        first_name,
        email
      })
    });

    // 2) 남은 자리 감소 처리
    const crewRes = await fetch(CREW_API);
    const crewList = await crewRes.json();

    // 안전하게 trim 비교
    const selectedCrew = crewList.find(c => (c.id || "").trim() === crew_id);

    if (selectedCrew) {
      const newRemain = Math.max(0, parseInt(selectedCrew.remain || "0") - 1);
      await fetch(`${CREW_API}/id/${crew_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remain: newRemain })
      });
    } else {
      console.warn("selectedCrew가 없음 (id 일치 실패). crew_id:", crew_id);
    }

    // 3) 이메일 발송 — 반드시 await 해서 완료를 기다림
    if (selectedCrew) {
      // debug 로그(콘솔에 반드시 찍히는지 확인)
      console.log("sending email to:", email, "selectedCrew:", selectedCrew);

      await emailjs.send("service_8nyo57q", "template_92edkoa", {
        name: fullName,
        reply_to: email,
        to_email: email,
        crew_name: selectedCrew.name,
        schedule: selectedCrew.schedule,
        location: selectedCrew.location,
        departure: selectedCrew.departure,
        destination: selectedCrew.destination
      }, "EqsN4SZpOUDs5fJts");

      console.log("✅ 메일 전송 완료");
    } else {
      console.log("메일 발송 스킵 (selectedCrew 없음)");
    }

    // 4) 성공 안내 및 페이지 이동
    sessionStorage.setItem("reserve_name", first_name);
    window.location.href = "reserve_done.html";

  } catch (err) {
    console.error("예약 처리 중 오류:", err);
    alert("예약 처리 중 오류가 발생했습니다. 콘솔 로그를 확인해 주세요.");
  }
});