using { sap.capire.feedback as my } from '../db/schema';

/**
 * Service for managing incident feedback and ratings
 */
service FeedbackService {
    
    @odata.draft.enabled
    entity ClosedIncidents as projection on my.ClosedIncidents;
    
    // Direct access to closed incidents - no filter for now  
    @odata.draft.enabled
    entity IncidentsForFeedback as projection on my.ClosedIncidents;
    
    // Value help for rating
    @readonly
    entity RatingValues {
        key Value : Integer;
        Description : String;
    }
    
    // Action to create a closed incident entry
    action createClosedIncident(
        originalIncidentID : String,
        title : String,
        customer : String,
        customerEmail : String,
        urgency : String,
        category : String,
        processingTime : Integer
    ) returns ClosedIncidents;
}

// Annotations for UI

annotate FeedbackService.ClosedIncidents with {
    originalIncidentID @title: 'Original Incident ID';
    title @title: 'Incident Title';
    customer @title: 'Customer';
    customerEmail @title: 'Customer Email';
    closedAt @title: 'Closed At';
    urgency @title: 'Urgency';
    feedback @title: 'Feedback' @UI.MultiLineText;
    rating @title: 'Rating';
    feedbackProvided @title: 'Feedback Provided';
    processingTime @title: 'Processing Time (hours)';
    category @title: 'Category';
}

annotate FeedbackService.IncidentsForFeedback with {
    originalIncidentID @title: 'Original Incident ID' @readonly;
    title @title: 'Incident Title' @readonly;
    customer @title: 'Customer' @readonly;
    customerEmail @title: 'Customer Email' @readonly;
    closedAt @title: 'Closed At' @readonly;
    urgency @title: 'Urgency' @readonly;
    feedback @title: 'Feedback' @UI.MultiLineText;
    rating @title: 'Rating';
    feedbackProvided @title: 'Feedback Provided' @readonly;
    processingTime @title: 'Processing Time (hours)' @readonly;
    category @title: 'Category' @readonly;
}

// UI annotations are now handled in app/feedback/annotations.cds
