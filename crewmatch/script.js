// ===== Smooth Scroll for Navigation Links =====
document.querySelectorAll('.nav-link').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== Navbar Background Change on Scroll =====
const navbar = document.querySelector('.navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    // use darker translucent background on scroll to fit dark theme
    if (window.scrollY > 60) {
      navbar.style.background = 'linear-gradient(90deg, rgba(10,8,25,0.95), rgba(20,10,45,0.95))';
      navbar.style.boxShadow = '0 6px 22px rgba(138,43,226,0.12)';
    } else {
      navbar.style.background = 'rgba(15, 15, 30, 0.65)';
      navbar.style.boxShadow = 'none';
    }
  });
}

// ===== Ripple Effect for Buttons =====
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('click', function (e) {
    const circle = document.createElement('span');
    const diameter = Math.max(this.clientWidth, this.clientHeight);
    const radius = diameter / 2;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${e.offsetX - radius}px`;
    circle.style.top = `${e.offsetY - radius}px`;
    circle.classList.add('ripple');

    const ripple = this.querySelector('.ripple');
    if (ripple) ripple.remove();

    this.appendChild(circle);
  });
});

// ===== Auto Carousel for Events Section =====
const carousel = document.querySelector('.events-carousel');
if (carousel) {
  let scrollAmount = 0;
  setInterval(() => {
    scrollAmount += 300;
    if (scrollAmount >= carousel.scrollWidth - carousel.clientWidth) {
      scrollAmount = 0;
    }
    carousel.scrollTo({
      left: scrollAmount,
      behavior: 'smooth'
    });
  }, 4000);
}

// ===== Floating Shape Animation on Mouse Move =====
const shapes = document.querySelectorAll('.hero-background div');
if (shapes.length > 0) {
  document.addEventListener('mousemove', e => {
    shapes.forEach((shape, i) => {
      const speed = (i + 1) * 0.03;
      const x = (window.innerWidth / 2 - e.pageX) * speed;
      const y = (window.innerHeight / 2 - e.pageY) * speed;
      shape.style.transform = `translate(${x}px, ${y}px)`;
    });
  });
}

// ===== Scroll Reveal Animation =====
const revealElements = document.querySelectorAll('.feature-card, .step-card, .event-card');
const revealOnScroll = () => {
  const triggerBottom = window.innerHeight * 0.85;
  revealElements.forEach(el => {
    const boxTop = el.getBoundingClientRect().top;
    if (boxTop < triggerBottom) {
      el.classList.add('show');
    } else {
      el.classList.remove('show');
    }
  });
};
window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

// ===== Modal (Get Started Button) =====
const modal = document.getElementById("get-started-modal");
const openBtns = document.querySelectorAll(".cta-btn, .hero-cta, .cta-large-btn");
const closeBtn = document.querySelector(".close-btn");

if (modal && closeBtn) {
  openBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modal.style.display = "flex";
    });
  });

  closeBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  window.addEventListener("click", e => {
    if (e.target === modal) modal.style.display = "none";
  });
}

// ===== Scroll to Top Button =====
const scrollTopBtn = document.getElementById("scrollTopBtn");

if (scrollTopBtn) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      scrollTopBtn.style.display = "block";
    } else {
      scrollTopBtn.style.display = "none";
    }
  });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

// ===== Dummy Form Submissions =====
document.querySelectorAll("form").forEach(form => {
  form.addEventListener("submit", e => {
    e.preventDefault();
    showSuccess("✅ Thank you! Your submission has been received.");
    form.reset();
    if (modal && modal.style.display === "flex") modal.style.display = "none";
  });
});

// ===== Nav Buttons: Groups & Profile =====
const groupsBtn = document.querySelector('.groups-btn');
if (groupsBtn) {
  groupsBtn.addEventListener('click', () => {
    window.location.href = 'groups.html';
  });
}

const profileBtn = document.getElementById('profileBtn');
function updateProfileButton() {
  const saved = localStorage.getItem('crewmatchProfile');
  if (profileBtn) {
    if (saved) {
      try {
        const p = JSON.parse(saved);
        profileBtn.textContent = p.fullName || 'Profile';
      } catch (e) {
        profileBtn.textContent = 'Profile';
      }
    } else {
      profileBtn.textContent = 'Profile';
    }
  }
}

if (profileBtn) {
  profileBtn.addEventListener('click', () => {
    window.location.href = 'profile.html';
  });
}

updateProfileButton();

// Update button if profile changes in another tab
window.addEventListener('storage', (e) => {
  if (e.key === 'crewmatchProfile') updateProfileButton();
});
