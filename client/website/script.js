
// Custom Alert Modal Function
window.showCustomAlert = function(message) {
  const modal = document.getElementById('customAlertModal');
  const msgEl = document.getElementById('customAlertMessage');
  const okBtn = document.getElementById('customAlertOkBtn');
  
  if (modal && msgEl && okBtn) {
    msgEl.textContent = message;
    modal.classList.add('show');
    okBtn.onclick = () => {
      modal.classList.remove('show');
    };
  } else {
    // Fallback if HTML is missing
    console.warn(message);
  }
};

// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

const domainCards = document.querySelectorAll(".domain-card");
const selectedDomain = document.getElementById("selectedDomain");
const form = document.getElementById("applicationForm");
const submitButton = document.getElementById("submit-button");
const buttonText = document.getElementById("button-text");

// File Upload Elements
const fileUploadContainer = document.getElementById('fileUploadContainer');
const resumeFileInput = document.getElementById('resumeFile');
const uploadArea = document.getElementById('uploadArea');
const filePreview = document.getElementById('filePreview');
const fileNameDisplay = document.getElementById('fileNameDisplay');
const removeFileBtn = document.getElementById('removeFileBtn');
const uploadProgressContainer = document.getElementById('uploadProgressContainer');
const uploadProgressBar = document.getElementById('uploadProgressBar');

let selectedFile = null;

// Domain Selection
domainCards.forEach(card => {
  card.addEventListener("click", () => {
    const domain = card.dataset.domain;
    selectedDomain.value = domain;

    domainCards.forEach(c => c.classList.remove("active-domain"));
    card.classList.add("active-domain");
    document.getElementById("apply").scrollIntoView({ behavior: "smooth" });
  });
});

// Plan Selection
const planCards = document.querySelectorAll(".plan-card");
const selectedPlan = document.getElementById("selectedPlan");

planCards.forEach(card => {
  card.addEventListener("click", () => {
    const plan = card.dataset.plan;
    selectedPlan.value = plan;

    planCards.forEach(c => c.classList.remove("active-plan"));
    card.classList.add("active-plan");
  });
});

// File Upload Logic
uploadArea.addEventListener('click', () => resumeFileInput.click());

['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  fileUploadContainer.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

['dragenter', 'dragover'].forEach(eventName => {
  fileUploadContainer.addEventListener(eventName, () => {
    fileUploadContainer.classList.add('dragover');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  fileUploadContainer.addEventListener(eventName, () => {
    fileUploadContainer.classList.remove('dragover');
  }, false);
});

fileUploadContainer.addEventListener('drop', (e) => {
  const dt = e.dataTransfer;
  const files = dt.files;
  handleFiles(files);
});

resumeFileInput.addEventListener('change', function() {
  handleFiles(this.files);
});

function handleFiles(files) {
  if (files.length === 0) return;
  const file = files[0];

  if (file.type !== 'application/pdf') {
    showCustomAlert("❌ Only PDF files are allowed.");
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showCustomAlert("❌ Maximum file size is 5MB.");
    return;
  }

  selectedFile = file;
  
  // Update UI
  uploadArea.style.display = 'none';
  filePreview.style.display = 'flex';
  fileNameDisplay.textContent = file.name;
}

removeFileBtn.addEventListener('click', () => {
  selectedFile = null;
  resumeFileInput.value = '';
  
  // Update UI
  uploadArea.style.display = 'block';
  filePreview.style.display = 'none';
  uploadProgressContainer.style.display = 'none';
  uploadProgressBar.style.width = '0%';
});

// Helper function to upload file via XHR to show progress
async function uploadResumeToServer(file) {
  return new Promise((resolve, reject) => {
    uploadProgressContainer.style.display = 'block';
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-resume', true);
    
    xhr.upload.onprogress = function(e) {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        uploadProgressBar.style.width = percentComplete + '%';
      }
    };
    
    xhr.onload = function() {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText);
        resolve(response);
      } else {
        const response = JSON.parse(xhr.responseText);
        reject(new Error(response.message || 'File upload failed.'));
      }
    };
    
    xhr.onerror = function() {
      reject(new Error('Network error during file upload.'));
    };
    
    const formData = new FormData();
    formData.append('resume', file);
    
    xhr.send(formData);
  });
}

