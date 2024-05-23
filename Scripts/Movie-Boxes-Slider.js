// JavaScript Document
$(document).ready(function(){
  $('.slider-services').slick({
    dots: false,
    arrows: true,
		infinite: false,
		slidesToScroll: 5,
		slidesToShow: 5,
		accessibility: true,
		variableWidth: false,
		focusOnSelect: false,
		centerMode: false,
		responsive: [
			{
				breakpoint: 741,
				settings: {
					slidesToScroll: 2,
					slidesToShow: 2
				}
			}
		]
  });
	
	$('.slider-banner').slick({
    dots: true,
    arrows: true,
		infinite: true,
		slidesToScroll: 1,
		slidesToShow: 1,
		accessibility: true,
		variableWidth: false,
		focusOnSelect: false,
		centerMode: false,
		autoplay: true,
		autoplaySpeed: 3000,
  });
});  