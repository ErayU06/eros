(function(){
"use strict";

/* ================= HERO: autoplay video + auto-cycling captions ================= */
var hero = document.getElementById('hero');
var video = document.getElementById('hero-video');
var poster = document.getElementById('poster');
var lineEl = document.getElementById('hero-line');
var lineVisual = document.getElementById('hero-line-visual');
var ctaRow = document.getElementById('hero-cta-row');
var scrollCue = document.getElementById('scroll-cue');

var VIDEO_URL = 'assets/hero-scrub.mp4';
var POSTER_URL = 'assets/hero-poster.jpg';

var CAPTIONS = [
  'Bazı şeylere direnmek mümkün değildir.',
  'Tek kaynak kakao. Yavaşça işlenir, hiç acele ettirilmez.',
  'Kısayolu yok. Sadece kakao, şeker ve sabır.'
];

var reducedMotionMQ = matchMedia('(prefers-reduced-motion: reduce)');
var capIndex = 0;
var capTimer = null;

poster.style.backgroundImage = "url('" + POSTER_URL + "')";

function fadeToNextCaption(){
  lineEl.classList.remove('is-in');
  setTimeout(function(){
    capIndex = (capIndex + 1) % CAPTIONS.length;
    lineVisual.textContent = CAPTIONS[capIndex];
    lineEl.classList.add('is-in');
  }, 650);
}

function startCaptionCycle(){
  if (capTimer) return;
  capTimer = setInterval(fadeToNextCaption, 5200);
}
function stopCaptionCycle(){
  if (capTimer) { clearInterval(capTimer); capTimer = null; }
}

function startVideo(){
  video.muted = true;
  video.src = VIDEO_URL;
  video.load();
  video.addEventListener('canplay', function(){
    hero.classList.add('video-ready');
    video.play().catch(function(){ /* autoplay blocked; poster stays visible */ });
  }, { once: true });
  video.addEventListener('error', function(){
    hero.classList.remove('video-ready');
  });
}

function playHero(){
  lineEl.classList.add('is-in');
  ctaRow.classList.add('is-in');
  if (reducedMotionMQ.matches) return;
  startVideo();
  startCaptionCycle();
}

reducedMotionMQ.addEventListener('change', function(e){
  if (e.matches) {
    stopCaptionCycle();
    video.pause();
  } else {
    if (!video.src) startVideo();
    else video.play().catch(function(){});
    startCaptionCycle();
  }
});

playHero();

/* hide the scroll cue once the visitor has started scrolling */
window.addEventListener('scroll', function(){
  if (!scrollCue) return;
  scrollCue.style.opacity = window.scrollY > 80 ? '0' : '';
}, { passive: true });

/* ================= visibility pause (below-fold looping CSS animations) ================= */
document.addEventListener('visibilitychange', function(){
  document.body.classList.toggle('paused', document.hidden);
});

/* ================= reduced motion: pin below-fold entrances ================= */
function pinToFinalStates(){
  document.querySelectorAll('.divider path').forEach(function(p){ p.style.strokeDashoffset = '0'; });
  document.querySelectorAll('.reveal, .card, .process-step, .quote').forEach(function(el){ el.classList.add('in'); });
  var melt = document.getElementById('melt-target');
  if (melt) { melt.style.setProperty('--melt', '100'); }
  var reveal = document.getElementById('melt-reveal');
  if (reveal) reveal.classList.add('in');
}
reducedMotionMQ.addEventListener('change', function(e){
  if (e.matches) pinToFinalStates();
});
if (reducedMotionMQ.matches) pinToFinalStates();

/* ================= below-fold entrances ================= */
var revealIO = new IntersectionObserver(function(entries){
  entries.forEach(function(entry){
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      revealIO.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.reveal, .card, .process-step, .quote, .divider').forEach(function(el, i){
  el.style.transitionDelay = (Math.min(i % 4, 3) * 90) + 'ms';
  revealIO.observe(el);
});

/* ================= FAQ accordion ================= */
document.querySelectorAll('.faq-item').forEach(function(item){
  var btn = item.querySelector('.faq-q');
  var answer = item.querySelector('.faq-a');
  btn.addEventListener('click', function(){
    var isOpen = item.getAttribute('data-open') === 'true';
    document.querySelectorAll('.faq-item').forEach(function(other){
      other.setAttribute('data-open', 'false');
      other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
      other.querySelector('.faq-a').style.maxHeight = null;
    });
    if (!isOpen) {
      item.setAttribute('data-open', 'true');
      btn.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
});

/* ================= the one interactive moment: press-and-hold melt ================= */
(function(){
  var target = document.getElementById('melt-target');
  var label = document.getElementById('melt-label');
  var reveal = document.getElementById('melt-reveal');
  if (!target) return;

  var progress = 0, holding = false, raf = null, done = false;
  var reduced = reducedMotionMQ.matches;

  if (reduced) {
    target.style.setProperty('--melt', '100');
    if (label) label.textContent = 'ERİDİ';
    if (reveal) reveal.classList.add('in');
    done = true;
  }

  function loop(){
    if (holding) progress = Math.min(100, progress + 1.6);
    else progress = Math.max(0, progress - 2.2);
    target.style.setProperty('--melt', progress.toFixed(1));
    if (progress >= 100 && !done) {
      done = true;
      if (label) label.textContent = 'ERİDİ';
      if (reveal) reveal.classList.add('in');
    }
    if (progress > 0 && progress < 100) {
      raf = requestAnimationFrame(loop);
    } else {
      raf = null;
    }
  }
  function start(e){
    if (done || reduced) return;
    holding = true;
    if (raf === null) raf = requestAnimationFrame(loop);
    e.preventDefault();
  }
  function stop(){
    holding = false;
    if (raf === null && progress > 0) raf = requestAnimationFrame(loop);
  }
  target.addEventListener('pointerdown', start);
  target.addEventListener('pointerup', stop);
  target.addEventListener('pointerleave', stop);
  target.addEventListener('pointercancel', stop);
  target.addEventListener('keydown', function(e){
    if (e.key === ' ' || e.key === 'Enter') start(e);
  });
  target.addEventListener('keyup', function(e){
    if (e.key === ' ' || e.key === 'Enter') stop();
  });
})();

/* ================= order form: JS-only success state ================= */
(function(){
  var form = document.getElementById('order-form');
  if (!form) return;
  form.addEventListener('submit', function(e){
    e.preventDefault();
    form.classList.add('sent');
  });
})();

})();