// Custom Modals Logic
const modalTriggers = document.querySelectorAll('.modal-trigger, .policy-link');
const customModals = document.querySelectorAll('.custom-modal-overlay');
const closeButtons = document.querySelectorAll('.custom-modal-close');

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  customModals.forEach(modal => {
    modal.classList.remove('show');
  });
  document.body.style.overflow = '';
}

modalTriggers.forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.preventDefault();
    const modalId = trigger.getAttribute('data-modal');
    openModal(modalId);
  });
});

closeButtons.forEach(btn => {
  btn.addEventListener('click', closeModal);
});

customModals.forEach(modal => {
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Form Submit - Initiates Razorpay Checkout
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (selectedDomain.value === "") {
    showCustomAlert("⚠️ Please select an internship domain.");
    return;
  }

  if (!selectedFile) {
    showCustomAlert("⚠️ Please upload your resume (PDF only).");
    return;
  }
  
  const agreeTerms = document.getElementById('agreeTerms');
  if (agreeTerms && !agreeTerms.checked) {
    showCustomAlert("⚠️ Please agree to the Privacy Policy & Terms & Conditions.");
    return;
  }

  setLoading(true);

  try {
    const planEl = document.getElementById("selectedPlan");
    const plan = planEl ? planEl.value : "Gold";

    // 1. Upload Resume to Cloudinary first
    buttonText.textContent = "Uploading Resume...";
    const uploadData = await uploadResumeToServer(selectedFile);

    // 2. Create Razorpay Payment Order on the backend
    buttonText.textContent = "Initiating Payment Gateway...";
    const orderResponse = await fetch("/api/payment/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan })
    });

    const orderData = await orderResponse.json();
    if (!orderResponse.ok) {
      throw new Error(orderData.message || "Failed to initiate payment transaction.");
    }

    // 3. Open Razorpay Checkout Modal
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: "NextGenZ Tech",
      description: "Internship Application Fee",
      image: "assets/logo.png", // Added brand logo support
      order_id: orderData.orderId,
      handler: async function (response) {
        try {
          setLoading(true);
          buttonText.textContent = "Verifying Payment & Submitting...";

          const applicationData = {
            fullName: document.getElementById("fullName").value,
            email: document.getElementById("email").value,
            phone: document.getElementById("phone").value,
            college: document.getElementById("college").value,
            course: document.getElementById("course").value,
            year: document.getElementById("year").value,
            domain: selectedDomain.value,
            plan: plan,
            resume: {
              url: uploadData.fileUrl,
              publicId: uploadData.publicId,
              fileName: selectedFile.name
            },
            linkedin: document.getElementById("linkedin").value,
            github: document.getElementById("github").value,
            whyJoin: document.getElementById("whyJoin").value,

            // Razorpay verify details
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature
          };

          const submitResponse = await fetch("/api/submit-application", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(applicationData)
          });

          const submitData = await submitResponse.json();
          if (!submitResponse.ok) {
            throw new Error(submitData.error || "Failed to submit verified application.");
          }

          // Open success modal
          openModal('successModal');
        } catch (submitErr) {
          console.error("Submission Error:", submitErr);
          showCustomAlert(`❌ Application Error: ${submitErr.message}`);
        } finally {
          setLoading(false);
        }
      },
      prefill: {
        name: document.getElementById("fullName").value,
        email: document.getElementById("email").value,
        contact: document.getElementById("phone").value
      },
      notes: {
        domain: selectedDomain.value,
        plan: plan
      },
      theme: {
        color: "#3b82f6" // Brand blue theme matching NextGenZ aesthetics
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
          showCustomAlert("⚠️ Payment process cancelled.");
        }
      }
    };

    const rzp = new Razorpay(options);
    rzp.open();

  } catch (err) {
    console.error("Payment Gateway Error:", err);
    showCustomAlert("⚠️ Failed to load payment gateway: " + err.message);
    setLoading(false);
  }
});

