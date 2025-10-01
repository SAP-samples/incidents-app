sap.ui.define(
    ["sap/fe/core/AppComponent", "sap/ui/performance/trace/FESR"],
    function (Component, FESR) {
        "use strict";
        FESR.setActive(true, new URI(sap.ui.require.toUrl("com.sap.feedback")).path() + "/fesr");
        return Component.extend("com.sap.feedback.Component", {
            metadata: {
                manifest: "json"
            }
        });
    }
);