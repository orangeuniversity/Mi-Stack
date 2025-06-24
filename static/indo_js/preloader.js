function initPreloaderBackground() {
    const isGuest = document.body.classList.contains('guest-mode');
    if (!isGuest) {
      document.body.classList.add('preloader-done');
      document.querySelector('.preloader')?.classList.add('hidden');
      document.body.style.backgroundImage = "none";
      document.body.style.backgroundColor = "white";
      return;
    }
  
    const loadingText = new SplitType(".loading-text.initial", { types: "chars" });
    const completeText = new SplitType(".loading-text.complete", { types: "chars" });
    gsap.set(loadingText.chars, { opacity: 0, y: 100 });
    gsap.set(completeText.chars, { opacity: 0, y: 100 });
    gsap.set(".loading-text.complete", { y: "100%" });
  
    const width = window.innerWidth;
    const height = window.innerHeight;
    const rand = Math.floor(Math.random() * 1000);
    const url = `https://picsum.photos/${width}/${height}?random=${rand}`;
  
    gsap.to(loadingText.chars, {
      opacity: 1,
      y: 0,
      duration: 0.5,
      stagger: 0.05,
      ease: "power2.out"
    });
  
    fetch(url)
      .then(response => {
        const contentLength = response.headers.get('Content-Length');
        if (!response.ok) throw new Error("Network response was not ok");
        if (!contentLength) {
          return response.blob().then(blob => {
            updateProgress(100);
            return blob;
          });
        }
        const total = parseInt(contentLength, 10);
        let loaded = 0;
        const reader = response.body.getReader();
        const chunks = [];
        function read() {
          return reader.read().then(({ done, value }) => {
            if (done) return new Blob(chunks);
            loaded += value.byteLength;
            chunks.push(value);
            const percent = Math.round((loaded / total) * 100);
            updateProgress(percent);
            return read();
          });
        }
        return read();
      })
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        document.body.style.backgroundImage = `url('${objectUrl}')`;
        document.body.style.backgroundColor = "";
        playCompletion();
      })
      .catch(err => {
        console.error("Background image load failed:", err);
        playCompletion();
      });
  
    (function () {
      const canvas = document.getElementById('starfield');
      const ctx = canvas.getContext('2d');
      let w, h;
      let stars = [];
  
      function resize() {
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        initStars();
      }
  
      function initStars() {
        stars = [];
        const count = Math.floor((w * h) / 8000);
        for (let i = 0; i < count; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: Math.random() * 1.2 + 0.3,
            phase: Math.random() * Math.PI * 2,
            speed: Math.random() * 0.0005 + 0.0002
          });
        }
      }
  
      let lastTime = 0;
      function animateStars(time) {
        const delta = time - lastTime;
        lastTime = time;
        ctx.clearRect(0, 0, w, h);
        stars.forEach(s => {
          s.phase += s.speed * delta;
          const alpha = 0.5 + 0.5 * Math.sin(s.phase);
          ctx.fillStyle = `rgba(255,255,255,${alpha})`;
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });
        requestAnimationFrame(animateStars);
      }
  
      window.addEventListener('resize', resize);
      resize();
      requestAnimationFrame(animateStars);
    })();
  
    function updateProgress(p) {
      const clamped = Math.max(0, Math.min(100, p));
      const bar = document.querySelector(".preloader .progress-bar");
      const percEl = document.querySelector(".preloader .percentage");
      const pre = document.querySelector(".preloader");
      if (!bar || !percEl || !pre) return;
      bar.style.width = clamped + "%";
      percEl.textContent = clamped + "%";
      if (clamped >= 100) {
        setTimeout(() => {
          pre.classList.add("hidden");
          setTimeout(() => {
            if (pre.parentNode) pre.parentNode.removeChild(pre);
          }, 600);
        }, 300);
      }
    }
  
    function playCompletion() {
      const tl = gsap.timeline();
      tl.to(".loading-text.initial", { y: "-100%", duration: 0.5, ease: "power2.inOut" })
        .to(".loading-text.complete", { y: "0%", duration: 0.5, ease: "power2.inOut" }, "<")
        .to(".loading-text.complete .char", { opacity: 1, y: 0, duration: 0.3, stagger: 0.03, ease: "power2.out" }, "<0.2")
        .to(".preloader", { y: "-100vh", duration: 1, ease: "power2.inOut", delay: 0.8 })
        .set("body", { className: "+=preloader-done" }, "-=0.5")
        .set(".preloader", { display: "none" });
    }
  }
  