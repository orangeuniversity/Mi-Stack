// Randomly choose a background from 1 to 11
const totalImages = 11;
const randomNumber = Math.floor(Math.random() * totalImages) + 1;
const bgImage = bgImageBasePath + randomNumber + ".jpg";
document.body.style.backgroundImage = "url('" + bgImage + "')";