// Handle UPI Modal
const cancelUpiBtn = document.getElementById("cancel-upi");
const submitUpiBtn = document.getElementById("submit-upi-btn");
const upiModal = document.getElementById("upi-modal");
const utrInput = document.getElementById("utr-input");

// --- Payment Screenshot Logic Start ---
const screenshotUploadContainer = document.getElementById("screenshotUploadContainer");
const screenshotFileInput = document.getElementById("payment-screenshot");
const screenshotUploadArea = document.getElementById("screenshotUploadArea");
const screenshotPreviewContainer = document.getElementById("screenshotPreviewContainer");
const screenshotPreviewImage = document.getElementById("screenshotPreviewImage");
const screenshotFileName = document.getElementById("screenshotFileName");
const removeScreenshotBtn = document.getElementById("removeScreenshotBtn");
let selectedScreenshot = null;

if (screenshotUploadArea) {
  screenshotUploadArea.addEventListener('click', () => screenshotFileInput.click());
  
  // Enter key support for accessibility
  screenshotUploadArea.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      screenshotFileInput.click();
    }
  });

  screenshotFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleScreenshotSelection(e.target.files[0]);
    }
  });

  removeScreenshotBtn.addEventListener('click', () => {
    selectedScreenshot = null;
    screenshotFileInput.value = '';
    screenshotUploadArea.style.display = 'block';
    screenshotPreviewContainer.style.display = 'none';
    screenshotPreviewImage.src = '';
  });
  
  // Enter key support for removing file
  removeScreenshotBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      removeScreenshotBtn.click();
    }
  });
}

function handleScreenshotSelection(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    showCustomAlert("⚠️ Invalid file type. Please upload a PNG, JPG, or WEBP image.");
    screenshotFileInput.value = '';
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showCustomAlert("⚠️ File size exceeds 5MB limit. Please choose a smaller image.");
    screenshotFileInput.value = '';
    return;
  }

  selectedScreenshot = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    screenshotPreviewImage.src = e.target.result;
    screenshotUploadArea.style.display = 'none';
    screenshotPreviewContainer.style.display = 'flex';
    screenshotFileName.textContent = file.name;
  };
  reader.readAsDataURL(file);
}

async function uploadScreenshotToServer(file) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('paymentScreenshot', file);
    
    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/upload-payment-screenshot', true);
    xhr.onload = function() {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        try {
          const resp = JSON.parse(xhr.responseText);
          reject(new Error(resp.message || "Failed to upload screenshot."));
        } catch(e) {
          reject(new Error("Failed to upload screenshot."));
        }
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(formData);
  });
}
// --- Payment Screenshot Logic End ---

// Manual UPI logic removed in favor of integrated Razorpay checkout

// Helpers
function setLoading(isLoading) {
  if (isLoading) {
    submitButton.disabled = true;
    buttonText.textContent = "Processing...";
  } else {
    submitButton.disabled = false;
    buttonText.textContent = "Apply Now 🚀";
  }
}

