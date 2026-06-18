const cds = require('@sap/cds')
const logger = require('cf-nodejs-logging-support');
class ProcessorService extends cds.ApplicationService {
  /** Registering custom event handlers */
  async init() {
    logger.info("Initialize processors endpoint!");
    this.S4bupa = await cds.connect.to('OP_API_BUSINESS_PARTNER_SRV');
    this.remoteService = await cds.connect.to('RemoteService');
    this.before("UPDATE", "Incidents", (req) => this.onUpdate(req));
    this.before("CREATE", "Incidents", (req) => this.changeUrgencyDueToSubject(req.data));
    this.on('READ', 'Customers', (req) => this.onCustomerRead(req));
    this.on(['CREATE','UPDATE'], 'Incidents', (req, next) => this.onCustomerCache(req, next));
    //try {
    
    // } catch (err) {
    //   logger.error('Failed to connect to Business Partner service:', err.message);
    //   this.S4bupa = null; // Service will be unavailable
    // }
    
    return super.init();
  }

  async onCustomerCache(req, next) {
  const { Customers } = this.entities;
  const newCustomerId = req.data.customer_ID;
  const result = await next();

  if (!this.S4bupa) {
  logger.warn('Business Partner service unavailable - skipping customer cache');
  return result;
   }

  const { BusinessPartner } = this.remoteService.entities;
  if (newCustomerId && newCustomerId !== "") {
    console.log('>> CREATE or UPDATE customer!');

    // Expands are required as the runtime does not support path expressions for remote services
    const customer = await this.S4bupa.run(SELECT.one(BusinessPartner, bp => {
      bp('*');
        bp.addresses(address => {
          address('email', 'phoneNumber');
            address.email(emails => {
              emails('email')
            });
            address.phoneNumber(phoneNumber => {
              phoneNumber('phone')
            })
        })
    }).where({ ID: newCustomerId }));

    if(customer) {
      customer.email = customer.addresses[0]?.email[0]?.email;
      customer.phone = customer.addresses[0]?.phoneNumber[0]?.phone;
      delete customer.addresses;
      delete customer.name;
      await UPSERT.into(Customers).entries(customer);
    }
  }
  return result;
}
    
async onCustomerRead(req) {
      // if (!this.S4bupa) {
      //   logger.warn('Business Partner service unavailable - cannot read customers');
      //   return req.reject(503, 'Business Partner service temporarily unavailable');
      // }

      console.log('>> delegating to S4 service...', req.query);
      let { limit, one } = req.query.SELECT
      if(!limit) limit = { rows: { val: 55 }, offset: { val: 0 } } //default limit to 55 rows

      const { BusinessPartner } = this.remoteService.entities;
      const query = SELECT.from(BusinessPartner, bp => {
        bp('*');
        bp.addresses(address => {
          address('email');
          address.email(emails => {
            emails('email');
          });
        });
      }).limit(limit)

      if(one){
        // support for single entity read
        query.where({ ID: req.data.ID });
      }
      // Expands are required as the runtime does not support path expressions for remote services
      let result = await this.S4bupa.run(query);

      result = result.map((bp) => ({
        ID: bp.ID,
        name: bp.name,
        email: (bp.addresses[0]?.email[0]?.email || ''),
        firstName: bp.firstName,
        lastName: bp.lastName,
      }));

      // Explicitly set $count so the values show up in the value help in the UI
      result.$count = 1000;
      console.log("after result", result);
      return result;
    }   
  changeUrgencyDueToSubject(data) {
    if (data) {
      const incidents = Array.isArray(data) ? data : [data];
      incidents.forEach((incident) => {
        if (incident.title?.toLowerCase().includes("urgent")) {
          incident.urgency = { code: "H", descr: "High" };
        }
      });
    }
  }

