// ✅ API
const CREW_API = "https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e";
const RESERVE_API = "https://api.sheetbest.com/sheets/4e2d77b5-9ae8-4a14-bfee-5b7dffe35b95";

// =====================================================
// 🔹 1. 로그인 정보 불러오기
// =====================================================
function loadLoggedInUserInfo() {
    let loggedInUser = sessionStorage.getItem("loggedInUser");
    
    if (!loggedInUser) {
        loggedInUser = localStorage.getItem("loggedInUser");
        if (loggedInUser) {
            console.log("📝 localStorage에서 로그인 정보 로드");
        }
    }
    
    // ⭐️ 이 부분이 함수 내부에 있어야 함!
    const lastNameInput = document.getElementById("lastNameInput");
    const firstNameInput = document.getElementById("firstNameInput");
    const emailInput = document.getElementById("emailInput");

    if (loggedInUser) {
        const user = JSON.parse(loggedInUser);
        console.log("✅ 로그인 정보 찾음:", user.name, user.email);
        lastNameInput.value = user.name || "";
        firstNameInput.value = "";
        emailInput.value = user.email || "";
        
        lastNameInput.readOnly = true;
        firstNameInput.readOnly = true;
        emailInput.readOnly = true;
        
        return true;
    }
    
    console.log("❌ 로그인 정보 없음 (비회원)");
    lastNameInput.value = "";
    firstNameInput.value = "";
    emailInput.value = "";
    
    lastNameInput.readOnly = false;
    firstNameInput.readOnly = false;
    emailInput.readOnly = false;
    
    return false;
}

// =====================================================
// 🔹 2. 페이지 헤더 업데이트
// =====================================================
function updatePageHeader() {
    const pageHeader = document.getElementById("pageHeader");
    const isLoggedIn = sessionStorage.getItem("loggedInUser") !== null || localStorage.getItem("loggedInUser") !== null;
    
    if (isLoggedIn) {
        pageHeader.textContent = "회원 예약 페이지";
    } else {
        pageHeader.textContent = "비회원 예약 페이지";
    }
}

// =====================================================
// 🔹 3. 폼 필드 유효성 검사
// =====================================================
function validateFormFields(submitBtn, checks) {
    const lastNameInput = document.getElementById("lastNameInput");
    const emailInput = document.getElementById("emailInput");
    
    const lastNameFilled = lastNameInput.value.trim() !== "";
    const emailFilled = emailInput.value.trim() !== "";
    const allChecked = checks.every(chk => chk.checked);
    
    const isValid = lastNameFilled && emailFilled && allChecked;
    
    submitBtn.disabled = !isValid;
    submitBtn.style.opacity = isValid ? "1" : "0.5";
    submitBtn.style.cursor = isValid ? "pointer" : "not-allowed";
}

// =====================================================
// 🔹 4. 크루 목록 불러오기
// =====================================================
function getSelectedCrewFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("id");
}

async function loadCrewList() {
    try {
        const res = await fetch(CREW_API);
        const crews = await res.json();
        const select = document.getElementById("crewSelect");
        const selectedCrewId = getSelectedCrewFromURL();

        const crewMap = new Map();
        crews.forEach(c => {
            const existing = crewMap.get(c.name);
            if (!existing || new Date(c.schedule) < new Date(existing.schedule)) {
                crewMap.set(c.name, c);
            }
        });

        Array.from(crewMap.values()).forEach(c => {
            const option = document.createElement("option");
            option.value = c.id.trim();
            option.textContent = `${c.name} (${c.schedule})`;
            if (c.id === selectedCrewId) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    } catch (err) {
        console.error("크루 리스트 불러오기 실패", err);
    }
}

// =====================================================
// 🔹 5. 페이지 로드 시 초기화
// =====================================================
document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.querySelector('.btn-submit');
    const checks = [
        document.getElementById('agree1'),
        document.getElementById('agree2'),
        document.getElementById('agree3')
    ];
    
    // ✅ 초기화 함수들 호출
    loadLoggedInUserInfo();
    updatePageHeader();
    loadCrewList();
    validateFormFields(submitBtn, checks);
    
    // ✅ 이벤트 리스너 등록
    checks.forEach(chk => chk.addEventListener('change', () => validateFormFields(submitBtn, checks)));
    document.getElementById("lastNameInput").addEventListener('input', () => validateFormFields(submitBtn, checks));
    document.getElementById("emailInput").addEventListener('input', () => validateFormFields(submitBtn, checks));
    
    // ✅ 예약 폼 제출
    document.getElementById('reserveForm').addEventListener('submit', async function(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const crew_id = formData.get("crew_id").trim();
        const last_name = formData.get("last_name").trim();
        const first_name = formData.get("first_name").trim();
        const email = formData.get("email").trim();
        const fullName = `${last_name} ${first_name}`.trim();

        if (!last_name || !email || !crew_id) {
            alert("필수 입력값이 비어있습니다.");
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

            // 2) 남은 자리 감소
            const crewRes = await fetch(CREW_API);
            const crewList = await crewRes.json();
            const selectedCrew = crewList.find(c => (c.id || "").trim() === crew_id);

            if (selectedCrew) {
                const newRemain = Math.max(0, parseInt(selectedCrew.remain || "0") - 1);
                await fetch(`${CREW_API}/id/${crew_id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ remain: newRemain })
                });
            }

            // 3) 이메일 발송
            if (selectedCrew) {
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
            }

            // 4) 완료
            sessionStorage.setItem("reserve_name", fullName);
            window.location.href = "reserve_done.html";

        } catch (err) {
            console.error("예약 처리 중 오류:", err);
            alert("예약 처리 중 오류가 발생했습니다.");
        }
    });
});
