// Product data with 이미지, 가격, 경로
const productData = {
  male: [
    {
      image: "./onGearImage/mCloudsurferNext.webp",
      price: "₩189,000",
      route:
        "https://www.on.com/ko-kr/products/cloudsurfer-next-3me3002/mens/malibu-raspberry-shoes-3ME30024291",
    },
    {
      image: "./onGearImage/mCloudsurferTrail2.webp",
      price: "₩199,000",
      route:
        "https://www.on.com/ko-kr/products/cloudsurfer-trail-2-m-3mf3022/mens/rock-niagara-shoes-3MF30223651",
    },
    {
      image: "./onGearImage/mCloudmonster2.webp",
      price: "₩219,000",
      route:
        "https://www.on.com/ko-kr/products/cloudmonster-2-m-3mf3104/mens/ivory-lime-shoes-3MF31043072",
    },
    {
      image: "./onGearImage/mCloudmonsterHyper.webp",
      price: "₩259,000",
      route:
        "https://www.on.com/ko-kr/products/cloudmonster-hyper-m-3me1013/mens/black-lima-shoes-3ME10132535",
    },
    {
      image: "./onGearImage/mCloudrunner2.webp",
      price: "₩189,000",
      route:
        "https://www.on.com/ko-kr/products/cloudrunner-2-m-3me1014/mens/alloy-chambray-shoes-3ME10143194",
    },
    {
      image: "./onGearImage/mCloudrunner2Waterproof.webp",
      price: "₩209,000",
      route: "/products/male/cloudrunner2waterproof",
    },
    {
      image: "./onGearImage/mCloudsurferMax.webp",
      price: "₩219,000",
      route:
        "https://www.on.com/ko-kr/products/cloudsurfer-max-m-3mf3043/mens/cinder-pelican-shoes-3MF30434052",
    },
    {
      image: "./onGearImage/mCloudsurferMax(2).webp",
      price: "₩219,000",
      route:
        "https://www.on.com/ko-kr/products/cloudsurfer-max-m-3mf3043/mens/ivory-salmon-shoes-3MF30433297",
    },
    {
      image: "./onGearImage/mCloudsurferTrail2Waterproof.webp",
      price: "₩219,000",
      route:
        "https://www.on.com/ko-kr/products/cloudsurfer-trail-2-wp-m-3mf3024/mens/black-black-shoes-3MF30241043",
    },
  ],
  female: [
    {
      image: "./onGearImage/fCloudboomStrike.webp",
      price: "329,000",
      route:
        "https://www.on.com/ko-kr/products/cloudboom-strike-3we3047/womens/white-horizon-shoes-3WE30473195",
    },
    {
      image: "./onGearImage/fCloudmonster2.webp",
      price: "₩219,000",
      route:
        "https://www.on.com/ko-kr/products/cloudmonster-2-w-3we1011/womens/nimbus-arctic-shoes-3WE10113373",
    },
    {
      image: "./onGearImage/fCloud6AllDay.webp",
      price: "₩189,000",
      route:
        "https://www.on.com/ko-kr/products/cloud-6-3wf1006/womens/black-white-shoes-3WF10060299",
    },
    {
      image: "./onGearImage/fCloudrunner2B.webp",
      price: "₩189,000",
      route:
        "https://www.on.com/ko-kr/products/cloudrunner-2-w-3we1013/womens/eclipse-black-shoes-3WE10130264",
    },
    {
      image: "./onGearImage/fCloudrunner2W.webp",
      price: "₩189,000",
      route:
        "https://www.on.com/ko-kr/products/cloudrunner-2-w-3we1013/womens/frost-white-shoes-3WE10130622",
    },
    {
      image: "./onGearImage/fCloudsurferMax.webp",
      price: "₩219,000",
      route:
        "https://www.on.com/ko-kr/products/cloudsurfer-max-w-3wf3022/womens/ivory-arctic-shoes-3WF30224290",
    },
    {
      image: "./onGearImage/fCloudsurferNextLumos.webp",
      price: "₩189,000",
      route:
        "https://www.on.com/ko-kr/products/cloudsurfer-next-3we3054/womens/black-dew-shoes-3WE30543714",
    },
    {
      image: "./onGearImage/fCloudtilt.webp",
      price: "₩199,000",
      route:
        "https://www.on.com/ko-kr/products/cloudtilt-w-3we1005/womens/eclipse-lilac-shoes-3WE10053703",
    },
    {
      image: "./onGearImage/fCloudvista2.webp",
      price: "₩189,000",
      route:
        "https://www.on.com/ko-kr/products/cloudvista-2-3we3013/womens/pelican-ghost-shoes-3WE30133563",
    },
  ],
};