  /** Custom Validation */
  async onUpdate (req) {
   logger.info("Request id is: ", req.data.ID);
    const { status_code } = await SELECT.one(req.subject, i => i.status_code).where({ ID: req.data.ID })
    logger.info("Status code is: ", status_code);
    
    // Check if incident is being closed
    if (req.data.status_code === 'C' && status_code !== 'C') {
      logger.info("Incident is being closed, triggering feedback service...");
      // Pass the request context to maintain authentication context
      await this.triggerFeedbackService(req.data.ID, req);
    }
    
    if (status_code === 'C'){
      try {
        throw new Error("Incident state doesn't allow further modifications.");
      } catch (e) {
        logger.error("Incident state doesn't allow further modifications.", e);
        logger.info("Logging code: Entering mutex state, only one change is allowed at a time.");
        logger.info("Incident state is being update from In process to Closed, by external process (Inbound API)");
      }
      return req.reject(`Incident state doesn't allow further modifications.`)
    }
  }

  /** Trigger Feedback Service when incident is closed */
  async triggerFeedbackService(incidentID, originalReq) {
    try {
      const { Incidents, Customers } = this.entities;
      
      // Get the incident details
      const incident = await SELECT.one.from(Incidents, i => {
        i('*');
        i.customer(c => c('*'));
      }).where({ ID: incidentID });
      
      if (!incident) {
        logger.error(`Incident with ID ${incidentID} not found`);
        return;
      }
      
      // Calculate processing time
      const createdAt = new Date(incident.createdAt);
      const now = new Date();
      const processingTimeHours = Math.round((now - createdAt) / (1000 * 60 * 60));
      
      // Prepare data for feedback service
      const feedbackData = {
        originalIncidentID: incidentID,
        title: incident.title || 'Unknown Title',
        customer: incident.customer ? incident.customer.name || `${incident.customer.firstName} ${incident.customer.lastName}`.trim() : 'Unknown Customer',
        customerEmail: incident.customer ? incident.customer.email : '',
        urgency: incident.urgency_code || 'M',
        category: 'General', // Default category, can be enhanced
        processingTime: processingTimeHours
      };
      
      // Get feedback service URL from environment (set by MTA deployment)
      const feedbackServiceUrl = process.env.FEEDBACK_SERVICE_URL || 'http://localhost:4006';
      
      // Prepare headers with JWT token forwarding
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // CAP-compliant JWT token forwarding approaches
      let jwtToken = null;
      
      // Method 1: Get JWT from the original request (most reliable)
      if (originalReq?.headers?.authorization) {
        jwtToken = originalReq.headers.authorization;
        logger.info('Using JWT token from original request');
      }
      // Method 2: Try to get JWT from current CAP context user
      else if (originalReq?.user?.tokenInfo?.getTokenValue) {
        jwtToken = `Bearer ${originalReq.user.tokenInfo.getTokenValue()}`;
        logger.info('Using JWT token from CAP user context');
      }
      // Method 3: Try to get JWT from cds.context (fallback)
      else if (cds.context?.req?.headers?.authorization) {
        jwtToken = cds.context.req.headers.authorization;
        logger.info('Using JWT token from CDS context');
      }
      
      // Add JWT token to headers if available
      if (jwtToken) {
        headers['Authorization'] = jwtToken;
        logger.info('Forwarding JWT token to feedback service');
      } else {
        logger.warn('No JWT token available for forwarding - service call may fail if authentication is required');
      }
      
      // Make API call to feedback service with token forwarding
      const response = await fetch(`${feedbackServiceUrl}/odata/v4/feedback/createClosedIncident`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(feedbackData)
      });
      
      if (response.ok) {
        logger.info(`Successfully created closed incident entry for incident ${incidentID}`);
      } else {
        const errorText = await response.text();
        logger.error(`Failed to create closed incident entry: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
    } catch (error) {
      logger.error(`Error triggering feedback service for incident ${incidentID}:`, error);
    }
  }

}
module.exports = { ProcessorService }
