// static/js/login-animations.js

// Wait for DOM to be ready
document.addEventListener("DOMContentLoaded", () => {
  const title = document.querySelector(".glass-container h2");

  if (title) {
    // Split text into characters
    const split = new SplitType(title, { types: "chars" });

    // Animate characters with GSAP
    gsap.from(split.chars, {
      y: 40,
      opacity: 0,
      stagger: 0.05,
      duration: 1,
      ease: "back.out(1.7)",
    });
  }
});

