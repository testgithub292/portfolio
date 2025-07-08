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
 