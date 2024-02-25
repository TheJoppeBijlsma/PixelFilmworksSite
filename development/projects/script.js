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
				breakpoint: 992,
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
			}
		]
  });
});  