// =========================================================================
//                              TESTIMONIALS CAROUSEL
// =========================================================================
function initCarousel() {
  const track = document.getElementById('testimonialTrack');
  const prevBtn = document.getElementById('prevTestimonial');
  const nextBtn = document.getElementById('nextTestimonial');
  const dotsContainer = document.getElementById('testimonialDots');

  if (track && prevBtn && nextBtn && dotsContainer) {
    dotsContainer.innerHTML = '';
    const cards = Array.from(track.children);
    if (cards.length === 0 || cards[0].tagName === 'P') return;

    const firstCard = cards[0];
    let currentIndex = 0;
    let autoPlayInterval;

    // Create dots
    cards.forEach((_, index) => {
      const dot = document.createElement('div');
      dot.classList.add('dot');
      if (index === 0) dot.classList.add('active');
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);

    function updateCarousel() {
      const dynamicCardWidth = firstCard.offsetWidth + 30;
      track.style.transform = `translateX(-${currentIndex * dynamicCardWidth}px)`;
      dots.forEach(dot => dot.classList.remove('active'));
      if (dots[currentIndex]) {
        dots[currentIndex].classList.add('active');
      }
    }

    function goToSlide(index) {
      currentIndex = index;
      updateCarousel();
      resetAutoPlay();
    }

    function nextSlide() {
      currentIndex++;
      if (currentIndex > cards.length - 1) {
        currentIndex = 0;
      }
      updateCarousel();
    }

    function prevSlide() {
      currentIndex--;
      if (currentIndex < 0) {
        currentIndex = cards.length - 1;
      }
      updateCarousel();
    }

    // Clone navigation buttons to avoid duplicate event listeners
    const newNextBtn = nextBtn.cloneNode(true);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
    const newPrevBtn = prevBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);

    newNextBtn.addEventListener('click', () => {
      nextSlide();
      resetAutoPlay();
    });

    newPrevBtn.addEventListener('click', () => {
      prevSlide();
      resetAutoPlay();
    });

    function startAutoPlay() {
      clearInterval(autoPlayInterval);
      autoPlayInterval = setInterval(nextSlide, 4000);
    }

    function resetAutoPlay() {
      clearInterval(autoPlayInterval);
      startAutoPlay();
    }

    startAutoPlay();
    
    // Pause on hover
    track.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
    track.addEventListener('mouseleave', startAutoPlay);

    // Initial positioning calculation
    updateCarousel();
  }
}

// =========================================================================
//                                   FAQ
// =========================================================================
const faqQuestions = document.querySelectorAll('.faq-question');
const faqSearch = document.getElementById('faqSearch');
const toggleAllFaq = document.getElementById('toggleAllFaq');

if (faqQuestions.length > 0) {
  // Accordion Logic
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.parentElement;
      const isActive = item.classList.contains('active');

      // Close all other FAQs
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('active');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });

      if (!isActive) {
        item.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // Search Logic
  if(faqSearch) {
      faqSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        document.querySelectorAll('.faq-item').forEach(item => {
          const text = item.textContent.toLowerCase();
          if (text.includes(searchTerm)) {
            item.style.display = 'block';
          } else {
            item.style.display = 'none';
          }
        });
      });
  }

  // Expand/Collapse All
  if(toggleAllFaq) {
      let allExpanded = false;
      toggleAllFaq.addEventListener('click', () => {
        allExpanded = !allExpanded;
        toggleAllFaq.textContent = allExpanded ? 'Collapse All' : 'Expand All';
        
        document.querySelectorAll('.faq-item').forEach(item => {
          if (allExpanded) {
            item.classList.add('active');
            item.querySelector('.faq-question').setAttribute('aria-expanded', 'true');
          } else {
            item.classList.remove('active');
            item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          }
        });
      });
  }
}

// =========================================================================
//                  CUSTOM CURSOR & 3D TILT
// =========================================================================
function init3DTilt() {
  // 3D Tilt Effect for Cards
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      const rotateX = ((y - centerY) / centerY) * -10; // Max tilt 10deg
      const rotateY = ((x - centerX) / centerX) * 10;
      
      card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });
    
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      card.style.transition = 'transform 0.5s ease, border-color 0.4s ease, box-shadow 0.4s ease';
    });
    card.addEventListener('mouseenter', () => {
      card.style.transition = 'border-color 0.4s ease, box-shadow 0.4s ease'; // remove transform transition for smooth tracking
    });
  });
}