// Extract product name from image path
function extractProductName(imagePath) {
  // imagePath 예: "./onGearImage/mCloudmonster2.webp"
  const filename = imagePath.split("/").pop(); // "mCloudmonster2.webp"
  const nameWithoutExt = filename.replace(/\.[^/.]+$/, ""); // "mCloudmonster2"
  const productName = nameWithoutExt.replace(/^[mf]/, ""); // "Cloudmonster2" (성별 표시 제거)

  // 카멜케이스를 읽기 쉬운 형태로 변환
  return productName.replace(/([A-Z])/g, " $1").trim();
}

// Initialize Product Images with click handlers and price
function initProductImage(imageId, imagePath, price, productRoute) {
  const container = document.getElementById(imageId);
  if (!container) return;

  // Clear existing content
  container.innerHTML = "";

  // Create image element
  const img = document.createElement("img");
  img.src = imagePath;
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";
  img.style.borderRadius = "8px";
  img.style.display = "block";
  img.style.cursor = "pointer";

  container.appendChild(img);

  // Add click handler to product content
  const productContent = container.closest(".product-content");
  if (productContent) {
    productContent.style.cursor = "pointer";
    productContent.addEventListener("click", function (e) {
      e.preventDefault();
      window.location.href = productRoute;
    });

    // Update price
    const priceElement = productContent.querySelector(".product-info p");
    if (priceElement) {
      priceElement.textContent = price;
    }
  }

  return { container, img };
}

// Update all product images and info
function updateProductImages(gender) {
  const products = productData[gender];

  products.forEach((product, index) => {
    const productName = extractProductName(product.image);
    const price = product.price;
    const route = product.route;

    // Update image
    initProductImage(`image-${index + 1}`, product.image, price, route);

    // Update product info (name)
    const container = document.getElementById(`image-${index + 1}`);
    if (container) {
      const productContent = container.closest(".product-content");
      if (productContent) {
        const productInfo = productContent.querySelector(".product-info h3");
        if (productInfo) {
          productInfo.textContent = productName;
        }
      }
    }
  });
}

