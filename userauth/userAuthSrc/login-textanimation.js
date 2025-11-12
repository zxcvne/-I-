/* ----------------------------
   2025.11.10
   Author: Hong Sumin(sumin5400@gmail.com)
   Description: login page textanimation JavaScript
----------------------------- */

(function () {
  document.addEventListener("DOMContentLoaded", function () {
    const host = document.querySelector(".ad-img-box");
    if (!host) return;

    // 중복 실행 방지
    if (host.querySelector(".bg-text-overlay")) return;

    // 텍스트 기준 > relative
    if (getComputedStyle(host).position === "static") {
      host.style.position = "relative";
    }

    const overlay = document.createElement("div");
    overlay.className = "bg-text-overlay";

    // colL > 좌 섹션 / colR > 우 섹션
    const colL = document.createElement("div");
    const colR = document.createElement("div");
    colL.className = "bg-col left";
    colR.className = "bg-col right";

    // 트랙
    const trackL = document.createElement("div");
    const trackR = document.createElement("div");
    trackL.className = "bg-track";
    trackR.className = "bg-track";

    
    const makeChunk = (text) => {
      const chunk = document.createElement("div");
      chunk.className = "bg-chunk";
      const line = document.createElement("div");
      line.className = "bg-line";
      line.textContent = text;
      const line2 = line.cloneNode(true);
      chunk.append(line, line2);
      return chunk;
    };

    const text = "RUN TOGETHER SEOUL. ".repeat(10);

    trackL.append(makeChunk(text), makeChunk(text));
    trackR.append(makeChunk(text), makeChunk(text));

    colL.appendChild(trackL);
    colR.appendChild(trackR);
    overlay.append(colL, colR);

    // 배경을 맨 아래에 깔기
    host.insertBefore(overlay, host.firstChild);
  });
})();

