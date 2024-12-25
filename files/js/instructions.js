document.addEventListener('DOMContentLoaded', () => {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.gallery-content');
    const indicators = document.querySelectorAll('.indicator');

    function resetSlides() {
        slides.forEach((slide) => slide.classList.add('hidden'));
        indicators.forEach((indicator) => indicator.textContent = '');
    }

    function updateSlide(index) {
        resetSlides();
        slides[index].classList.remove('hidden');
        indicators[index].textContent = index + 1;
        currentSlide = index;
    }

    function changeSlide(direction) {
        const newIndex = (currentSlide + direction + slides.length) % slides.length;
        updateSlide(newIndex);
    }

    function setSlide(index) {
        updateSlide(index);
    }

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => setSlide(index));
    });

    document.querySelector('.arrow.left').addEventListener('click', () => changeSlide(-1));
    document.querySelector('.arrow.right').addEventListener('click', () => changeSlide(1));

    updateSlide(0);
});
