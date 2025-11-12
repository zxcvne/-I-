/* ----------------------------
   2025.11.11
   Author: Hong Sumin(sumin5400@gmail.com)
   Description: On Crew page JavaScript
----------------------------- */

/* ----------------------------------------- 가로 스와이프 JS ----------------------------------------- */
function setupHScroll(box) {
    let isDown = false, startX = 0, startScroll = 0, activeId = null;

    box.addEventListener('pointerdown', (e) => {
        isDown = true;
        startX = e.clientX;
        startScroll = box.scrollLeft;
        activeId = e.pointerId;
        box.setPointerCapture?.(activeId);
    });

    box.addEventListener('pointermove', (e) => {
        if (!isDown) return;
        const dx = e.clientX - startX;
        box.scrollLeft = startScroll - dx;
    }, { passive: true });

    const endDrag = () => {
        isDown = false;
        if (activeId !== null) { box.releasePointerCapture?.(activeId); activeId = null; }
    };

    box.addEventListener('pointerup', endDrag);
    box.addEventListener('pointercancel', endDrag);
    box.addEventListener('mouseleave', endDrag);
    box.addEventListener('touchend', endDrag);
}

//헤더, 바디 러너 모두 적용
document.querySelectorAll('.hscroll-box').forEach(setupHScroll);



/* ----------------------------------------- 숏츠 효과 JS ----------------------------------------- */

(() => {
    const root = document.getElementById('shortsCarousel');
    const cards = Array.from(root.querySelectorAll('.video-card'));
    if (cards.length !== 3) return;

    const prevBtn = root.querySelector('.shorts-nav.prev');
    const nextBtn = root.querySelector('.shorts-nav.next');
    let center = 1;

    function render() {
        const left = cards[(center + cards.length - 1) % cards.length];
        const mid = cards[center];
        const right = cards[(center + 1) % cards.length];

        cards.forEach(c => c.classList.remove('is-center'));
        root.insertBefore(left, root.querySelector('.shorts-nav.next'));
        root.insertBefore(mid, root.querySelector('.shorts-nav.next'));
        root.insertBefore(right, root.querySelector('.shorts-nav.next'));
        mid.classList.add('is-center');
    }

    function next() {
        center = (center + 1) % cards.length;
        render();
    }
    function prev() {
        center = (center + cards.length - 1) % cards.length;
        render();
    }

    nextBtn.addEventListener('click', next);
    prevBtn.addEventListener('click', prev);
    root.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
    });
    root.tabIndex = 0;

    render();
})();

/* ----------------------------------------- 이미지 호버 시 전환 효과 JS ----------------------------------------- */

const hoverImg = document.querySelector('.hoverImg-box img');

// 호버 이미지 및 링크 데이터
const cityData = {
    wwNyBtn: {
        img: '../assets/images/rts_ww-newyork.jpg',
        link: 'https://www.on.com/en-us/explore/on/dream-on?srsltid=AfmBOopZa8U13YK5MXkHqbFu1S-2RaPqBRqEJ4eVcGQoozYZslV_PaCo'
    },
    wwBerlinBtn: {
        img: '../assets/images/rts_ww-berlin.jpg',
        link: 'https://www.on.com/ko-kr/stories/division-bpm-where-the-berlin-community-runs-together?srsltid=AfmBOorbvKoYWyi9mtKSoNa8hlaun-oYLndo39ez7BQbETVtfHmFrHra'
    },
    wwTokyoBtn: {
        img: '../assets/images/rts_ww-tokyo.jpg',
        link: 'https://onrunclubtokyo.events.on.com/?undefined=#E28C97'
    }
};

// 디폴트 이미지 > 뉴욕
hoverImg.src = cityData.wwNyBtn.img;


Object.keys(cityData).forEach(id => {
    const btn = document.getElementById(id);

    // hover 시 이미지 변경
    btn.addEventListener('mouseenter', () => {
        hoverImg.src = cityData[id].img;
        hoverImg.style.opacity = 1;
    });

    btn.addEventListener('mouseleave', () => {
        hoverImg.style.opacity = 0.8;
    });

    // 링크 이동
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        window.open(cityData[id].link, '_blank');
    });
});



/* ----------------------------------------- 스크롤 시 배경 전환 효과 JS ----------------------------------------- */

// 전환될 기준 시점 섹션
const section5 = document.querySelector('.section5');

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    });
}, {
    // 20% 이상 보이면 반전 시작
    threshold: 0.2
});

observer.observe(section5);