'use client';

import { useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function LandingAnimations() {
  useEffect(() => {
    // Enable smooth scroll on HTML
    document.documentElement.style.scrollBehavior = 'smooth';

    const ctx = gsap.context(() => {
      // Fade up elements with .gsap-fade-up class
      gsap.utils.toArray('.gsap-fade-up').forEach((elem: any) => {
        gsap.fromTo(
          elem,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: elem,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });

      // Stagger child elements in .gsap-stagger container
      gsap.utils.toArray('.gsap-stagger').forEach((container: any) => {
        gsap.fromTo(
          container.children,
          { opacity: 0, y: 20 },
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            stagger: 0.1,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: container,
              start: 'top 85%',
              toggleActions: 'play none none none',
            },
          }
        );
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
