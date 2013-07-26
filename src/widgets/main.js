


define([
	'widgets/widget',
	'widgets/formInput',
	'widgets/resizer',
	'widgets/svg',
	'widgets/pages/loginPage'
], function(
	widget,
	formInput,
	resizer,
	svg,
	login
) {


	return {
		widget:widget,
		formInput:formInput,
		resizer:resizer,
		svg:svg,
		login:login
	};
});