// =========================================================================
//                  SCROLL REVEAL & STAGGER ANIMATIONS FALLBACK
// =========================================================================
function initScrollReveal() {
  // Sibling Index Fallback for stagger animations
  if(!CSS.supports('animation-delay: calc(sibling-index() * 0.1s)')){
    const grids = document.querySelectorAll('.grid');
    grids.forEach(grid => {
      [...grid.children].forEach((el, index) => {
        el.style.setProperty('--sibling-index', index + 1);
      });
    });
  }

  // View Timeline Fallback for scroll entry effects
  if (!CSS.supports('(animation-timeline: view()) and (animation-range: entry 0% cover 100%)')) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        const ratio = entry.intersectionRatio;
        
        if (ratio > 0.95) {
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'perspective(1000px) rotateX(0deg) scale(1)';
            entry.target.classList.add('active');
            observer.unobserve(entry.target);
        } else {
            entry.target.style.opacity = ratio;
            entry.target.style.transform = `perspective(1000px) rotateX(${-90 + ratio * 90}deg) scale(${0.8 + ratio * 0.2})`;
        }
      });
    }, { threshold: Array.from({length: 101}, (_, i) => i / 100) });

    document.querySelectorAll('.reveal, .card').forEach((el) => {
      // Prepare elements for JS animation
      el.style.opacity = '0';
      el.style.transform = 'perspective(1000px) rotateX(-90deg) scale(0.8)';
      el.style.backfaceVisibility = 'hidden';
      observer.observe(el);
    });
  }
}

// --- Review & Rating System --- //
function initStarRating() {
  const starIcons = document.querySelectorAll('.star-rating i');
  const ratingInput = document.getElementById('reviewRating');

  if (!starIcons.length || !ratingInput) return;

  function updateStars(rating) {
    starIcons.forEach(star => {
      const starRating = parseInt(star.getAttribute('data-rating'));
      if (starRating <= rating) {
        star.classList.add('active');
      } else {
        star.classList.remove('active');
      }
    });
  }

  function handleStarClick(e) {
    const ratingValue = e.target.getAttribute('data-rating');
    ratingInput.value = ratingValue;
    
    starIcons.forEach(star => {
      star.setAttribute('aria-checked', star.getAttribute('data-rating') === ratingValue ? 'true' : 'false');
    });
    
    updateStars(parseInt(ratingValue));
  }

  function handleStarHover(e) {
    const hoverValue = parseInt(e.target.getAttribute('data-rating'));
    starIcons.forEach(star => {
      const starRating = parseInt(star.getAttribute('data-rating'));
      if (starRating <= hoverValue) {
        star.classList.add('hover');
      } else {
        star.classList.remove('hover');
      }
    });
  }

  function handleStarMouseOut() {
    starIcons.forEach(star => star.classList.remove('hover'));
  }

  starIcons.forEach(star => {
    star.addEventListener('click', handleStarClick);
    star.addEventListener('mouseover', handleStarHover);
    star.addEventListener('mouseout', handleStarMouseOut);
    
    star.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleStarClick(e);
      }
    });
  });
}

const reviewForm = document.getElementById('reviewForm');
const submitReviewBtn = document.getElementById('submitReviewBtn');

if (reviewForm) {
  reviewForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitReviewBtn.innerHTML = 'Submitting... <i class="fas fa-spinner fa-spin"></i>';
    submitReviewBtn.disabled = true;

    try {
      const reviewRatingValue = document.getElementById('reviewRating').value;
      if (!reviewRatingValue) {
        showCustomAlert("❌ Please select a rating before submitting.");
        submitReviewBtn.innerHTML = 'Submit Review 🚀';
        submitReviewBtn.disabled = false;
        return;
      }

      const formData = new FormData();
      formData.append('fullName', document.getElementById('reviewName').value);
      formData.append('email', document.getElementById('reviewEmail').value);
      formData.append('domain', document.getElementById('reviewDomain').value);
      formData.append('rating', reviewRatingValue);
      formData.append('review', document.getElementById('reviewText').value);

      const imageInput = document.getElementById('reviewImage');
      if (imageInput && imageInput.files[0]) {
        formData.append('profileImage', imageInput.files[0]);
      }

      const response = await fetch('/api/reviews', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      if (result.success) {
        showCustomAlert("✅ Review submitted successfully! It is awaiting admin approval.");
        reviewForm.reset();
        document.querySelectorAll('.star-rating i').forEach(s => s.classList.remove('active'));
      } else {
        const msg = result.errors ? result.errors[0].msg : result.message;
        showCustomAlert("❌ Error: " + msg);
      }
    } catch (error) {
      showCustomAlert("❌ Submission failed. Please try again.");
      console.error(error);
    } finally {
      submitReviewBtn.innerHTML = 'Submit Review';
      submitReviewBtn.disabled = false;
    }
  });
}

