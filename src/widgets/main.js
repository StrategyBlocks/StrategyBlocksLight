


define([
	'widgets/widget',
	'widgets/layoutWidget',
	'widgets/formInput',
	'widgets/resizer',
	'widgets/svg',
	'widgets/pages/loginPage'
], function(
	widget,
	layoutWidget,
	formInput,
	resizer,
	svg,
	login
) {


	return {
		widget:widget,
		layoutWidget:layoutWidget,
		formInput:formInput,
		resizer:resizer,
		svg:svg,
		login:login
	};
});


