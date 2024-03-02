// JavaScript Document
$(document).ready(function(){
  $(window).scroll(function(){
   var scroll = $(window).scrollTop();
	if (scroll > 10) {
		$(".header").css("background" , "#060714");
		$(".header").css("box-shadow" , "0px 26px 30px -10px rgba(0, 0, 0, 0.69)");
	}

	else{
		$(".header").css("background" , "rgba(0,0,0,0.00)");
		$(".header").css("box-shadow" , "0px 26px 30px -10px rgba(0, 0, 0, 0.0)");
	}
  })
})