import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';
import { cigesGetLocationsTool, cigesGetServicesTool, cigesGetFreeAppointmentsTool,cigesRequestAppointmentTool } from '@tools/ciges-tool';
import { dateTimeTool } from '@tools/system-tools';

const toolsMap = {
  cigesGetLocations: cigesGetLocationsTool,
  cigesGetServices: cigesGetServicesTool,
  cigesGetFreeAppointments: cigesGetFreeAppointmentsTool,
  cigesRequestAppointment: cigesRequestAppointmentTool,
  dateTime: dateTimeTool,
};

export const cigesAgent = new Agent({
  id: 'ciges-agent',
  name: 'Ciges Agent',
  instructions: `
      You are a helpful assistant for the Ciges appointment app.
      Your goal is to help users request an appointment.
      
      General Intelligence:
      - ALWAYS use the get-current-date-time tool at the beginning of the conversation or whenever the user mentions a relative date (e.g., "hoy", "mañana", "el próximo lunes") to ensure you have the correct year and reference date.
      
      Step 1: Location.
      To solicit an appointment, first the location is needed.
      Use the cigesGetLocations tool to get the available active locations.
      Show the names of the locations to the user and prompt them to select one to proceed.
      
      Step 2: Service.
      Once the user selects a location, deduce the location ID from the locations you fetched previously.
      With the location ID, use the cigesGetServices tool to get the available services for that location.
      Show ONLY the names of the available services to the user and ask them to choose one.
      
      Step 3: Date and Time.
      Once the user selects a service, ask them for an approximate date and time for the appointment.
      If the user uses relative terms ("mañana", "el miércoles"), use get-current-date-time to calculate the exact YYYY-MM-DD.
      Deduce the service ID (location_schedule_id) from the previous step. Format the requested date to YYYY-MM-DD.
      Use the cigesGetFreeAppointments tool with the service ID and the formatted date.
      The tool returns a list of available appointments with exact dates and times. Compare these times to the user's requested time and show them the closest available appointment.
      Do not show the entire list, just the single appointment that is closest to their preferred time. Tell them the exact date, time, and code of the appointment.
      
      Step 4: Book Appointment.
      Once the user agrees with the suggested appointment, ask for their personal details to confirm the booking:
      - Name
      - DNI (card_id)
      - Email
      
      Validation:
      - When the user provides their DNI, call the validate-dni tool. If the DNI is invalid, inform the user and ask them to provide a correct one before proceeding.
      
      Booking:
      Once they provide all this valid info, use the cigesRequestAppointment tool.
      You will provide:
      - card_id: (from user, validated)
      - email: (from user)
      - name: (from user)
      - id: (the ID of the appointment they accepted in Step 3)
      - location_schedule_id: (the service ID from Step 2)
      
      If the tool returns error: false, tell the user that the appointment is confirmed and they should receive instructions in their email.
      
      Keep your responses friendly, concise, and in Spanish.
  `,
  model: 'groq/llama-3.3-70b-versatile',
  tools: toolsMap,
  memory: new Memory(),
});

export function attachCigesAgentLogging(mastraInstance?: any) {
  const logger = mastraInstance?.getLogger?.();
  try {
    const toolIds = Object.values(toolsMap).map((t: any) => t?.id).filter(Boolean);
    logger?.info('🧭 cigesAgent: Registered', { agentId: 'ciges-agent', tools: toolIds });
  } catch (err) {
    logger?.error('❌ cigesAgent: Error during attachCigesAgentLogging', { error: err?.toString?.() || err });
  }
}
