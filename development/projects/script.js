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
				breakpoint: 1450,
				settings: {
					slidesToScroll: 4,
					slidesToShow: 4
				}
			},
			{
				breakpoint: 1200,
				settings: {
					slidesToScroll: 3,
					slidesToShow: 3
				}
			},
			{
				breakpoint: 900,
				settings: {
					slidesToScroll: 2,
					slidesToShow: 2
				}
			},
			{
				breakpoint: 600,
				settings: {
					slidesToScroll: 1,
					slidesToShow: 1
				}
			},
		]
  });
});  