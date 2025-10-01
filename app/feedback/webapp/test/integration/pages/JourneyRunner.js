sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"com/sap/feedback/test/integration/pages/IncidentsForFeedbackList",
	"com/sap/feedback/test/integration/pages/IncidentsForFeedbackObjectPage"
], function (JourneyRunner, IncidentsForFeedbackList, IncidentsForFeedbackObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('com/sap/feedback') + '/test/flp.html#app-preview',
        pages: {
			onTheIncidentsForFeedbackList: IncidentsForFeedbackList,
			onTheIncidentsForFeedbackObjectPage: IncidentsForFeedbackObjectPage
        },
        async: true
    });

    return runner;
});

