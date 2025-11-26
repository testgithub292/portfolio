 // Enhanced Navbar Functionality
      document.addEventListener("DOMContentLoaded", function () {
        const mobileMenuBtn = document.getElementById("mobileMenuBtn");
        const navLinksContainer = document.getElementById("navLinksContainer");
        const navLinks = document.getElementById("navLinks");
        const navbar = document.querySelector(".navbar");

        // Mobile Menu Toggle
        mobileMenuBtn.addEventListener("click", function () {
          const isExpanded = this.getAttribute("aria-expanded") === "true";
          this.setAttribute("aria-expanded", !isExpanded);
          navLinksContainer.classList.toggle("active");
          document.body.style.overflow = navLinksContainer.classList.contains(
            "active"
          )
            ? "hidden"
            : "";
        });

        // Close menu when clicking on nav links
        navLinks.addEventListener("click", function (e) {
          if (e.target.classList.contains("nav-link")) {
            mobileMenuBtn.setAttribute("aria-expanded", "false");
            navLinksContainer.classList.remove("active");
            document.body.style.overflow = "";

            // Update active link
            document.querySelectorAll(".nav-link").forEach((link) => {
              link.classList.remove("active");
            });
            e.target.classList.add("active");
          }
        });

        // Close menu when clicking outside
        document.addEventListener("click", function (e) {
          if (
            !navLinksContainer.contains(e.target) &&
            !mobileMenuBtn.contains(e.target)
          ) {
            mobileMenuBtn.setAttribute("aria-expanded", "false");
            navLinksContainer.classList.remove("active");
            document.body.style.overflow = "";
          }
        });

        // Navbar scroll effect
        window.addEventListener("scroll", function () {
          navbar.classList.toggle("scrolled", window.scrollY > 50);
        });

        // Highlight active section in navbar
        window.addEventListener("scroll", function () {
          const scrollPosition = window.scrollY;

          document.querySelectorAll("section").forEach((section) => {
            const sectionTop = section.offsetTop - 100;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute("id");

            if (
              scrollPosition >= sectionTop &&
              scrollPosition < sectionTop + sectionHeight
            ) {
              document.querySelectorAll(".nav-link").forEach((link) => {
                link.classList.remove("active");
                if (link.getAttribute("href") === `#${sectionId}`) {
                  link.classList.add("active");
                }
              });
            }
          });
        });

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
          anchor.addEventListener("click", function (e) {
            e.preventDefault();

            const targetId = this.getAttribute("href");
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
              window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: "smooth",
              });
            }
          });
        });
      });
 





      /*------mailto form data ------------------*/
document.getElementById("contactForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const subject = document.getElementById("subject").value.trim() || "New Contact Form Submission";
  const message = document.getElementById("message").value.trim();

  const now = new Date();
  const submittedAt = now.toLocaleString();
  const pageURL = window.location.href;

  const body = [
    `📩 New Message from Contact Form`,
    ``,
    `👤 Name: ${name}`,
    `📧 Email: ${email}`,
    ``,
    `📝 Message: ${message}`,
    ``,
    `---`,
    `🌐 Page URL: ${pageURL}`,
    `📅 Submitted At: ${submittedAt}`,
    ``,
    `Sent via website contact form`
  ].join("\n");

  // Create mailto link and trigger
  const mailto = `mailto:phixxlabs@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  window.location.href = mailto;

  // ✅ Clear the form after submission
  document.getElementById("contactForm").reset();
});






/*--------------------------------------------*/

       // Email validation function
        function isValidEmail(email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        }

        // Character counter for message textarea
        const messageText = document.getElementById('messageText');
        const charCounter = document.getElementById('charCounter');

        messageText.addEventListener('input', function() {
            const currentLength = this.value.length;
            charCounter.textContent = `${currentLength}/300`;
            
            // Change color based on character count
            if (currentLength > 250) {
                charCounter.className = 'char-counter warning';
            } else if (currentLength >= 290) {
                charCounter.className = 'char-counter error';
            } else {
                charCounter.className = 'char-counter';
            }
        });

        // Form validation function
        function validateForm() {
            let isValid = true;
            
            // Reset error states
            document.querySelectorAll('.form-control').forEach(input => {
                input.classList.remove('error');
            });
            document.querySelectorAll('.error-message').forEach(error => {
                error.style.display = 'none';
            });

            // Name validation
            const name = document.getElementById('name').value.trim();
            if (name.length < 2) {
                document.getElementById('name').classList.add('error');
                document.getElementById('nameError').style.display = 'block';
                isValid = false;
            }

            // Email validation
            const email = document.getElementById('email').value.trim();
            if (!isValidEmail(email)) {
                document.getElementById('email').classList.add('error');
                document.getElementById('emailError').style.display = 'block';
                isValid = false;
            }

            // Message validation
            const message = document.getElementById('messageText').value.trim();
            if (message.length < 10 || message.length > 300) {
                document.getElementById('messageText').classList.add('error');
                document.getElementById('messageError').style.display = 'block';
                isValid = false;
            }

            return isValid;
        }

        // Form submission handler
        document.getElementById('contactForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate form before submission
            if (!validateForm()) {
                return;
            }
            
            // Get form values
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('messageText').value.trim();
            
            // Disable submit button
            const submitBtn = document.getElementById('submitBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
            
            // Save to Firestore
            db.collection('contactsphixxlabs').add({
                name: name,
                email: email,
                subject: subject,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            })
            .then((docRef) => {
                console.log('Document written with ID: ', docRef.id);
                showMessage('Message sent successfully!', 'success');
                document.getElementById('contactForm').reset();
                charCounter.textContent = '0/300';
                charCounter.className = 'char-counter';
            })
            .catch((error) => {
                console.error('Error adding document: ', error);
                showMessage('Error sending message. Please try again.', 'error');
            })
            .finally(() => {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.textContent = 'Send Message';
            });
        });

        // Function to show message
        function showMessage(text, type) {
            const messageDiv = document.getElementById('message');
            messageDiv.textContent = text;
            messageDiv.className = `message ${type}`;
            messageDiv.style.display = 'block';
            
            // Hide message after 5 seconds
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }

        // Real-time validation for better UX
        document.getElementById('email').addEventListener('blur', function() {
            const email = this.value.trim();
            if (email && !isValidEmail(email)) {
                this.classList.add('error');
                document.getElementById('emailError').style.display = 'block';
            }
        });

        document.getElementById('name').addEventListener('blur', function() {
            const name = this.value.trim();
            if (name && name.length < 2) {
                this.classList.add('error');
                document.getElementById('nameError').style.display = 'block';
            }
        });

        document.getElementById('messageText').addEventListener('blur', function() {
            const message = this.value.trim();
            if (message && (message.length < 10 || message.length > 300)) {
                this.classList.add('error');
                document.getElementById('messageError').style.display = 'block';
            }
        });

        // Remove error when user starts typing
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('input', function() {
                this.classList.remove('error');
                const errorId = this.id + 'Error';
                if (document.getElementById(errorId)) {
                    document.getElementById(errorId).style.display = 'none';
                }
            });
        });