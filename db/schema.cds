using { cuid, managed } from '@sap/cds/common';

namespace sap.capire.feedback;

/**
 * Closed incidents with feedback and rating capability
 */
entity ClosedIncidents : cuid, managed {
    originalIncidentID : String; // Reference to the original incident ID
    title              : String;
    customer           : String; // Customer name
    customerEmail      : String;
    closedAt           : DateTime;
    urgency            : String;
    feedback           : String;
    rating             : Integer enum {
        very_poor = 1;
        poor = 2;
        average = 3;
        good = 4;
        excellent = 5;
    };
    feedbackProvided   : Boolean default false;
    processingTime     : Integer; // in hours
    category           : String;
}
