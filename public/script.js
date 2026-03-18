// JavaScript for Hero Slideshow
const heroSlideshow = document.getElementById('heroSlideshow');
const images = [
  'image1.jpg',
  'image2.jpg',
  'image3.jpg'
];
let currentIndex = 0;

function changeSlide() {
  heroSlideshow.style.backgroundImage = `url(${images[currentIndex]})`;
  currentIndex = (currentIndex + 1) % images.length;
}

setInterval(changeSlide, 5000);
changeSlide();