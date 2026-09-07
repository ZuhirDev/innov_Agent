import { z } from 'zod';
import { createTool } from '@mastra/core/tools';
import CONFIG from '@/config/config';

const mask = (s?: string) => {
  if (typeof s !== 'string') return s;
  if (s.length <= 4) return s;
  return `${s.slice(0, 2)}...${s.slice(-2)}`;
};

export const cigesGetLocationsTool = createTool({
  id: 'ciges-get-locations',
  description: 'Fetches active locations for the ciges appointment app',
  inputSchema: z.object({}),
  outputSchema: z.object({
    locations: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
        address: z.string(),
      })
    ),
  }),
  execute: async (input, { mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔍 cigesGetLocationsTool: Fetching active locations');
    try {
      const response = await fetch(`${CONFIG.CIGES_API_URL}/location/active`);
      const data = await response.json();

      const locations = Object.values(data).map((loc: any) => ({
        id: loc.id,
        name: loc.name?.es || 'Unknown',
        address: loc.address || '',
      }));
      logger?.info('✅ cigesGetLocationsTool: Success', { resultCount: locations.length });
      return { locations };
    } catch (error) {
      logger?.error('❌ cigesGetLocationsTool: Error fetching Ciges locations', { error: error?.toString?.() || error });
      console.error('Error fetching Ciges locations:', error);
      return { locations: [] };
    }
  },
});

export const cigesGetServicesTool = createTool({
  id: 'ciges-get-services',
  description: 'Fetches active services for a given location id in the ciges appointment app',
  inputSchema: z.object({
    location_id: z.number().describe('The ID of the location to get services for'),
  }),
  outputSchema: z.object({
    services: z.array(
      z.object({
        id: z.number(),
        name: z.string(),
      })
    ),
  }),
  execute: async ({ location_id }, { mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔍 cigesGetServicesTool: Fetching services for location', { location_id });
    try {
      const response = await fetch(`${CONFIG.CIGES_API_URL}/location/schedule/${location_id}`);
      const data = await response.json();

      const servicesArray = Array.isArray(data) ? data : Object.values(data);
      const services = servicesArray
        .filter((service: any) => service.appointments === true)
        .map((service: any) => ({
          id: service.id,
          name: service.name?.es || 'Unknown',
        }));
      logger?.info('✅ cigesGetServicesTool: Success', { resultCount: services.length });
      return { services };
    } catch (error) {
      logger?.error('❌ cigesGetServicesTool: Error fetching services', { error: error?.toString?.() || error });
      console.error('Error fetching Ciges services:', error);
      return { services: [] };
    }
  },
});

export const cigesGetFreeAppointmentsTool = createTool({
  id: 'ciges-get-appointments',
  description: 'Fetches free appointments given a location_schedule_id (service ID) and a date',
  inputSchema: z.object({
    location_schedule_id: z.number().describe('The ID of the service (location_schedule_id)'),
    date: z.string().describe('The date in YYYY-MM-DD format to search appointments for'),
  }),
  outputSchema: z.object({
    appointments: z.array(
      z.object({
        id: z.number(),
        date: z.string(),
        code: z.string(),
      })
    ),
  }),
  execute: async ({ location_schedule_id, date }, { mastra }) => {
    const logger = mastra?.getLogger();
    logger?.info('🔍 cigesGetFreeAppointmentsTool: Fetching free appointments', { location_schedule_id, date });
    try {
      const response = await fetch(`${CONFIG.CIGES_API_URL}/appointment/free/${location_schedule_id}/${date}`);
      const data = await response.json();
      const appointments = Array.isArray(data?.appointments) ? data.appointments : [];
      logger?.info('✅ cigesGetFreeAppointmentsTool: Success', { count: appointments.length, sample: appointments?.[0] ?? null });
      return { appointments };
    } catch (error) {
      logger?.error('❌ cigesGetFreeAppointmentsTool: Error fetching free appointments', { error: error?.toString?.() || error });
      console.error('Error fetching Ciges free appointments:', error);
      return { appointments: [] };
    }
  },
});

export const cigesRequestAppointmentTool = createTool({
  id: 'ciges-request-appointment',
  description: 'Books an appointment with the given details',
  inputSchema: z.object({
    id: z.number().describe('The ID of the appointment selected from ciges-get-appointments'),
    location_schedule_id: z.number().describe('The ID of the service (location_schedule_id)'),
    card_id: z.string().describe('The users DNI or identification string'),
    email: z.string().email().describe('The users email address'),
    name: z.string().describe('The users name'),
  }),
  outputSchema: z.object({
    error: z.boolean(),
    message: z.string(),
  }),
  execute: async ({ id, location_schedule_id, card_id, email, name }, { mastra }) => {
    const logger = mastra?.getLogger();
    const maskedCard = mask(card_id);
    const maskedEmail = mask(email);
    logger?.info('🔁 cigesRequestAppointmentTool: Requesting appointment', { id, location_schedule_id, email: maskedEmail, card_id: maskedCard });
    try {
      const payload = {
        card_id,
        comments: "",
        custom_fields: null,
        email,
        external_id: "",
        id,
        location_schedule_id,
        name,
        phone: "",
        phone_att: 0,
        recaptcha: null,
        remote: 0,
        survey: [],
        survey_id: null
      };

      const response = await fetch(`${CONFIG.CIGES_API_URL}/appointment/request-appointment`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      logger?.info('✅ cigesRequestAppointmentTool: Response received', { error: data?.error, message: data?.message });
      return { 
        error: data.error || false, 
        message: data.message || 'Error occurred'
      };
    } catch (error) {
      logger?.error('❌ cigesRequestAppointmentTool: Error requesting appointment', { error: error?.toString?.() || error });
      console.error('Error requesting appointment:', error);
      return { error: true, message: 'Internal tool error occurred' };
    }
  },
});
