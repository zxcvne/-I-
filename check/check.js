const RESERVE_API = "https://api.sheetbest.com/sheets/4e2d77b5-9ae8-4a14-bfee-5b7dffe35b95";
const CREW_API = "https://api.sheetbest.com/sheets/170a7363-a39b-4f9e-af93-7dcc5921746e";

let selectedReservation = null;
let selectedCrew = null;
let allReservations = [];

document.getElementById("checkForm").addEventListener("submit", async function(e){
  e.preventDefault();

  const last = document.getElementById("lastName").value.trim();
  const first = document.getElementById("firstName").value.trim();
  const email = document.getElementById("email").value.trim();

  const resBox = document.getElementById("result");
  resBox.style.display = "none";
  resBox.innerHTML = "";

  try {
    // 예약 불러오기
    const reserveRes = await fetch(RESERVE_API);
    allReservations = await reserveRes.json();

    // 이름+이메일 일치 예약 필터
    const matches = allReservations.filter(r =>
      r.last_name?.trim() === last &&
      r.first_name?.trim() === first &&
      r.email?.trim() === email
    );

    if (matches.length === 0) {
      resBox.style.display = "block";
      resBox.innerHTML = `<p>📌 예약 내역을 찾을 수 없습니다.</p>`;
      return;
    }

    // 크루 정보 불러오기
    const crewRes = await fetch(CREW_API);
    const crews = await crewRes.json();

    resBox.style.display = "block";
    resBox.innerHTML = `<h3>예약 내역 (${matches.length}건)</h3>`;

    if(matches.length > 1){
      const select = document.createElement("select");
      select.id = "reservationSelect";
      select.style.width = "100%";
      select.style.marginTop = "8px";
      matches.forEach((r, i) => {
        const crew = crews.find(c => (c.id || "").trim() === r.crew_id.trim());
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `${crew?.name || "정보없음"} (${crew?.schedule || "날짜없음"})`;
        select.appendChild(option);
      });
      resBox.appendChild(select);

      select.addEventListener("change", () => showReservationDetail(matches[select.value], crews));
      showReservationDetail(matches[0], crews);
    } else {
      showReservationDetail(matches[0], crews);
    }

  } catch (err) {
    console.error(err);
    alert("조회 중 오류가 발생했습니다.");
  }
});

function showReservationDetail(reservation, crews){
  selectedReservation = reservation;
  selectedCrew = crews.find(c => (c.id || "").trim() === reservation.crew_id.trim());

  let resBox = document.getElementById("result");
  resBox.querySelectorAll(".detail").forEach(el => el.remove());

  const detailDiv = document.createElement("div");
  detailDiv.classList.add("detail");
  detailDiv.innerHTML = `
    <p><strong>크루명:</strong> ${selectedCrew?.name || "정보없음"}</p>
    <p><strong>일시:</strong> ${selectedCrew?.schedule || "정보없음"}</p>
    <p><strong>집결 위치:</strong> ${selectedCrew?.location || "정보없음"}</p>
    <button id="cancelBtn" class="btn-submit" style="margin-top:10px; width:100%;">예약 취소하기</button>
  `;
  resBox.appendChild(detailDiv);

  document.getElementById("cancelBtn").addEventListener("click", cancelReservation);
}

async function cancelReservation() {
  if (!confirm("정말 예약을 취소하시겠습니까?")) return;

  try {
    // 1) 예약 DELETE
    await fetch(`${RESERVE_API}/email/${selectedReservation.email}`, { method:"DELETE" });

    // 2) 남은자리 +1
    const newRemain = (parseInt(selectedCrew?.remain || "0") + 1);
    await fetch(`${CREW_API}/id/${selectedCrew.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ remain: newRemain })
    });

    // 3) 이메일 발송 – template_m44vn9b 사용
    await emailjs.send("service_8nyo57q", "template_m44vn9b", {
      name: `${selectedReservation.last_name} ${selectedReservation.first_name}`,
      to_email: selectedReservation.email,
      crew_name: selectedCrew?.name || "",
      schedule: selectedCrew?.schedule || "",
      location: selectedCrew?.location || "",
      departure: selectedCrew?.departure || "",
      destination: selectedCrew?.destination || ""
    }, "EqsN4SZpOUDs5fJts");

    // 4) 취소 완료 페이지 이동
    window.location.href = "cancel_done.html";

  } catch(err){
    console.error(err);
    alert("취소 처리 중 오류가 발생했습니다.");
  }
}
