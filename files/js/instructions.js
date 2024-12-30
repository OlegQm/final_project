let currentSlide = 0;
let slides, indicators;

document.addEventListener('DOMContentLoaded', () => {
    slides = document.querySelectorAll('.gallery-content');
    indicators = document.querySelectorAll('.indicator');

    updateSlide(0);

    indicators.forEach((indicator, index) => {
        indicator.textContent = index + 1;
        indicator.addEventListener('click', () => setSlide(index));
    });
    updateSlide(0);

    document.querySelector('.arrow.left').addEventListener('click', () => changeSlide(-1));
    document.querySelector('.arrow.right').addEventListener('click', () => changeSlide(1));
});

function changeSlide(direction) {
    const totalSlides = slides.length;

    slides[currentSlide].classList.add('hidden');
    indicators[currentSlide].classList.remove('active');

    currentSlide = (currentSlide + direction + totalSlides) % totalSlides;

    slides[currentSlide].classList.remove('hidden');
    indicators[currentSlide].classList.add('active');
}

function setSlide(index) {
    slides[currentSlide].classList.add('hidden');
    indicators[currentSlide].classList.remove('active');

    currentSlide = index;

    slides[currentSlide].classList.remove('hidden');
    indicators[currentSlide].classList.add('active');
}

function updateSlide(index) {
    slides.forEach((slide, i) => {
        slide.classList.toggle('hidden', i !== index);
    });
    indicators.forEach((indicator, i) => {
        indicator.classList.toggle('active', i === index);
    });
    currentSlide = index;
}