async function loadTestimonials() {
  const track = document.getElementById('testimonialTrack');
  if (!track) return;
  
  try {
    const response = await fetch('/api/reviews');
    const result = await response.json();
    
    if (result.success && result.data.length > 0) {
      track.innerHTML = '';
      result.data.forEach(review => {
        let starsHtml = '';
        for(let i=0; i<5; i++) {
          if (i < review.rating) {
            starsHtml += '<i class="fas fa-star" style="color: #ffcc00;"></i>';
          } else {
            starsHtml += '<i class="fas fa-star" style="color: #555;"></i>';
          }
        }
        
        let avatarHtml = '';
        if (review.profileImage && review.profileImage.url) {
          avatarHtml = `<img src="${review.profileImage.url}" alt="${review.fullName}" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover;">`;
        } else {
          const initials = review.fullName.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
          avatarHtml = `<div class="avatar">${initials}</div>`;
        }

        const card = document.createElement('div');
        card.className = 'testimonial-card';
        card.innerHTML = DOMPurify.sanitize(`
          <i class="fas fa-quote-left quote-icon"></i>
          <div class="stars">${starsHtml}</div>
          <p class="testimonial-text">"${review.review}"</p>
          <div class="student-profile">
            ${avatarHtml}
            <div class="student-info">
              <h4>${review.fullName}</h4>
              <span>${review.domain}</span>
            </div>
          </div>
        `);
        track.appendChild(card);
      });
      initCarousel();
    } else {
      track.innerHTML = '<p style="text-align: center; width: 100%; color: var(--text-color);">Check back soon for new testimonials!</p>';
    }
  } catch (error) {
    console.error("Error loading testimonials:", error);
    track.innerHTML = '<p style="text-align: center; width: 100%; color: var(--text-color);">Could not load testimonials at this time.</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init3DTilt();
  initScrollReveal();
  initStarRating();
  initCarousel();
  loadTestimonials();

  // UPI requires no URL parameters upon completion, it just reloads.
  const successGotItBtn = document.getElementById('successGotItBtn');
  const successCloseBtn = document.getElementById('successCloseBtn');
  if (successGotItBtn) {
    successGotItBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }
  if (successCloseBtn) {
    successCloseBtn.addEventListener('click', () => {
      window.location.reload();
    });
  }

  // Always scroll to top on refresh
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);

  loadTestimonials();

  // Mobile Menu Toggle
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // Close menu when a link is clicked
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });
  }

  // IntersectionObserver for Scroll Reveal Fallback/Implementation
  const revealElements = document.querySelectorAll('.reveal, .card, .domain-card, .plan-card, .founder-section');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealElements.forEach(el => {
    revealObserver.observe(el);
  });

  // Sticky Header Theme Switcher
  const header = document.querySelector('header');
  const darkSections = document.querySelectorAll('.bg-dark, #contact');
  
  if (header && darkSections.length > 0) {
    window.addEventListener('scroll', () => {
      let isInDark = false;
      const headerRect = header.getBoundingClientRect();
      const headerBottom = headerRect.bottom;

      darkSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= headerBottom && rect.bottom >= headerBottom) {
          isInDark = true;
        }
      });

      if (isInDark) {
        document.body.classList.add('bg-dark-active');
      } else {
        document.body.classList.remove('bg-dark-active');
      }
    });
  }

});