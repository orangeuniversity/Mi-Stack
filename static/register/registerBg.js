const totalImages = 11;
const randomNumber = Math.floor(Math.random() * totalImages) + 1;
const baseUrl = window.registerBaseUrl || '';
const bgImage = baseUrl + "image" + randomNumber + ".jpg";  // Add "image" prefix here
document.body.style.backgroundImage = "url('" + bgImage + "')";

