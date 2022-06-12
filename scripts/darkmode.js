// JavaScript Document
let darkMode = localStorage.getItem("darkMode");
const DarkModeToggle = document.querySelector("#dark-mode-toggle");

//check if darmode is enabled
//if it's enabled, turn it off
//if it's disabled, turn it on

const enableDarkMode = () => {
	// 1. add the class darkmode to the body
	document.body.classList.add("darkmode");
	// 2. update darkMode in localStorage
	localStorage.setItem("darkMode", "enabled");
} 

const disableDarkMode = () => {
	// 1. add the class darkmode to the body
	document.body.classList.remove("darkmode");
	// 2. update darkMode in localStorage
	localStorage.setItem("darkMode", null);
} 

DarkModeToggle.addEventListener("click", () => {
	if (darkMode !== "enabled") {
		enableDarkMode();
	}
});