// Initialize all product images
document.addEventListener("DOMContentLoaded", function () {
  // 0) 초기 로드 (남성)
  updateProductImages("male");

  // =========================
  // 1) 3D Mouse Tracking (최적화)
  //    - 카드 전체에서 좌표 감지
  //    - 내부 .product-image-container 만 transform
  //    - rAF 루프 + rect 캐시로 프레임 드랍 최소화
  // =========================
  const cards = document.querySelectorAll(".floating-product");

  let hovered = null;       // 현재 hover 중인 카드 (.floating-product)
  let lastEvt = null;       // 마지막 pointermove 이벤트
  let rectCache = null;     // hovered 카드의 DOMRect 캐시
  let ticking = false;      // rAF 루프 on/off

  cards.forEach(card => {
    card.addEventListener("pointerenter", () => {
      hovered = card;
      rectCache = card.getBoundingClientRect(); // 진입 시 1회 계산
    });

    card.addEventListener("pointermove", (e) => {
      if (hovered !== card) return;
      lastEvt = e;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(drawFrame);
      }
    }, { passive: true });

    card.addEventListener("pointerleave", () => {
      const img = card.querySelector(".product-image-container");
      const info = card.querySelector(".product-info");
      if (img) {
        img.style.transition = "transform .28s ease";
        img.style.transform  = "translateZ(40px) scale(1.02)"; // CSS 기본 상태로 복귀
        setTimeout(() => (img.style.transition = ""), 300);
      }
      if (info) {
        info.style.transition = "transform .28s ease";
        info.style.transform  = "translateZ(0)";
        setTimeout(() => (info.style.transition = ""), 300);
      }
      hovered = null;
      lastEvt = null;
      rectCache = null;
    });
  });

  function drawFrame() {
    if (!hovered || !lastEvt || !rectCache) {
      ticking = false;
      return;
    }

    const card = hovered;
    const img  = card.querySelector(".product-image-container");
    const info = card.querySelector(".product-info");

    const x  = lastEvt.clientX - rectCache.left;
    const y  = lastEvt.clientY - rectCache.top;
    const cx = rectCache.width  / 2;
    const cy = rectCache.height / 2;

    // 깊이/패럴랙스 강도 (필요 시 숫자 조절)
    const tx = (x - cx) / 10;
    const ty = (y - cy) / 10;
    const rx = -(y - cy) / 10;
    const ry =  (x - cx) / 40;

    if (img) {
      img.style.transform =
        `translate3d(${tx}px, ${ty}px, 20px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.05)`;
    }
    if (info) {
      info.style.transform = `translate3d(${-(tx/6)}px, ${-(ty/6)}px, 0)`;
    }

    // 다음 프레임 스케줄 (지속 이동 시에만)
    requestAnimationFrame(() => {
      ticking = false;
      if (hovered && lastEvt) {
        ticking = true;
        requestAnimationFrame(drawFrame);
      }
    });
  }

  // =========================
  // 2) 성별 버튼 (페인트 먼저 → 이미지 갱신)
  // =========================
  const genderButtons = document.querySelectorAll(".gender-btn");

  genderButtons.forEach((button) => {
    button.addEventListener("click", function () {
      genderButtons.forEach((btn) => btn.classList.remove("active"));
      this.classList.add("active");

      const selectedGender = this.getAttribute("data-gender");

      // 끊김 방지: UI 페인트 먼저 하고 다음 프레임에 이미지 갱신
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          updateProductImages(selectedGender);
        });
      });
    });
  });

  // =========================
  // 3) Intersection Observer (그대로 유지)
  // =========================
  const observerOptions = {
    threshold: 0.2,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");

        // Stagger animation for products
        if (entry.target.classList.contains("con3-flexBox")) {
          const boxes = entry.target.querySelectorAll(".floating-product");
          boxes.forEach((product, index) => {
            setTimeout(() => {
              product.style.animation = `floatingProduct 3s ease-in-out infinite, fadeInUp 0.6s ease forwards`;
            }, index * 100);
          });
        }
      }
    });
  }, observerOptions);

  document.querySelectorAll(".con-box").forEach((section) => {
    observer.observe(section);
  });

  // =========================
  // 4) 앵커 스무스 스크롤 (그대로)
  // =========================
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  // =========================
  // 5) 커서 글로우 (레이아웃 비용 최소화)
  //    - transform으로만 이동
  //    - 상품 hover시에만 활성화
  // =========================
  const cursorGlow = document.createElement("div");
  cursorGlow.style.position = "fixed";
  cursorGlow.style.width = "300px";
  cursorGlow.style.height = "300px";
  cursorGlow.style.borderRadius = "50%";
  cursorGlow.style.background =
    "radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)";
  cursorGlow.style.pointerEvents = "none";
  cursorGlow.style.transition = "opacity .25s ease";
  cursorGlow.style.opacity = "0";
  cursorGlow.style.zIndex = "9999";
  cursorGlow.style.transform = "translate3d(-9999px,-9999px,0)";
  document.body.appendChild(cursorGlow);

  let glowActive = false;

  document.addEventListener("pointermove", (e) => {
    if (!glowActive) return;
    cursorGlow.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
  }, { passive: true });

  cards.forEach(card => {
    card.addEventListener("pointerenter", () => {
      glowActive = true;
      cursorGlow.style.opacity = "1";
    });
    card.addEventListener("pointerleave", () => {
      glowActive = false;
      cursorGlow.style.opacity = "0";
    });
  });

  // (선택) 마우스트레일 로직은 성능 위해 생략/유지 선택 가능
});


// 자세히 보기 버튼
document.querySelector(".con-box4-buttonBox").addEventListener("click", () => {
  window.open(
    "https://www.on.com/ko-kr/?srsltid=AfmBOopJbv_K0c-F0RsrUz6mfpNJ2z-j05tYoqkHJo9bZuJi6Uv1ak-Q",
    "_blank"
  );
});

// Add CSS animations dynamically
const style = document.createElement("style");
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }

  @keyframes pulse {
    0%, 100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.1);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes floatingProduct {
    0%, 100% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
  }
`;
document.head.appendChild(style);
