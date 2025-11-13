// [CSS 참고]: 이 스크립트는 CSS와 상호작용합니다.
// - [CSS Class]: .active 클래스를 모달(#withdraw-modal-overlay)에 토글합니다.
// - [CSS State Toggle]: '정보 수정' 모드에 따라 <span>, <input>, <button>의 display 스타일을 변경합니다.
// - [CSS State Toggle]: 탈퇴 모달의 확인 버튼(#modal-confirm-btn)의 :disabled 상태를 토글합니다.
// - [CSS Inline Style]: showToast() 함수에서 토스트 메시지 스타일을 동적으로 생성합니다.
// - [CSS Dynamic Text]: 프로필 정보 텍스트(#profile-email 등)를 동적으로 채웁니다.

/**
 * DOM 콘텐츠가 모두 로드되면 스크립트를 실행합니다.
 */
document.addEventListener("DOMContentLoaded", () => {
  // --- 1. ⭐️ [수정] 세션 스토리지에서 로그인 정보 가져오기 ---
  let userEmail = null;
  let userName = null;
  // [JS] 세션 스토리지에서 'loggedInUser' 키로 저장된 사용자 정보를 가져옵니다.
  const loggedInUser = sessionStorage.getItem("loggedInUser");

  if (loggedInUser) {
    try {
      const user = JSON.parse(loggedInUser);
      userEmail = user.email || null; // ⭐️ 탈퇴 확인용 이메일로도 사용됨
      userName = user.name || null;
    } catch (e) {
      console.error("세션 사용자 정보 파싱 오류:", e);
    }
  }

  // --- 2. 프로필 정보를 HTML에 삽입하는 함수 ---
  /**
   * ⭐️ [CSS Dynamic Text]
   * 세션 스토리지와 로컬 스토리지에서 사용자 정보를 읽어와
   * 프로필 <span> 및 <input> 요소에 텍스트를 채웁니다.
   */
  function populateProfile(data) {
    // [CSS 참고]: 아래 ID를 가진 요소들의 텍스트/값을 변경합니다.
    const emailEl = document.getElementById("profile-email");
    const nameEl = document.getElementById("profile-name");
    const nicknameDisplayEl = document.getElementById(
      "profile-nickname-display"
    );
    const nicknameInputEl = document.getElementById("profile-nickname-input");
    const phoneDisplayEl = document.getElementById("profile-phone-display");
    const phoneInputEl = document.getElementById("profile-phone-input");
    const addressDisplayEl = document.getElementById("profile-address-display");
    const addressInputEl = document.getElementById("profile-address-input");

    // ⭐️ [수정] 세션 정보 기반으로 데이터 채우기
    if (loggedInUser) {
      if (emailEl) emailEl.textContent = userEmail || "정보 없음";
      if (nameEl) nameEl.textContent = userName || "정보 없음";

      // ⭐️ [신규] localStorage에서 추가 정보(닉네임, 전화번호, 주소) 불러오기
      const extraProfileData = localStorage.getItem(userEmail); // 이메일을 Key로 사용
      if (extraProfileData) {
        try {
          const parsedData = JSON.parse(extraProfileData);
          // ⭐️ span(표시용)과 input(수정용) 모두에 값 설정
          if (nicknameDisplayEl)
            nicknameDisplayEl.textContent = parsedData.nickname || "정보 없음";
          if (nicknameInputEl)
            nicknameInputEl.value = parsedData.nickname || "";
          if (phoneDisplayEl)
            phoneDisplayEl.textContent = parsedData.phone || "정보 없음";
          if (phoneInputEl) phoneInputEl.value = parsedData.phone || "";
          if (addressDisplayEl)
            addressDisplayEl.textContent = parsedData.address || "정보 없음";
          if (addressInputEl) addressInputEl.value = parsedData.address || "";
        } catch (e) {
          console.error("localStorage 프로필 파싱 오류:", e);
        }
      } else {
        // 로컬 스토리지에 정보가 없으면 "정보 없음"으로 표시
        if (nicknameDisplayEl) nicknameDisplayEl.textContent = "정보 없음";
        if (phoneDisplayEl) phoneDisplayEl.textContent = "정보 없음";
        if (addressDisplayEl) addressDisplayEl.textContent = "정보 없음";
      }
    } else {
      // 비로그인 상태
      const notLoggedInMsg = "로그인이 필요합니다.";
      if (emailEl) emailEl.textContent = notLoggedInMsg;
      if (nameEl) nameEl.textContent = notLoggedInMsg;
      if (nicknameDisplayEl) nicknameDisplayEl.textContent = notLoggedInMsg;
      if (phoneDisplayEl) phoneDisplayEl.textContent = notLoggedInMsg;
      if (addressDisplayEl) addressDisplayEl.textContent = notLoggedInMsg;

      // ⭐️ [CSS State Toggle] 비로그인 시 input 비활성화
      if (nicknameInputEl) nicknameInputEl.disabled = true;
      if (phoneInputEl) phoneInputEl.disabled = true;
      if (addressInputEl) addressInputEl.disabled = true;
    }
  }

  // --- 3. 간단한 애니메이션 효과 예시 함수 ---
  /**
   * ⭐️ [CSS Dynamic Text]
   * #animation-title 요소의 텍스트를 2초마다 변경합니다.
   */
  function startAnimation() {
    const animTitle = document.getElementById("animation-title");
    if (!animTitle) return;
    const messages = [
      "애니메이션 효과",
      "및 그림",
      "JavaScript로",
      "내용을 제어합니다.",
    ];
    let currentIndex = 0;
    setInterval(() => {
      animTitle.textContent = messages[currentIndex];
      currentIndex = (currentIndex + 1) % messages.length;
    }, 2000);
  }

  // --- 5. 임시 토스트 팝업 함수 ---
  /**
   * ⭐️ [CSS Inline Style]
   * JS로 직접 CSS 스타일이 적용된 .toast-popup 요소를 생성하여 body에 추가합니다.
   * 3초 후에 자동으로 제거됩니다.
   */
  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast-popup"; // CSS 애니메이션 적용
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  // --- 4. 함수 실행 ---
  populateProfile(); // ⭐️ [CSS Dynamic Text] 프로필 정보 채우기 실행
  // startAnimation(); // 애니메이션 시작 (주석 처리됨)

  // --- ⭐️ [신규] 프로필 저장 함수 ---
  /**
   * ⭐️ [CSS Dynamic Text]
   * '저장하기' 버튼 클릭 시, localStorage에 정보를 저장하고
   * <span> 태그의 텍스트를 업데이트한 후, 수정 모드를 종료합니다.
   */
  function handleSaveProfile() {
    if (!loggedInUser || !userEmail) {
      showToast("로그인 정보가 없습니다. 다시 로그인해주세요.");
      return;
    }

    // 1. DOM 요소 다시 선택
    const nicknameInputEl = document.getElementById("profile-nickname-input");
    const phoneInputEl = document.getElementById("profile-phone-input");
    const addressInputEl = document.getElementById("profile-address-input");

    // 2. 저장할 데이터 객체 생성
    const dataToSave = {
      nickname: nicknameInputEl.value,
      phone: phoneInputEl.value,
      address: addressInputEl.value,
    };

    // 3. localStorage에 userEmail을 key로 하여 JSON 문자열 저장
    try {
      localStorage.setItem(userEmail, JSON.stringify(dataToSave));

      // ⭐️ [CSS Dynamic Text] 저장 후 UI 즉시 업데이트
      // span 텍스트를 input의 새 값으로 변경
      document.getElementById("profile-nickname-display").textContent =
        dataToSave.nickname || "정보 없음";
      document.getElementById("profile-phone-display").textContent =
        dataToSave.phone || "정보 없음";
      document.getElementById("profile-address-display").textContent =
        dataToSave.address || "정보 없음";

      // ⭐️ [CSS State Toggle] 수정 모드 -> 보기 모드로 전환
      toggleEditMode(false);

      showToast("프로필 정보가 저장되었습니다.");
    } catch (e) {
      console.error("localStorage 저장 오류:", e);
      showToast("정보 저장에 실패했습니다.");
    }
  }

  // --- ⭐️ [신규] 저장 버튼에 이벤트 리스너 추가 ---
  const saveBtn = document.getElementById("save-profile-btn");
  if (saveBtn) {
    saveBtn.addEventListener("click", handleSaveProfile);
  }

  // --- ⭐️ [신규] 수정/보기 모드 전환 함수 ---
  /**
   * ⭐️ [CSS State Toggle] [CSS Inline Style]
   * '정보 수정' 모드(true)와 '보기' 모드(false) 간에
   * <span>, <input>, <button> 요소의 display 스타일을 토글합니다.
   */
  function toggleEditMode(isEditing) {
    // 요소들 선택
    const editBtn = document.getElementById("edit-profile-btn");
    const saveBtn = document.getElementById("save-profile-btn");

    const fields = ["nickname", "phone", "address"];

    fields.forEach((field) => {
      const displayEl = document.getElementById(`profile-${field}-display`);
      const inputEl = document.getElementById(`profile-${field}-input`);

      if (isEditing) {
        // 수정 모드: span 숨기고 input 보이기
        if (displayEl) displayEl.style.display = "none";
        if (inputEl) {
          inputEl.style.display = "inline";
        }
      } else {
        // 보기 모드: span 보이고 input 숨기기
        if (displayEl) {
          displayEl.style.display = "inline";
        }
        if (inputEl) inputEl.style.display = "none";

        /* 인라인 스타일 흔적 제거로 CSS만 적용되게 */
        displayEl.removeAttribute("style");
      }
    });

    // 수정/저장 버튼 토글
    if (isEditing) {
      if (editBtn) editBtn.style.display = "none";
      if (saveBtn) saveBtn.style.display = "block";
    } else {
      if (editBtn) editBtn.style.display = "block";
      if (saveBtn) saveBtn.style.display = "none";
    }
  }

  // --- ⭐️ [신규] 정보 수정 버튼에 이벤트 리스너 추가 ---
  const editBtn = document.getElementById("edit-profile-btn");
  if (editBtn) {
    editBtn.addEventListener("click", () => {
      if (!loggedInUser) {
        showToast("로그인 후에 정보를 수정할 수 있습니다.");
        return;
      }
      toggleEditMode(true); // ⭐️ [CSS State Toggle] 수정 모드로 전환
    });
  }

  // --- 6. 임시 링크에 클릭 이벤트 추가 (토스트 알림) ---
  const tempLinks = document.querySelectorAll(".nav-menu a, .footer-links a");

  tempLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      // ⭐️ 회원 탈퇴 및 정보 수정 링크는 이 토스트를 띄우지 않음
      if (
        event.currentTarget.id === "withdraw-link" ||
        event.currentTarget.id === "edit-profile-btn"
      ) {
        event.preventDefault(); // 기본 동작(href="#") 방지
        return; // 모달/수정 로직이 대신 처리함
      }

      event.preventDefault(); // 1. 기본 링크 이동 방지
      const linkText = event.currentTarget.textContent; // 2. 링크 텍스트 가져오기
      showToast(linkText + " (임시 기능)"); // 3. ⭐️ [CSS Inline Style] 토스트 표시
    });
  });

  // --- 7. 회원 탈퇴 모달 로직 (새로 추가) ---

  // [CSS 참고]: 모달 관련 DOM 요소 선택
  const withdrawLink = document.getElementById("withdraw-link");
  const modalOverlay = document.getElementById("withdraw-modal-overlay");
  const closeBtn = document.getElementById("modal-close-btn");
  const cancelBtn = document.getElementById("modal-cancel-btn");
  const confirmBtn = document.getElementById("modal-confirm-btn");
  const emailInput = document.getElementById("withdraw-email-input");

  /**
   * ⭐️ [CSS Class]
   * 회원 탈퇴 모달(#withdraw-modal-overlay)에 '.active' 클래스를 추가합니다.
   */
  function openModal() {
    if (modalOverlay) modalOverlay.classList.add("active");
  }

  /**
   * ⭐️ [CSS Class]
   * 회원 탈퇴 모달(#withdraw-modal-overlay)에서 '.active' 클래스를 제거합니다.
   * ⭐️ [CSS State Toggle]
   * 확인 버튼(#modal-confirm-btn)을 :disabled 상태로 되돌립니다.
   */
  function closeModal() {
    if (modalOverlay) modalOverlay.classList.remove("active");
    if (emailInput) emailInput.value = ""; // 입력창 비우기
    if (confirmBtn) confirmBtn.disabled = true; // 버튼 비활성화
  }

  // 모달 열기 리스너
  if (withdrawLink) {
    withdrawLink.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(); // ⭐️ [CSS Class] 호출
    });
  }

  // 모달 닫기 리스너 (X 버튼, 취소 버튼, 배경 클릭)
  if (closeBtn) closeBtn.addEventListener("click", closeModal); // ⭐️ [CSS Class] 호출
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal); // ⭐️ [CSS Class] 호출
  if (modalOverlay) {
    modalOverlay.addEventListener("click", (event) => {
      if (event.target === modalOverlay) {
        closeModal(); // ⭐️ [CSS Class] 호출
      }
    });
  }

  // 이메일 입력 감지 리스너
  if (emailInput) {
    emailInput.addEventListener("input", () => {
      /**
       * ⭐️ [CSS State Toggle]
       * 입력된 이메일과 사용자 이메일이 일치하면
       * 확인 버튼(#modal-confirm-btn)의 :disabled 상태를 해제합니다.
       */
      if (emailInput.value === userEmail) {
        // ⭐️ 세션에서 가져온 userEmail 사용
        confirmBtn.disabled = false; // 일치하면 버튼 활성화
      } else {
        confirmBtn.disabled = true; // 불일치하면 버튼 비활성화
      }
    });
  }

  // 최종 탈퇴 확인 버튼 리스너
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      closeModal(); // ⭐️ [CSS Class] 호출
      showToast("회원 탈퇴가 처리되었습니다."); // ⭐️ [CSS Inline Style] 호출
      console.log("회원 탈퇴 완료.");
    });
  }
});
