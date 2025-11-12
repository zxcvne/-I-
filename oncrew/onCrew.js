/* ----------------------------
   2025.11.10
   Author: Hong Sumin
   Description: On Crew page JavaScript
----------------------------- */

document.addEventListener('DOMContentLoaded', () => {

  /* ----------------------------------------- 가로 스와이프 ----------------------------------------- */
  document.querySelectorAll('.hscroll-box').forEach(box => {
    let isDown = false, startX = 0, startScroll = 0;
    box.addEventListener('pointerdown', e => {
      isDown = true;
      startX = e.clientX;
      startScroll = box.scrollLeft;
    });
    box.addEventListener('pointermove', e => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      box.scrollLeft = startScroll - dx;
    });
    ['pointerup', 'pointercancel', 'mouseleave'].forEach(ev =>
      box.addEventListener(ev, () => (isDown = false))
    );
  });

  /* ----------------------------------------- 전체보기 버튼 ----------------------------------------- */
  const grid = document.getElementById('onRunnersGrid');
  const btn = document.getElementById('moreBtn');
  const label = btn.querySelector('span');
  const COLS = 5;
  const initGrid = () => {
    const count = grid.querySelectorAll('.on-runner-card').length;
    if (count > (COLS * 2)) {
      grid.classList.add('collapsed');
      btn.style.display = 'inline-flex';
      label.textContent = '전체보기';
    }
  };
  btn.addEventListener('click', () => {
    const isCollapsed = grid.classList.toggle('collapsed');
    btn.setAttribute('aria-expanded', !isCollapsed);
    label.textContent = isCollapsed ? '전체보기' : '접기';
  });
  initGrid();

  /* ----------------------------------------- ON RUNNER 이미지 모달 ----------------------------------------- */
  const imageModal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  const imageClose = imageModal.querySelector('.close');
  document.querySelectorAll('.on-runner-card img').forEach(img => {
    img.addEventListener('click', () => {
      imageModal.style.display = 'flex';
      modalImg.src = img.src;
      document.body.style.overflow = 'hidden';
    });
  });
  imageClose.addEventListener('click', () => {
    imageModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });
  imageModal.addEventListener('click', e => {
    if (e.target === imageModal) {
      imageModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

  /* ----------------------------------------- HEAD/BUDDY RUNNER 프로필 모달 ----------------------------------------- */
  const profileModal = document.getElementById('profileModal');
  const profileImg = document.getElementById('profileImg');
  const profileName = document.getElementById('profileName');
  const profilePosition = document.getElementById('profilePosition');
  const profileDetail = document.getElementById('profileDetail');
  const profileRecord = document.getElementById('profileRecord');
  const closeProfile = profileModal.querySelector('.close');

  document.querySelectorAll('.head-runner-card, .buddy-runner-card').forEach(card => {
    card.addEventListener('click', () => {
      profileImg.src = card.querySelector('img').src;
      profileName.textContent = card.querySelector('.card-name')?.textContent || '';
      profilePosition.textContent = card.querySelector('.card-position')?.textContent || '';
      profileDetail.innerHTML = card.querySelector('.card-detail')?.innerHTML || '';
      profileRecord.textContent = card.querySelector('.card-record')?.innerText || '';
      profileModal.style.display = 'flex';
      document.body.style.overflow = 'hidden';
    });
  });

  closeProfile.addEventListener('click', () => {
    profileModal.style.display = 'none';
    document.body.style.overflow = 'auto';
  });

  profileModal.addEventListener('click', e => {
    if (e.target === profileModal) {
      profileModal.style.display = 'none';
      document.body.style.overflow = 'auto';
    }
  });

});
