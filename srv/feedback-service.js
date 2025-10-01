const cds = require('@sap/cds');

class FeedbackService extends cds.ApplicationService {
    
    async init() {
        console.log('Initializing Feedback Service...');
        
        // Provide rating values for value help
        this.on('READ', 'RatingValues', async () => {
            return [
                { Value: 1, Description: 'Very Poor' },
                { Value: 2, Description: 'Poor' },
                { Value: 3, Description: 'Average' },
                { Value: 4, Description: 'Good' },
                { Value: 5, Description: 'Excellent' }
            ];
        });
        
        // Handle the createClosedIncident action
        this.on('createClosedIncident', async (req) => {
            const { ClosedIncidents } = this.entities;
            const {
                originalIncidentID,
                title,
                customer,
                customerEmail,
                urgency,
                category,
                processingTime
            } = req.data;
            
            console.log(`Creating closed incident entry for incident: ${originalIncidentID}`);
            
            const closedIncident = {
                originalIncidentID,
                title,
                customer,
                customerEmail,
                urgency,
                category,
                processingTime,
                closedAt: new Date().toISOString(),
                feedbackProvided: false
            };
            
            const result = await INSERT.into(ClosedIncidents).entries(closedIncident);
            
            console.log(`Closed incident created with ID: ${result.ID}`);
            return result;
        });
        
        // Handle the submitFeedback action
        this.on('submitFeedback', async (req) => {
            const { ClosedIncidents } = this.entities;
            const { incidentID, feedback, rating } = req.data;
            
            console.log(`Submitting feedback for incident: ${incidentID}`);
            
            // Validate rating
            if (rating < 1 || rating > 5) {
                throw new Error('Rating must be between 1 and 5');
            }
            
            // Update the incident with feedback
            const result = await UPDATE(ClosedIncidents)
                .set({
                    feedback,
                    rating,
                    feedbackProvided: true,
                    modifiedAt: new Date().toISOString()
                })
                .where({ ID: incidentID });
            
            if (result === 0) {
                throw new Error(`Incident with ID ${incidentID} not found`);
            }
            
            // Return the updated incident
            const updatedIncident = await SELECT.one.from(ClosedIncidents).where({ ID: incidentID });
            
            console.log(`Feedback submitted successfully for incident: ${incidentID}`);
            return updatedIncident;
        });
        
        // Validate before UPDATE
        this.before('UPDATE', 'ClosedIncidents', async (req) => {
            const { rating } = req.data;
            
            if (rating && (rating < 1 || rating > 5)) {
                req.error(400, 'Rating must be between 1 and 5');
            }
        });
        
        // Validate before UPDATE for IncidentsForFeedback
        this.before('UPDATE', 'IncidentsForFeedback', async (req) => {
            const { rating, feedback } = req.data;
            
            if (rating && (rating < 1 || rating > 5)) {
                req.error(400, 'Rating must be between 1 and 5');
            }
            
            // If feedback is being provided, mark feedbackProvided as true
            if (feedback || rating) {
                req.data.feedbackProvided = true;
            }
        });
        
        // Log after feedback submission for IncidentsForFeedback
        this.after('UPDATE', 'IncidentsForFeedback', async (incident, req) => {
            if (req.data.feedback !== undefined || req.data.rating !== undefined) {
                console.log(`Feedback provided for incident: ${incident.originalIncidentID} - Rating: ${incident.rating}/5`);
            }
        });
        
        // Log after successful creation
        this.after('CREATE', 'ClosedIncidents', async (incident, req) => {
            console.log(`Closed incident created: ${incident.originalIncidentID} for customer: ${incident.customer}`);
        });
        
        // Log after feedback submission
        this.after('UPDATE', 'ClosedIncidents', async (incident, req) => {
            if (req.data.feedbackProvided) {
                console.log(`Feedback received for incident: ${incident.originalIncidentID} - Rating: ${incident.rating}/5`);
            }
        });
        
        return super.init();
    }
}

module.exports = { FeedbackService };
